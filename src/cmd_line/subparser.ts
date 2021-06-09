import { parseCloseCommandArgs } from './subparsers/close';
import { parseDeleteRangeLinesCommandArgs } from './subparsers/deleteRange';
import { parseDigraphCommandArgs } from './subparsers/digraph';
import * as fileCmd from './subparsers/file';
import { parseQuitAllCommandArgs, parseQuitCommandArgs } from './subparsers/quit';
import { parseReadCommandArgs } from './subparsers/read';
import { parseRegisterCommandArgs } from './subparsers/register';
import { parseOptionsCommandArgs } from './subparsers/setoptions';
import { parseSortCommandArgs } from './subparsers/sort';
import { parseSubstituteCommandArgs } from './subparsers/substitute';
import * as tabCmd from './subparsers/tab';
import { parseWallCommandArgs } from './subparsers/wall';
import { parseWriteCommandArgs } from './subparsers/write';
import { parseWriteQuitCommandArgs } from './subparsers/writequit';
import { parseWriteQuitAllCommandArgs } from './subparsers/writequitall';
import { parseFileInfoCommandArgs } from './subparsers/fileInfo';
import { parseMarksCommandArgs, parseMarksRemoveCommandArgs } from './subparsers/marks';
import { parsePutExCommandArgs } from './subparsers/put';
import { CommandBase } from './node';
import { parseHistoryCommandArgs } from './subparsers/history';
import { parseBufferDeleteCommandArgs } from './subparsers/bufferDelete';
import { NohlCommand } from './commands/nohl';
import { OnlyCommand } from './commands/only';
import { SmileCommand } from './commands/smile';
import { UndoCommand } from './commands/undo';
import { parseBangCommand } from './subparsers/bang';
import { ClearJumpsCommand, JumpsCommand } from './commands/jumps';
import { VimState } from '../state/vimState';
import { StatusBar } from '../statusBar';
import { ShCommand } from './commands/sh';
import { GotoCommand } from './commands/goto';
import { YankCommand } from './commands/yank';
import { CopyCommand } from './commands/copy';
import { VsCodeCommand } from './commands/vscode';

// Associates a name and an abbreviation with a command parser
export type CommandParserMapping = {
  /** The shortest abbreviation that will work, such as `:q` */
  abbrev?: string;

  /** The parser for this command. Undefined if no implementation exists yet. */
  parser?: (args: string) => CommandBase;
};

