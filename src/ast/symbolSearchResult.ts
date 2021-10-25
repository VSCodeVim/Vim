import * as vscode from 'vscode';

/**
 * Useful when searching a list of symbols with a certain position. It helps
 * keeping track of the found symbol and its index in the list.
 */
export abstract class SymbolSearchResult {
  /**
   * The symbol if found
   */
  symbol?: vscode.DocumentSymbol;

  /**
   * The index of the symbol if found or the index of the first symbol if the search
   * is in between 2 symbols.
   */
  index1?: number;

  /**
   * The index of the 2nd symbol if the search is in between 2 symbols.
   */
  index2?: number;
}

/**
 * If we are not sure where to search exactly.
 */
export class SymbolNotFound extends SymbolSearchResult {}

export class AfterLast extends SymbolSearchResult {}

export class BeforeFirst extends SymbolSearchResult {}

export class PositionBetweenSymbols extends SymbolSearchResult {
  constructor(index1: number, index2: number) {
    super();
    this.index1 = index1;
    this.index2 = index2;
  }
}

export class SymbolFound extends SymbolSearchResult {
  /**
   * Keeping track of the index where the symbol was found could be useful in
   * the future when searching the next symbols after the current one for
   * example.
   */
  constructor(index: number, symbol: vscode.DocumentSymbol) {
    super();
    this.index1 = index;
    this.symbol = symbol;
  }
}
