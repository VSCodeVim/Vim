import * as vscode from 'vscode';
import * as SymbolSearch from './symbolSearchResult';

/**
 * Collection of helper functions around Abstract Syntax Tree (AST) symbols
 * navigation.
 */
export class AstHelper {
  /**
   * Searches a list of symbols and their descendants to find the deepest symbol
   * containing a position. The search might not necessarily find a symbol so
   * checking the instanceof the resulting search can help identifying where
   * exactly the position is in relation to the symbols.
   */
  public static searchSymbolContainingPos(
    symbolsToSearch: vscode.DocumentSymbol[],
    pos: vscode.Position
  ): SymbolSearch.SymbolSearchResult {
    if (symbolsToSearch === []) {
      return new SymbolSearch.SymbolNotFound(symbolsToSearch);
    }

    let searchResult = AstHelper.binarySearchSymbolsFromPosition(symbolsToSearch, pos);

    while (
      searchResult instanceof SymbolSearch.SymbolFound &&
      searchResult.symbol &&
      searchResult.symbol.children.length > 0
    ) {
      symbolsToSearch = searchResult.symbol.children;
      symbolsToSearch = AstHelper.sortSymbols(symbolsToSearch);

      searchResult = AstHelper.binarySearchSymbolsFromPosition(symbolsToSearch, pos);
    }

    return searchResult;
  }

  public static sortSymbols(symbols: vscode.DocumentSymbol[]) {
    return symbols.sort((symbol1, symbol2) => {
      return symbol1.range.start.compareTo(symbol2.range.start);
    });
  }

  /**
   * Finds a position's location in a list of symbols.
   */
  public static binarySearchSymbolsFromPosition(
    symbols: vscode.DocumentSymbol[],
    position: vscode.Position,
    parent?: SymbolSearch.SymbolSearchResult
  ): SymbolSearch.SymbolSearchResult {
    symbols = AstHelper.sortSymbols(symbols);

    if (symbols === []) {
      return new SymbolSearch.SymbolNotFound(symbols);
    }

    let start = 0;
    let end = symbols.length - 1;

    while (start <= end) {
      const middle = Math.floor((start + end) / 2);
      const midRange = symbols[middle].range;

      // We found the right symbol
      if (midRange.contains(position)) {
        return new SymbolSearch.SymbolFound(symbols, middle, symbols[middle], parent);
      }

      // We searched every symbol and could not find it
      else if (middle === start && middle === end) {
        if (position.isBefore(midRange.start)) {
          if (middle === 0) {
            return new SymbolSearch.BeforeFirst(symbols, parent);
          } else {
            return new SymbolSearch.PositionBetweenSymbols(symbols, middle - 1, middle, parent);
          }
        } else if (position.isAfter(midRange.end)) {
          if (middle === symbols.length - 1) {
            return new SymbolSearch.AfterLast(symbols, parent);
          } else {
            return new SymbolSearch.PositionBetweenSymbols(symbols, middle, middle + 1, parent);
          }
        }
      }
      // Keep searching before
      else if (position.isBefore(midRange.start)) {
        end = middle - 1;
      }
      // Keep searching after
      else {
        start = middle + 1;
      }
    }

    return new SymbolSearch.SymbolNotFound(symbols, parent);
  }
}
