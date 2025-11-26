import path from 'path';
import { Position, Range, Uri, window, workspace } from 'vscode';
import { FileCommand } from '../../cmd_line/commands/file';
import { VimError } from '../../error';
import { Mode } from '../../mode/mode';
import { doesFileExist } from '../../platform/node/fs';
import { Register } from '../../register/register';
import { RecordedState } from '../../state/recordedState';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { WordType } from '../../textobject/word';
import { reportFileInfo } from '../../util/statusBarTextUtils';
import { BaseCommand, RegisterAction } from '../base';

@RegisterAction
class ShowFileInfo extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['<C-g>'];

  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    reportFileInfo(position, vimState);
  }
}

@RegisterAction
class GoToAlternateFile extends BaseCommand {
  modes = [Mode.Normal];
  keys = [['<C-6>'], ['<C-^>']];

  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const altFile = await Register.get('#');
    if (altFile?.text instanceof RecordedState) {
      throw new Error(`# register unexpectedly contained a RecordedState`);
    } else if (altFile === undefined || altFile.text === '') {
      StatusBar.displayError(vimState, VimError.NoAlternateFile());
    } else {
      let files: Uri[];
      if (await doesFileExist(Uri.file(altFile.text))) {
        files = [Uri.file(altFile.text)];
      } else {
        files = await workspace.findFiles(altFile.text);
      }

      // TODO: if the path matches a file from multiple workspace roots, we may not choose the right one
      if (files.length > 0) {
        const document = await workspace.openTextDocument(files[0]);
        await window.showTextDocument(document);
      }
    }
  }
}

@RegisterAction
class OpenFile extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual];
  keys = ['g', 'f'];
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    let fullFilePath: string;
    if (vimState.currentMode === Mode.Visual) {
      fullFilePath = vimState.document.getText(vimState.editor.selection);
    } else {
      const range = new Range(
        position.prevWordStart(vimState.document, { wordType: WordType.FileName, inclusive: true }),
        position.nextWordStart(vimState.document, { wordType: WordType.FileName }),
      );

      fullFilePath = vimState.document.getText(range).trim();
    }

    const fileInfo = fullFilePath.match(/(.*?(?=:[0-9]+)|.*):?([0-9]*)$/);
    if (fileInfo) {
      const fileUri: Uri = await (async () => {
        const pathStr = fileInfo[1];
        if (path.isAbsolute(pathStr)) {
          return Uri.file(pathStr);
        } else {
          let uri = Uri.file(path.resolve(path.dirname(vimState.document.uri.fsPath), pathStr));
          if (!(await doesFileExist(uri))) {
            const workspaceRoot = workspace.getWorkspaceFolder(vimState.document.uri)?.uri;
            if (workspaceRoot) {
              uri = Uri.file(path.join(workspaceRoot.fsPath, pathStr));
              if (!(await doesFileExist(uri))) {
                throw VimError.CantFindFileInPath(pathStr);
              }
            }
          }
          return uri;
        }
      })();

      const line = parseInt(fileInfo[2], 10);
      const fileCommand = new FileCommand({
        name: 'edit',
        bang: false,
        opt: [],
        file: fileUri.fsPath,
        cmd: isNaN(line) ? undefined : { type: 'line_number', line: line - 1 },
        createFileIfNotExists: false,
      });
      void fileCommand.execute(vimState);
    }
  }
}
