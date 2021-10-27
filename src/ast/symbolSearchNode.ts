import * as vscode from 'vscode';
import { SymbolSearchResult, SymbolFound } from './symbolSearchResult';

/**
 * This is a class that contains the symbols that were searched and the
 * resulting searchResult.  This makes it possible to keep track of the
 * ancestors of a symbol as well as its full position in the Abstract Syntax
 * Tree (AST).
 *
 * The symbol class provided by VSCode is not enough and makes it hard to
 * traverse the AST if not starting from the root or if the cursor is in
 * between 2 symbols.
 *
 * Also by keeping track of a symbol's parents it becomes much easier to get
 * the ancestry of a symbol.
 */
export class SymbolSearchNode {
  symbols: vscode.DocumentSymbol[];
  searchResult: SymbolSearchResult;
  parent?: SymbolSearchNode;

  constructor(
    symbols: vscode.DocumentSymbol[],
    searchResult: SymbolSearchResult,
    parent?: SymbolSearchNode
  ) {
    this.symbols = symbols;
    this.searchResult = searchResult;
    this.parent = parent;
  }

  /**
   * Returns a list containing all the ancestors of a symbol. We go from left
   * (child) to right (ancestor) in the list where index 0 is the child symbol
   * and last index is the root symbol. This is the opposite of VSCode's
   * breadcrumbs that go from ancestor (left) to children (right).
   */
  public listCurrentAndAncestors(): SymbolSearchNode[] {
    let current: SymbolSearchNode | undefined = this;
    const listAncestry: SymbolSearchNode[] = [];

    while (current !== undefined) {
      listAncestry.push(current);
      current = current.parent;
    }

    return listAncestry;
  }

  /**
   * Searches the current symbol and then its ancestors to find the first symbol
   * whose SymbolKind is in the whitelist (for example a function symbol or a
   * class symbol depending on the whitelist). The starting node is included
   * here.
   *
   * @param whitelist, a Set of SymbolKind containing the type of symbol to search
   *
   * @returns the first ancestor that has the right SymbolKind or null
   */
  public searchUpward(whitelist: Set<vscode.SymbolKind>): SymbolSearchNode | null {
    const listAncestors = this.listCurrentAndAncestors();
    for (const ancestor of listAncestors) {
      if (
        ancestor.searchResult instanceof SymbolFound &&
        ancestor.searchResult.symbol !== undefined &&
        whitelist.has(ancestor.searchResult.symbol.kind)
      ) {
        return ancestor;
      }
    }
    return null;
  }
}
