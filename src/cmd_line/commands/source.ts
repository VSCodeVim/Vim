import * as os from 'os';
import { optWhitespace, Parser, whitespace } from 'parsimmon';
import * as path from 'path';
import { existsAsync, readFileAsync } from 'platform/fs';
import * as vscode from 'vscode';
import { configuration } from '../../configuration/configuration';
import { VimrcImpl } from '../../configuration/vimrc';
import { vimrcKeyRemappingBuilder } from '../../configuration/vimrcKeyRemappingBuilder';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { Logger } from '../../util/logger';
import { ExCommand } from '../../vimscript/exCommand';
import { fileNameParser } from '../../vimscript/parserUtils';
import { ExCommandLine } from '../commandLine';

//
// Implements :source
// http://vimdoc.sourceforge.net/htmldoc/repeat.html#:source
//
// Reads a file and executes each line as an ex command. For each line we
// first try to interpret it as a key mapping (nnoremap, etc.) via the same
// builder used by `vim.vimrc.path`, falling back to the regular ex-command
// parser for everything else (:set, :edit, :nohl, ...).
//
export class SourceCommand extends ExCommand {
  public static readonly argParser: Parser<SourceCommand> = whitespace
    .then(fileNameParser)
    .skip(optWhitespace)
    .map((file) => new SourceCommand(file));

  private static readonly activeSources: Set<string> = new Set();

  private readonly file: string;

  constructor(file: string) {
    super();
    this.file = file;
  }

  async execute(vimState: VimState): Promise<void> {
    const resolved = SourceCommand.resolvePath(vimState, this.file);

    if (!(await existsAsync(resolved))) {
      StatusBar.setText(vimState, `E484: Can't open file ${this.file}`, true);
      return;
    }

    if (SourceCommand.activeSources.has(resolved)) {
      StatusBar.setText(vimState, `E1092: Recursive use of :source in ${this.file}`, true);
      return;
    }

    SourceCommand.activeSources.add(resolved);
    try {
      await SourceCommand.sourceFile(vimState, resolved);
    } finally {
      SourceCommand.activeSources.delete(resolved);
    }
  }

  private static async sourceFile(vimState: VimState, filePath: string): Promise<void> {
    const content = await readFileAsync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const vscodeCommands = await vscode.commands.getCommands();

    let errors = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();
      if (trimmed.length === 0 || trimmed.startsWith('"')) {
        continue;
      }

      try {
        const remap = await vimrcKeyRemappingBuilder.build(line, vscodeCommands);
        if (remap) {
          VimrcImpl.addRemapToConfig(configuration, remap);
          continue;
        }
        const unremap = await vimrcKeyRemappingBuilder.buildUnmapping(line);
        if (unremap) {
          VimrcImpl.removeRemapFromConfig(configuration, unremap);
          continue;
        }
        const clearRemap = await vimrcKeyRemappingBuilder.buildClearMapping(line);
        if (clearRemap) {
          VimrcImpl.clearRemapsFromConfig(configuration, clearRemap);
          continue;
        }

        const parsed = ExCommandLine.parser.tryParse(trimmed);
        if (parsed.lineRange) {
          await parsed.command.executeWithRange(vimState, parsed.lineRange);
        } else {
          await parsed.command.execute(vimState);
        }
      } catch (err) {
        errors++;
        Logger.warn(
          `:source ${filePath}: line ${i + 1}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    if (errors > 0) {
      StatusBar.setText(
        vimState,
        `:source ${path.basename(filePath)} completed with ${errors} error${errors === 1 ? '' : 's'}`,
        true,
      );
    }
  }

  private static resolvePath(vimState: VimState, file: string): string {
    const expanded = SourceCommand.expandHome(file);
    if (path.isAbsolute(expanded)) {
      return expanded;
    }
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceFolder) {
      return path.resolve(workspaceFolder, expanded);
    }
    const docPath = vimState.document.uri.fsPath;
    if (docPath) {
      return path.resolve(path.dirname(docPath), expanded);
    }
    return path.resolve(expanded);
  }

  private static expandHome(filePath: string): string {
    const match = /^(~|\$HOME)(.*)$/.exec(filePath);
    if (!match) {
      return filePath;
    }
    return path.join(os.homedir(), match[2]);
  }
}
