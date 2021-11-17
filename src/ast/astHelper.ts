import * as vscode from 'vscode';
import { SymbolSearchNode } from './symbolSearchNode';
import * as SymbolSearch from './symbolSearchResult';

/**
 * Collection of helper functions around Abstract Syntax Tree (AST) symbols
 * navigation.
 */
export class AstHelper {
  /**
   * Searches a list of symbols and their descendants to find the deepest symbol
   * containing a position. The search might not necessarily find a symbol
   * so a SymbolSearchNode instance is returned to better locate the position
   * in the AST.
   */
  public static searchSymbolContainingPos(
    symbols: vscode.DocumentSymbol[],
    pos: vscode.Position
  ): SymbolSearchNode {
    if (symbols === []) {
      return new SymbolSearchNode(symbols, new SymbolSearch.SymbolNotFound());
    }

    symbols = AstHelper.sortSymbols(symbols);

    let searchResult = AstHelper.binarySearchSymbolsFromPosition(symbols, pos);
    let searchedSymbol = new SymbolSearchNode(symbols, searchResult);

    while (
      searchResult instanceof SymbolSearch.SymbolFound &&
      searchResult.symbol &&
      searchResult.symbol.children.length > 0
    ) {
      symbols = searchResult.symbol.children;
      symbols = AstHelper.sortSymbols(symbols);

      searchResult = AstHelper.binarySearchSymbolsFromPosition(symbols, pos);
      searchedSymbol = new SymbolSearchNode(symbols, searchResult, searchedSymbol);
    }

    return searchedSymbol;
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
        if (position.isBefore(midRange.start)) {
          if (middle === 0) {
            return new SymbolSearch.BeforeFirst();
          } else {
            return new SymbolSearch.PositionBetweenSymbols(middle - 1, middle);
          }
        } else if (position.isAfter(midRange.end)) {
          if (middle === symbols.length - 1) {
            return new SymbolSearch.AfterLast();
          } else {
            return new SymbolSearch.PositionBetweenSymbols(middle, middle + 1);
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

    return new SymbolSearch.SymbolNotFound();
  }
}
