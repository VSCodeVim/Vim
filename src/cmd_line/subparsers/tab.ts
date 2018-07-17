import * as node from '../commands/tab';
import { Scanner } from '../scanner';

function parseCount(args: string): number | undefined {
  if (!args) {
    return undefined;
  }

  let scanner = new Scanner(args);
  scanner.skipWhiteSpace();

  if (scanner.isAtEof) {
    return undefined;
  }

  let c = scanner.next();
  let count = Number.parseInt(c, 10);

  if (Number.isInteger(count) && count >= 0) {
    if (count > 999) {
      count = 999;
    }

    return count;
  } else {
    throw new Error(`Invalid tab number (${c}).`);
  }
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
    let scanner = new Scanner(args);
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

export function parseTabMovementCommandArgs(args: string): node.TabCommand {
  return new node.TabCommand({
    tab: node.Tab.Move,
    count: parseCount(args),
  });
}
