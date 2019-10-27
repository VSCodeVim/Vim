import { parseCloseCommandArgs } from './subparsers/close';
import { parseDeleteRangeLinesCommandArgs } from './subparsers/deleteRange';
import { parseDigraphCommandArgs } from './subparsers/digraph';
import * as fileCmd from './subparsers/file';
import { parseNohlCommandArgs } from './subparsers/nohl';
import { parseOnlyCommandArgs } from './subparsers/only';
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
import { parseSmileCommandArgs } from './subparsers/smile';
import { CommandBase } from './node';
import { parseHistoryCommandArgs } from './subparsers/history';

// Associates a name and an abbreviation with a command parser
export type CommandParserMapping = {
  /** The shortest abbreviation that will work, such as `:q` */
  abbrev?: string;

  /** The parser for this command */
  parser: (args: string) => CommandBase;
};

export const commandParsers = {
  write: {
    abbrev: 'w',
    parser: parseWriteCommandArgs,
  },

  wall: {
    abbrev: 'wa',
    parser: parseWallCommandArgs,
  },

  nohlsearch: {
    abbrev: 'noh',
    parser: parseNohlCommandArgs,
  },

  close: {
    abbrev: 'clo',
    parser: parseCloseCommandArgs,
  },

  quit: {
    abbrev: 'q',
    parser: parseQuitCommandArgs,
  },

  qall: {
    abbrev: 'qa',
    parser: parseQuitAllCommandArgs,
  },

  quitall: {
    abbrev: 'quita',
    parser: parseQuitAllCommandArgs,
  },

  wq: {
    parser: parseWriteQuitCommandArgs,
  },

  x: {
    parser: parseWriteQuitCommandArgs,
  },

  wqall: {
    abbrev: 'wqa',
    parser: parseWriteQuitAllCommandArgs,
  },

  xall: {
    abbrev: 'xa',
    parser: parseWriteQuitAllCommandArgs,
  },

  tabnext: {
    abbrev: 'tabn',
    parser: tabCmd.parseTabNCommandArgs,
  },

  tabprevious: {
    abbrev: 'tabp',
    parser: tabCmd.parseTabPCommandArgs,
  },

  tabNext: {
    abbrev: 'tabN',
    parser: tabCmd.parseTabPCommandArgs,
  },

  tabfirst: {
    abbrev: 'tabfir',
    parser: tabCmd.parseTabFirstCommandArgs,
  },

  tablast: {
    abbrev: 'tabl',
    parser: tabCmd.parseTabLastCommandArgs,
  },

  tabedit: {
    abbrev: 'tabe',
    parser: tabCmd.parseTabNewCommandArgs,
  },

  tabnew: {
    parser: tabCmd.parseTabNewCommandArgs,
  },

  tabclose: {
    abbrev: 'tabc',
    parser: tabCmd.parseTabCloseCommandArgs,
  },

  tabonly: {
    abbrev: 'tabo',
    parser: tabCmd.parseTabOnlyCommandArgs,
  },

  tabmove: {
    abbrev: 'tabm',
    parser: tabCmd.parseTabMovementCommandArgs,
  },

  substitute: {
    abbrev: 's',
    parser: parseSubstituteCommandArgs,
  },

  smile: {
    parser: parseSmileCommandArgs,
  },

  edit: {
    abbrev: 'e',
    parser: fileCmd.parseEditFileCommandArgs,
  },

  enew: {
    abbrev: 'ene',
    parser: fileCmd.parseEditNewFileCommandArgs,
  },

  split: {
    abbrev: 'sp',
    parser: fileCmd.parseEditFileInNewHorizontalWindowCommandArgs,
  },

  vsplit: {
    abbrev: 'vs',
    parser: fileCmd.parseEditFileInNewVerticalWindowCommandArgs,
  },

  new: {
    parser: fileCmd.parseEditNewFileInNewHorizontalWindowCommandArgs,
  },

  vnew: {
    abbrev: 'vne',
    parser: fileCmd.parseEditNewFileInNewVerticalWindowCommandArgs,
  },

  only: {
    abbrev: 'on',
    parser: parseOnlyCommandArgs,
  },

  set: {
    abbrev: 'se',
    parser: parseOptionsCommandArgs,
  },

  read: {
    abbrev: 'r',
    parser: parseReadCommandArgs,
  },

  registers: {
    abbrev: 'reg',
    parser: parseRegisterCommandArgs,
  },

  display: {
    abbrev: 'reg',
    parser: parseRegisterCommandArgs,
  },

  digraphs: {
    abbrev: 'dig',
    parser: parseDigraphCommandArgs,
  },

  delete: {
    abbrev: 'd',
    parser: parseDeleteRangeLinesCommandArgs,
  },

  sort: {
    abbrev: 'sor',
    parser: parseSortCommandArgs,
  },

  file: {
    abbrev: 'f',
    parser: parseFileInfoCommandArgs,
  },

  marks: {
    parser: parseMarksCommandArgs,
  },

  history: {
    abbrev: 'his',
    parser: parseHistoryCommandArgs,
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
