import { DocumentSymbol, Position, Range, SymbolKind } from 'vscode';

/**
 * name, lineStart, lineEnd, symbolKind, children
 */
export type SymbolAbbrev = [string, number, number, SymbolKind, SymbolAbbrev[]];

export type ListSymbolAbbrev = SymbolAbbrev[];

/**
 * This function makes it easier to create an AST containing DocumentSymbols
 * using and abbreviated notation using deeply nested lists. Creating
 * DocumentSymbols manually could get really verbose otherwise.
 *
 * Here is an example  of a tree with 2 levels that gets converted into
 * an array of document symbols with their respective childrens.
 *
 * const symbolsAbbrev: ListSymbolAbbrev = [
 *  [
 *    'M1', 1, 10, SymbolKind.Method,
 *    [
 *      ['M2', 2, 3, SymbolKind.Method, []],
 *      ['M3', 3, 4, SymbolKind.Method, []],
 *      ['M3', 5, 6, SymbolKind.Method, []],
 *    ],
 *  ],
 *  ['M4', 11, 12, SymbolKind.Interface, []],
 * ];
 */
export function generateAstRecursive(
  symbolNodes: ListSymbolAbbrev,
  shouldShuffle?: boolean
): DocumentSymbol[] {
  if (symbolNodes === []) {
    return [];
  }

  let listSymbol = [];
  for (const node of symbolNodes) {
    const [name, lineStart, lineEnd, kind, children] = node;
    const childrenSymbol = generateAstRecursive(children);

    const newSymbol = new DocumentSymbol(
      name,
      '',
      kind,
      new Range(new Position(lineStart, 0), new Position(lineEnd, 10)),
      new Range(new Position(lineStart, 0), new Position(lineEnd, 10))
    );
    newSymbol.children = childrenSymbol;

    listSymbol.push(newSymbol);
  }

  if (shouldShuffle) {
    listSymbol = pseudoShuffle(listSymbol);
  }

  return listSymbol;
}

/**
 * This function shuffles the list deteministically. It
 * swaps only a few symbols around. It is by no means a
 * good shuffle function but it does the job for our needs.
 */
export function pseudoShuffle<T>(list: T[]): T[] {
  for (let i = 0; i < Math.floor(list.length / 2); i += 2) {
    list = swap(list, i, list.length - 1 - i);
  }
  return list;
}

function swap<T>(list: T[], i1: number, i2: number): T[] {
  const temp = list[i1];
  list[i1] = list[i2];
  list[i2] = temp;
  return list;
}
