import * as vscode from 'vscode';

/**
 * This is a class that helps when searching DocumentsSymbols provided by the
 * LSP.  This class allows one to keep track of the ancestors of a symbol as
 * well as its full position in the Abstract Syntax Tree (AST).
 *
 * The symbol class provided by VSCode is not enough and makes it hard to
 * traverse the AST if not starting from the root or if the cursor is in
 * between 2 symbols.
 *
 * Also by keeping track of a symbol's parents it becomes much easier to get
 * the ancestry of a symbol.
 */

export abstract class SymbolSearchResult {
  searchedSymbols: vscode.DocumentSymbol[];

  /**
   * The symbol if found
   */
  symbol?: vscode.DocumentSymbol;

  /**
   * The index of the symbol if found
   */
  indexFound?: number;

  /**
   * The indices of the 2 symbols if the position is in between 2.
   */
  indicesIfInBetween?: [number, number];

  parent?: SymbolSearchResult;

  constructor(symbolsToSearch: vscode.DocumentSymbol[], parent?: SymbolSearchResult) {
    this.searchedSymbols = symbolsToSearch;
    this.parent = parent;
  }

  /**
   * Returns a list containing all the ancestors of a symbol. We go from left
   * (child) to right (ancestor) in the list where index 0 is the child symbol
   * and last index is the root symbol. This is the opposite of VSCode's
   * breadcrumbs that go from ancestor (left) to children (right).
   */
  public listCurrentAndAncestors(): SymbolSearchResult[] {
    let current: SymbolSearchResult | undefined = this;
    const listAncestry: SymbolSearchResult[] = [];

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
  public searchUpward(whitelist: Set<vscode.SymbolKind>): SymbolSearchResult | null {
    const listAncestors = this.listCurrentAndAncestors();
    for (const ancestor of listAncestors) {
      if (
        ancestor instanceof SymbolFound &&
        ancestor.symbol !== undefined &&
        whitelist.has(ancestor.symbol.kind)
      ) {
        return ancestor;
      }
    }
    return null;
  }
}

export class AfterLast extends SymbolSearchResult {}

export class BeforeFirst extends SymbolSearchResult {}

export class PositionBetweenSymbols extends SymbolSearchResult {
  constructor(
    symbolsToSearch: vscode.DocumentSymbol[],
    index1: number,
    index2: number,
    parent?: SymbolSearchResult
  ) {
    super(symbolsToSearch, parent);
    this.indicesIfInBetween = [index1, index2];
  }
}

export class SymbolFound extends SymbolSearchResult {
  /**
   * Keeping track of the index where the symbol was found could be useful in
   * the future when searching the next symbols after the current one for
   * example.
   */
  constructor(
    symbolsToSearch: vscode.DocumentSymbol[],
    index: number,
    symbol: vscode.DocumentSymbol,
    parent?: SymbolSearchResult
  ) {
    super(symbolsToSearch, parent);
    this.indexFound = index;
    this.symbol = symbol;
  }
}

/**
 * When we are not sure where the search leads exactly.
 */
export class SymbolNotFound extends SymbolSearchResult {}