// Keep this sorted, please :)
export const commandParsers = {
  '!': {
    parser: parseBangCommand,
  },

  bdelete: {
    abbrev: 'bd',
    parser: parseBufferDeleteCommandArgs,
  },

  bfirst: {
    abbrev: 'bf',
    parser: undefined,
  },

  blast: {
    abbrev: 'bl',
    parser: undefined,
  },

  bmodified: {
    abbrev: 'bm',
    parser: undefined,
  },

  bnext: {
    abbrev: 'bn',
    parser: tabCmd.parseTabNCommandArgs,
  },

  bNext: {
    abbrev: 'bN',
    parser: tabCmd.parseTabPCommandArgs,
  },

  bprevious: {
    abbrev: 'bp',
    parser: tabCmd.parseTabPCommandArgs,
  },

  brewind: {
    abbrev: 'br',
    parser: undefined,
  },

  buffers: {
    parser: undefined,
  },

  center: {
    abbrev: 'ce',
    parser: undefined,
  },

  clearjumps: {
    abbrev: 'cle',
    parser: () => new ClearJumpsCommand(),
  },

  close: {
    abbrev: 'clo',
    parser: parseCloseCommandArgs,
  },

  copy: {
    abbrev: 'co',
    parser: CopyCommand.parse,
  },

  delete: {
    abbrev: 'd',
    parser: parseDeleteRangeLinesCommandArgs,
  },

  delmarks: {
    abbrev: 'delm',
    parser: parseMarksRemoveCommandArgs,
  },

  digraphs: {
    abbrev: 'dig',
    parser: parseDigraphCommandArgs,
  },

  display: {
    abbrev: 'di',
    parser: parseRegisterCommandArgs,
  },

  edit: {
    abbrev: 'e',
    parser: fileCmd.parseEditFileCommandArgs,
  },

  enew: {
    abbrev: 'ene',
    parser: fileCmd.parseEditNewFileCommandArgs,
  },

  file: {
    abbrev: 'f',
    parser: parseFileInfoCommandArgs,
  },

  files: {
    parser: undefined,
  },

  global: {
    abbrev: 'g',
    parser: undefined,
  },

  goto: {
    abbrev: 'go',
    parser: GotoCommand.parse,
  },

  help: {
    abbrev: 'h',
    parser: undefined,
  },

  history: {
    abbrev: 'his',
    parser: parseHistoryCommandArgs,
  },

  jumps: {
    abbrev: 'ju',
    parser: () => new JumpsCommand(),
  },

  left: {
    abbrev: 'le',
    parser: undefined,
  },

  ls: {
    parser: undefined,
  },

  marks: {
    parser: parseMarksCommandArgs,
  },

  move: {
    abbrev: 'm',
    parser: undefined,
  },

  new: {
    parser: fileCmd.parseEditNewFileInNewHorizontalWindowCommandArgs,
  },

  nohlsearch: {
    abbrev: 'noh',
    parser: () => new NohlCommand(),
  },

  normal: {
    abbrev: 'norm',
    parser: undefined,
  },

  only: {
    abbrev: 'on',
    parser: () => new OnlyCommand(),
  },

  put: {
    abbrev: 'pu',
    parser: parsePutExCommandArgs,
  },

  qall: {
    abbrev: 'qa',
    parser: parseQuitAllCommandArgs,
  },

  quit: {
    abbrev: 'q',
    parser: parseQuitCommandArgs,
  },

  quitall: {
    abbrev: 'quita',
    parser: parseQuitAllCommandArgs,
  },

  read: {
    abbrev: 'r',
    parser: parseReadCommandArgs,
  },

  registers: {
    abbrev: 'reg',
    parser: parseRegisterCommandArgs,
  },

  right: {
    abbrev: 'ri',
    parser: undefined,
  },

  set: {
    abbrev: 'se',
    parser: parseOptionsCommandArgs,
  },

  shell: {
    abbrev: 'sh',
    parser: () => new ShCommand(),
  },

  smile: {
    parser: () => new SmileCommand(),
  },

  sort: {
    abbrev: 'sor',
    parser: parseSortCommandArgs,
  },

  source: {
    abbrev: 'so',
    parser: undefined,
  },

  split: {
    abbrev: 'sp',
    parser: fileCmd.parseEditFileInNewHorizontalWindowCommandArgs,
  },

  substitute: {
    abbrev: 's',
    parser: parseSubstituteCommandArgs,
  },

  t: {
    parser: CopyCommand.parse,
  },

  tabclose: {
    abbrev: 'tabc',
    parser: tabCmd.parseTabCloseCommandArgs,
  },

  tabedit: {
    abbrev: 'tabe',
    parser: tabCmd.parseTabNewCommandArgs,
  },

  tabfirst: {
    abbrev: 'tabfir',
    parser: tabCmd.parseTabFirstCommandArgs,
  },

  tablast: {
    abbrev: 'tabl',
    parser: tabCmd.parseTabLastCommandArgs,
  },

  tabmove: {
    abbrev: 'tabm',
    parser: tabCmd.parseTabMovementCommandArgs,
  },

  tabnew: {
    parser: tabCmd.parseTabNewCommandArgs,
  },

  tabnext: {
    abbrev: 'tabn',
    parser: tabCmd.parseTabNCommandArgs,
  },

  tabNext: {
    abbrev: 'tabN',
    parser: tabCmd.parseTabPCommandArgs,
  },

  tabonly: {
    abbrev: 'tabo',
    parser: tabCmd.parseTabOnlyCommandArgs,
  },

  tabprevious: {
    abbrev: 'tabp',
    parser: tabCmd.parseTabPCommandArgs,
  },

  undo: {
    abbrev: 'u',
    parser: () => new UndoCommand(),
  },

  vglobal: {
    abbrev: 'v',
    parser: undefined,
  },

  vnew: {
    abbrev: 'vne',
    parser: fileCmd.parseEditNewFileInNewVerticalWindowCommandArgs,
  },

  vscode: {
    abbrev: 'vsc',
    parser: VsCodeCommand.parse,
  },

  vsplit: {
    abbrev: 'vs',
    parser: fileCmd.parseEditFileInNewVerticalWindowCommandArgs,
  },

  wall: {
    abbrev: 'wa',
    parser: parseWallCommandArgs,
  },

  wq: {
    parser: parseWriteQuitCommandArgs,
  },

  wqall: {
    abbrev: 'wqa',
    parser: parseWriteQuitAllCommandArgs,
  },

  write: {
    abbrev: 'w',
    parser: parseWriteCommandArgs,
  },

  x: {
    parser: parseWriteQuitCommandArgs,
  },

  xall: {
    abbrev: 'xa',
    parser: parseWriteQuitAllCommandArgs,
  },

  yank: {
    abbrev: 'y',
    parser: YankCommand.parse,
  },
};

/**
 * Returns a command parser for the given `input`, if one exists.
 * Resolves `q`, `qu`, `qui`, and `quit` the same.
 */
export function getParser(input: string): ((args: string) => CommandBase) | undefined {
  if (input === '') {
    return undefined;
  }

  for (const fullName of Object.keys(commandParsers)) {
    const parserMapping: CommandParserMapping = commandParsers[fullName];

    const parser =
      parserMapping.parser ??
      ((args: string) => {
        return new UnimplementedCommand(fullName, parserMapping);
      });

    if (parserMapping.abbrev !== undefined) {
      if (input.startsWith(parserMapping.abbrev) && fullName.startsWith(input)) {
        return parser;
      }
    } else {
      if (input === fullName) {
        return parser;
      }
    }
  }

  return undefined;
}

class UnimplementedCommand extends CommandBase {
  fullName: string;
  parserMapping: CommandParserMapping;

  public override neovimCapable(): boolean {
    // If the user has neovim integration enabled, don't stop them from using these commands
    return true;
  }

  constructor(fullName: string, parserMapping: CommandParserMapping) {
    super();
    this.fullName = fullName;
    this.parserMapping = parserMapping;
  }

  async execute(vimState: VimState): Promise<void> {
    const commandText = this.parserMapping.abbrev
      ? `${this.parserMapping.abbrev}[${this.fullName.substr(this.parserMapping.abbrev.length)}]`
      : this.fullName;
    StatusBar.setText(vimState, `Command :${commandText} is not yet implemented`, true);
  }
}
