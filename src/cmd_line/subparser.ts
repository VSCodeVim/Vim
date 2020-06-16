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
import { parseMarksCommandArgs } from './subparsers/marks';
import { parsePutExCommandArgs } from './subparsers/put';
import { CommandBase } from './node';
import { parseHistoryCommandArgs } from './subparsers/history';
import { NohlCommand } from './commands/nohl';
import { OnlyCommand } from './commands/only';
import { SmileCommand } from './commands/smile';

// Associates a name and an abbreviation with a command parser
export type CommandParserMapping = {
  /** The shortest abbreviation that will work, such as `:q` */
  abbrev?: string;

  /** The parser for this command */
  parser: (args: string) => CommandBase;
};

// Keep this sorted, please :)
export const commandParsers = {
  close: {
    abbrev: 'clo',
    parser: parseCloseCommandArgs,
  },

  delete: {
    abbrev: 'd',
    parser: parseDeleteRangeLinesCommandArgs,
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

  history: {
    abbrev: 'his',
    parser: parseHistoryCommandArgs,
  },

  marks: {
    parser: parseMarksCommandArgs,
  },

  new: {
    parser: fileCmd.parseEditNewFileInNewHorizontalWindowCommandArgs,
  },

  nohlsearch: {
    abbrev: 'noh',
    parser: () => new NohlCommand({}),
  },

  only: {
    abbrev: 'on',
    parser: () => new OnlyCommand({}),
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

  set: {
    abbrev: 'se',
    parser: parseOptionsCommandArgs,
  },

  smile: {
    parser: () => new SmileCommand(),
  },

  sort: {
    abbrev: 'sor',
    parser: parseSortCommandArgs,
  },

  split: {
    abbrev: 'sp',
    parser: fileCmd.parseEditFileInNewHorizontalWindowCommandArgs,
  },

  substitute: {
    abbrev: 's',
    parser: parseSubstituteCommandArgs,
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

  vnew: {
    abbrev: 'vne',
    parser: fileCmd.parseEditNewFileInNewVerticalWindowCommandArgs,
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
};

/**
 * Returns a command parser for the given `input`, if one exists.
 * Resolves `q`, `qu`, `qui`, and `quit` the same.
 */
export function getParser(input: string): ((args?: string) => CommandBase) | undefined {
  if (input === '') {
    return undefined;
  }

  for (const fullName of Object.keys(commandParsers)) {
    const parserMapping: CommandParserMapping = commandParsers[fullName];

    if (parserMapping.abbrev !== undefined) {
      if (input.startsWith(parserMapping.abbrev) && fullName.startsWith(input)) {
        return parserMapping.parser;
      }
    } else {
      if (input === fullName) {
        return parserMapping.parser;
      }
    }
  }

  return undefined;
}
