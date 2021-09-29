import { all, alt, optWhitespace, Parser, regexp, seq, string } from 'parsimmon';
import { CopyCommand } from '../cmd_line/commands/copy';
import { GotoCommand } from '../cmd_line/commands/goto';
import { GotoLineCommand } from '../cmd_line/commands/gotoLine';
import { ClearJumpsCommand, JumpsCommand } from '../cmd_line/commands/jumps';
import { NohlCommand } from '../cmd_line/commands/nohl';
import { OnlyCommand } from '../cmd_line/commands/only';
import { ShCommand } from '../cmd_line/commands/sh';
import { SmileCommand } from '../cmd_line/commands/smile';
import { UndoCommand } from '../cmd_line/commands/undo';
import { VsCodeCommand } from '../cmd_line/commands/vscode';
import { YankCommand } from '../cmd_line/commands/yank';
import { parseBangCommand } from '../cmd_line/subparsers/bang';
import { parseBufferDeleteCommandArgs } from '../cmd_line/subparsers/bufferDelete';
import { parseCloseCommandArgs } from '../cmd_line/subparsers/close';
import { parseDeleteRangeLinesCommandArgs } from '../cmd_line/subparsers/deleteRange';
import { parseDigraphCommandArgs } from '../cmd_line/subparsers/digraph';
import * as fileCmd from '../cmd_line/subparsers/file';
import { parseFileInfoCommandArgs } from '../cmd_line/subparsers/fileInfo';
import { parseHistoryCommandArgs } from '../cmd_line/subparsers/history';
import { parseMarksCommandArgs, parseMarksRemoveCommandArgs } from '../cmd_line/subparsers/marks';
import { parsePutExCommandArgs } from '../cmd_line/subparsers/put';
import { parseQuitAllCommandArgs, parseQuitCommandArgs } from '../cmd_line/subparsers/quit';
import { parseReadCommandArgs } from '../cmd_line/subparsers/read';
import { parseRegisterCommandArgs } from '../cmd_line/subparsers/register';
import { parseOptionsCommandArgs } from '../cmd_line/subparsers/setoptions';
import { parseSortCommandArgs } from '../cmd_line/subparsers/sort';
import { parseSubstituteCommandArgs } from '../cmd_line/subparsers/substitute';
import * as tabCmd from '../cmd_line/subparsers/tab';
import { parseWallCommandArgs } from '../cmd_line/subparsers/wall';
import { parseWriteCommandArgs } from '../cmd_line/subparsers/write';
import { parseWriteQuitCommandArgs } from '../cmd_line/subparsers/writequit';
import { parseWriteQuitAllCommandArgs } from '../cmd_line/subparsers/writequitall';
import { ErrorCode, VimError } from '../error';
import { VimState } from '../state/vimState';
import { StatusBar } from '../statusBar';
import { ExCommand } from './exCommand';
import { LineRange } from './lineRange';

export const exCommandParser: Parser<{ lineRange: LineRange | undefined; command: ExCommand }> =
  optWhitespace
    .then(string(':').skip(optWhitespace).many())
    .then(
      seq(
        LineRange.parser.fallback(undefined).skip(optWhitespace),
        alt(string('!'), regexp(/[a-z]*/i)).skip(optWhitespace),
        all
      )
    )
    .map(([lineRange, commandName, args]) => {
      const parser = getParser(commandName);
      if (!parser) {
        // TODO: This should show entire command (with range and args)
        throw VimError.fromCode(ErrorCode.NotAnEditorCommand, commandName);
      }
      return { lineRange, command: parser(args) };
    });

// Associates a name and an abbreviation with a command parser
type CommandParserMapping = {
  /** The shortest abbreviation that will work, such as `:q` */
  abbrev?: string;

  /** The parser for this command. Undefined if no implementation exists yet. */
  parser?: (args: string) => ExCommand;
};

// Keep this sorted, please :)
export const commandParsers = {
  '': {
    parser: () => new GotoLineCommand(),
  },

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
    parser: CopyCommand.parseArgs,
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
    parser: GotoCommand.parseArgs,
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
    parser: CopyCommand.parseArgs,
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
    parser: VsCodeCommand.parseArgs,
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
    parser: YankCommand.parseArgs,
  },
};

/**
 * Returns a command parser for the given `input`, if one exists.
 * Resolves `q`, `qu`, `qui`, and `quit` the same.
 */
export function getParser(input: string): ((args: string) => ExCommand) | undefined {
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

class UnimplementedCommand extends ExCommand {
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
