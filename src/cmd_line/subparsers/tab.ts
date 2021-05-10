import * as node from '../commands/tab';
import { Scanner } from '../scanner';
import { ErrorCode, VimError } from '../../error';

const isDigit = (c: string) => '0' <= c && c <= '9';

function parseCount(args: string): number | undefined {
  if (!args) {
    return undefined;
  }

  const scanner = new Scanner(args);
  scanner.skipWhiteSpace();

  if (scanner.isAtEof) {
    return undefined;
  }

  const input = scanner.nextWhile(isDigit);
  scanner.skipWhiteSpace();

  const count = Number.parseInt(input, 10);

  if (scanner.isAtEof && Number.isInteger(count) && count >= 0) {
    return count;
  } else {
    throw VimError.fromCode(ErrorCode.InvalidArgument);
  }
}

function parseCountOrOffset(args: string): {
  count: number | undefined;
  direction?: 'left' | 'right';
} {
  if (!args) {
    return { count: undefined };
  }

  const scanner = new Scanner(args);
  scanner.skipWhiteSpace();

  if (scanner.isAtEof) {
    return { count: undefined };
  }

  const c = scanner.next();

  const direction = (() => {
    if (c === '-') {
      return 'left';
    } else if (c === '+') {
      return 'right';
    } else {
      return undefined;
    }
  })();

  if (direction === undefined) {
    scanner.backup();
  } else {
    scanner.ignore();
  }

  const input = scanner.nextWhile(isDigit);
  scanner.skipWhiteSpace();

  if (scanner.isAtEof) {
    const count = input.length === 0 ? 1 : Number.parseInt(input, 10);

    if (Number.isInteger(count) && (count > 0 || (direction === undefined && count === 0))) {
      return { count, direction };
    }
  }

  throw VimError.fromCode(ErrorCode.InvalidArgument);
}

/**
 * :tabn[ext] Go to the next tab page.
 * :tabn[ext] {count} Go to tab page {count}.
 */
export function parseTabNCommandArgs(args: string): node.TabCommand {
  return new node.TabCommand({
    tab: node.Tab.Next,
    count: parseCount(args),
  });
}

/**
 * :tabp[revious] Go to the previous tab page.  Wraps around from the first one  to the last one.
 * :tabp[revious] {count} Go {count} tab pages back.
 */
export function parseTabPCommandArgs(args: string): node.TabCommand {
  return new node.TabCommand({
    tab: node.Tab.Previous,
    count: parseCount(args),
  });
}

/**
 * :tabfir[st]  Go to the first tab page.
 */
export function parseTabFirstCommandArgs(args: string): node.TabCommand {
  return new node.TabCommand({
    tab: node.Tab.First,
  });
}

/**
 * :tabl[ast]  Go to the last tab page.
 */
export function parseTabLastCommandArgs(args: string): node.TabCommand {
  return new node.TabCommand({
    tab: node.Tab.Last,
  });
}

/**
 * :tabe[dit]
 * :tabnew Open a new tab page with an empty window, after the current tab page.
 */
export function parseTabNewCommandArgs(args: string): node.TabCommand {
  let name = '';

  if (args) {
    const scanner = new Scanner(args);
    name = scanner.nextWord();
  }

  return new node.TabCommand({
    tab: node.Tab.New,
    file: name,
  });
}

/**
 * :tabc[lose][!]  Close current tab page.
 * :tabc[lose][!] {count}. Close tab page {count}.
 */
export function parseTabCloseCommandArgs(args: string): node.TabCommand {
  return new node.TabCommand({
    tab: node.Tab.Close,
    count: parseCount(args),
  });
}

export function parseTabOnlyCommandArgs(args: string): node.TabCommand {
  return new node.TabCommand({
    tab: node.Tab.Only,
  });
}

/**
 * :tabm[ove] [N]
 * :tabm[ove] +[N]
 * :tabm[ove] -[N]
 */
export function parseTabMovementCommandArgs(args: string): node.TabCommand {
  const { count, direction } = parseCountOrOffset(args);
  return new node.TabCommand({
    tab: node.Tab.Move,
    count,
    direction,
  });
}
