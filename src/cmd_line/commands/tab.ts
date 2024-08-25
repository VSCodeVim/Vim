// eslint-disable-next-line id-denylist
import { alt, optWhitespace, regexp, seq, string, whitespace } from 'parsimmon';
import * as path from 'path';
import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import {
  FileCmd,
  FileOpt,
  bangParser,
  fileCmdParser,
  fileNameParser,
  fileOptParser,
  numberParser,
} from '../../vimscript/parserUtils';
import { VimError, ErrorCode } from '../../error';

export enum TabCommandType {
  Next,
  Previous,
  First,
  Last,
  Edit,
  New,
  Close,
  Only,
  Move,
}

// TODO: many of these arguments aren't used
export type ITabCommandArguments =
  | {
      type: TabCommandType.Edit;
      cmd?: FileCmd;
      buf: string | number;
    }
  | {
      type: TabCommandType.First | TabCommandType.Last;
      cmd?: FileCmd;
    }
  | {
      type: TabCommandType.Next | TabCommandType.Previous;
      bang: boolean;
      cmd?: FileCmd;
      count?: number;
    }
  | {
      type: TabCommandType.Close | TabCommandType.Only;
      bang: boolean;
      count?: number;
    }
  | {
      type: TabCommandType.New;
      opt: FileOpt;
      cmd?: FileCmd;
      file?: string;
    }
  | {
      type: TabCommandType.Move;
      direction?: 'left' | 'right';
      count?: number;
    };

//
//  Implements most buffer and tab ex commands
//  http://vimdoc.sourceforge.net/htmldoc/tabpage.html
//
export class TabCommand extends ExCommand {
  // TODO: `count` is parsed as a number, which is incomplete
  public static readonly argParsers = {
    bfirst: whitespace
      .then(fileCmdParser)
      .fallback(undefined)
      .map((cmd) => {
        return new TabCommand({ type: TabCommandType.First, cmd });
      }),
    blast: whitespace
      .then(fileCmdParser)
      .fallback(undefined)
      .map((cmd) => {
        return new TabCommand({ type: TabCommandType.Last, cmd });
      }),
    bnext: seq(
      bangParser,
      optWhitespace.then(fileCmdParser).fallback(undefined),
      optWhitespace.then(numberParser).fallback(undefined),
    ).map(([bang, cmd, count]) => {
      return new TabCommand({ type: TabCommandType.Next, bang, cmd, count });
    }),
    bprev: seq(
      bangParser,
      optWhitespace.then(fileCmdParser).fallback(undefined),
      optWhitespace.then(numberParser).fallback(undefined),
    ).map(([bang, cmd, count]) => {
      return new TabCommand({ type: TabCommandType.Previous, bang, cmd, count });
    }),
    buffer: seq(
      optWhitespace.then(fileCmdParser).fallback(undefined),
      alt<number | string>(
        optWhitespace.then(numberParser),
        optWhitespace.then(fileNameParser),
      ).fallback(undefined),
    ).map(([cmd, arg]) => {
      return new TabCommand({ type: TabCommandType.Edit, cmd, buf: arg ?? 0 });
    }),
    tabclose: seq(bangParser, optWhitespace.then(numberParser).fallback(undefined)).map(
      ([bang, count]) => {
        return new TabCommand({ type: TabCommandType.Close, bang, count });
      },
    ),
    tabonly: seq(bangParser, optWhitespace.then(numberParser).fallback(undefined)).map(
      ([bang, count]) => {
        return new TabCommand({ type: TabCommandType.Only, bang, count });
      },
    ),
    tabnew: seq(
      optWhitespace.then(fileOptParser).fallback([]),
      optWhitespace.then(fileCmdParser).fallback(undefined),
      optWhitespace.then(fileNameParser).fallback(undefined),
    ).map(([opt, cmd, file]) => {
      return new TabCommand({
        type: TabCommandType.New,
        opt,
        cmd,
        file,
      });
    }),
    tabmove: optWhitespace
      .then(
        seq(
          alt<'right' | 'left'>(string('+').result('right'), string('-').result('left')).fallback(
            undefined,
          ),
          numberParser.fallback(undefined),
        ),
      )
      .map(([direction, count]) => new TabCommand({ type: TabCommandType.Move, direction, count })),
  };

  public readonly arguments: ITabCommandArguments;
  constructor(args: ITabCommandArguments) {
    super();
    this.arguments = args;
  }

  private async executeCommandWithCount(count: number, command: string): Promise<void> {
    for (let i = 0; i < count; i++) {
      await vscode.commands.executeCommand(command);
    }
  }

