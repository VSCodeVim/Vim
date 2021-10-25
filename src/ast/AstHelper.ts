import * as vscode from 'vscode';
import { SearchedSymbols } from './SearchedSymbols';
import * as SymbolSearch from './SymbolSearchResult';

/**
 * Collection of helper functions around Abstract Syntax Tree (AST) symbols
 * navigation.
 */
export class AstHelper {
  public static searchSymbolContainingPos(
    symbols: vscode.DocumentSymbol[],
    cursorPos: vscode.Position
  ): SearchedSymbols {
    if (symbols === []) {
      return new SearchedSymbols(symbols, new SymbolSearch.SymbolNotFound());
    }

    let searchResult = AstHelper.binarySearchSymbolsFromPosition(symbols, cursorPos);
    let searchedSymbol = new SearchedSymbols(symbols, searchResult);

    while (searchResult instanceof SymbolSearch.SymbolFound && searchResult.symbol) {
      symbols = searchResult.symbol.children;
      searchResult = AstHelper.binarySearchSymbolsFromPosition(symbols, cursorPos);
      searchedSymbol = new SearchedSymbols(symbols, searchResult, searchedSymbol);
    }

    return searchedSymbol;
  }

  public static binarySearchSymbolsFromPosition(
    symbols: vscode.DocumentSymbol[],
    position: vscode.Position
  ): SymbolSearch.SymbolSearchResult {
    if (symbols === []) {
      return new SymbolSearch.SymbolNotFound();
    }

    let start = 0;
    let end = symbols.length - 1;

    while (start <= end) {
      const middle = Math.floor((start + end) / 2);
      const midRange = symbols[middle].range;

      // We found the right symbol
      if (midRange.contains(position)) {
        return new SymbolSearch.SymbolFound(middle, symbols[middle]);
      }

      // We searched every symbol and could not find it
      else if (middle === start && middle === end) {
        if (middle === 0) {
          return new SymbolSearch.BeforeFirst();
        } else if (middle === symbols.length - 1) {
          return new SymbolSearch.AfterLast();
        } else if (position.isBefore(midRange.start)) {
          return new SymbolSearch.PositionBetweenSymbols(middle - 1, middle);
        } else {
          return new SymbolSearch.PositionBetweenSymbols(middle, middle + 1);
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

    return new SymbolSearch.SymbolNotFound();
  }
}
