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
export function generateAstRecursive(symbolNodes: ListSymbolAbbrev): DocumentSymbol[] {
  if (symbolNodes === []) {
    return [];
  }

  const listSymbol = [];
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

  return listSymbol;
}