  async execute(vimState: VimState): Promise<void> {
    switch (this.arguments.type) {
      case TabCommandType.Edit:
        if (
          this.arguments.buf !== undefined &&
          typeof this.arguments.buf === 'number' &&
          this.arguments.buf >= 0
        ) {
          await vscode.commands.executeCommand(
            'workbench.action.openEditorAtIndex',
            this.arguments.buf - 1,
          );
        } else if (this.arguments.buf !== undefined && typeof this.arguments.buf === 'string') {
          const tabGroup = vscode.window.tabGroups.activeTabGroup;
          const searchTerm = this.arguments.buf;
          const foundBuffers = [];
          for (const t of tabGroup.tabs) {
            if (t.label.includes(searchTerm)) {
              foundBuffers.push(t);
            }
            if (foundBuffers.length > 1) {
              break;
            }
          }
          if (foundBuffers.length === 0) {
            throw VimError.fromCode(ErrorCode.NoMatchingBuffer, searchTerm);
          } else if (foundBuffers.length > 1) {
            throw VimError.fromCode(ErrorCode.MultipleMatches, searchTerm);
          }
          const tab = foundBuffers[0];
          if ((tab.input as vscode.TextDocument).uri !== undefined) {
            const uri = (tab.input as vscode.TextDocument).uri;
            await vscode.commands.executeCommand('vscode.open', uri);
          }
        }
        break;
      case TabCommandType.Next:
        if (this.arguments.count !== undefined && this.arguments.count <= 0) {
          break;
        }

        if (this.arguments.count) {
          const tabGroup = vscode.window.tabGroups.activeTabGroup;
          if (0 < this.arguments.count && this.arguments.count <= tabGroup.tabs.length) {
            const tab = tabGroup.tabs[this.arguments.count - 1];
            if ((tab.input as vscode.TextDocument).uri !== undefined) {
              const uri = (tab.input as vscode.TextDocument).uri;
              await vscode.commands.executeCommand('vscode.open', uri);
            }
          }
        } else {
          await vscode.commands.executeCommand('workbench.action.nextEditorInGroup');
        }

        break;
      case TabCommandType.Previous:
        if (this.arguments.count !== undefined && this.arguments.count <= 0) {
          break;
        }

        await this.executeCommandWithCount(
          this.arguments.count || 1,
          'workbench.action.previousEditorInGroup',
        );
        break;
      case TabCommandType.First:
        await vscode.commands.executeCommand('workbench.action.openEditorAtIndex1');
        break;
      case TabCommandType.Last:
        await vscode.commands.executeCommand('workbench.action.lastEditorInGroup');
        break;
      case TabCommandType.New: {
        const hasFile = !(this.arguments.file === undefined || this.arguments.file === '');
        if (hasFile) {
          const isAbsolute = path.isAbsolute(this.arguments.file!);
          const currentFilePath = vscode.window.activeTextEditor!.document.uri.fsPath;
          const isInWorkspace =
            vscode.workspace.workspaceFolders !== undefined &&
            vscode.workspace.workspaceFolders.length > 0;

          let toOpenPath: string;
          if (isAbsolute) {
            toOpenPath = this.arguments.file!;
          } else if (isInWorkspace) {
            const workspacePath = vscode.workspace.workspaceFolders![0].uri.path;
            if (currentFilePath.startsWith(workspacePath)) {
              toOpenPath = path.join(path.dirname(currentFilePath), this.arguments.file!);
            } else {
              toOpenPath = path.join(workspacePath, this.arguments.file!);
            }
          } else {
            toOpenPath = path.join(path.dirname(currentFilePath), this.arguments.file!);
          }

          if (toOpenPath !== currentFilePath) {
            await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(toOpenPath));
          }
        } else {
          await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
        }
        break;
      }
      case TabCommandType.Close:
        // Navigate the correct position
        if (this.arguments.count === undefined) {
          await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
          break;
        }

        if (this.arguments.count === 0) {
          // Wrong paramter
          break;
        }

        // TODO: Close Page {count}. Page count is one-based.
        break;
      case TabCommandType.Only:
        await vscode.commands.executeCommand('workbench.action.closeOtherEditors');
        break;
      case TabCommandType.Move: {
        const { count, direction } = this.arguments;
        let args;
        if (direction !== undefined) {
          args = { to: direction, by: 'tab', value: count ?? 1 };
        } else if (count === 0) {
          args = { to: 'first' };
        } else if (count === undefined) {
          args = { to: 'last' };
        } else {
          args = { to: 'position', by: 'tab', value: count + 1 };
        }
        await vscode.commands.executeCommand('moveActiveEditor', args);
        break;
      }
      default:
        break;
    }
  }
}
