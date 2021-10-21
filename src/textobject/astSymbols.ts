import * as vscode from 'vscode';

/**
 * This is a helper class that represents nodes in the AST. The symbol class
 * provided by VSCode is not enough and make it hard to traverse the AST if
 * not starting from the root or if the cursor is in between 2 symbols.
 *
 * Also by using keeping of a symbol's parents it becomes much easier to
 * get the ancestry of a symbol.
 */
export class SymbolNode {
  previousSiblings: vscode.DocumentSymbol[];
  nextSiblings: vscode.DocumentSymbol[];
  symbol?: vscode.DocumentSymbol;
  parent?: SymbolNode;

  constructor(
    previousSiblings: vscode.DocumentSymbol[],
    nextSiblings: vscode.DocumentSymbol[],
    symbol?: vscode.DocumentSymbol,
    parent?: SymbolNode
  ) {
    this.previousSiblings = previousSiblings;
    this.nextSiblings = nextSiblings;
    this.symbol = symbol;
    this.parent = parent;
  }

  /**
   * Returns a list containing all the ancestors of a symbol. We go from left (child) to
   * right (ancestor) in the list where index 0 is the child symbol and last index is the
   * root symbol. This is the opposite of VSCode's breadcrumbs that go from
   * ancestor (left) to children (right).
   */
  public listNodeAndAncestors(): SymbolNode[] {
    let currNode: SymbolNode | undefined = this;
    const listAncestry: SymbolNode[] = [];
    while (currNode !== undefined) {
      listAncestry.push(currNode);
      currNode = currNode.parent;
    }
    return listAncestry;
  }

  /** Searches the current symbol and then its ancestors to find the first symbol
   * whose SymbolKind is in the whitelist (for example a function symbol or a
   * class symbol depending * on the whitelist). The starting node is included
   * here.
   *
   * @param whitelist, a set of SymbolKind containing the type of symbol to search
   *
   * @returns the first ancestor that has the right SymbolKind
   */
  public searchUpward(whitelist: Set<vscode.SymbolKind>): SymbolNode | null {
    const listAncestors = this.listNodeAndAncestors();
    for (const ancestor of listAncestors) {
      if (ancestor.symbol !== undefined && whitelist.has(ancestor.symbol.kind)) {
        return ancestor;
      }
    }
    return null;
  }
}

/**
 * Collection of helper functions around Abstract Syntax Tree (AST) symbols navigation.
 */
export class AstSymbols {
  /**
   * Searches recursively the symbols to find the deepest node containing the
   * cursor position. The final node might well be in between two symbols. In
   * that case we still receive a SymbolNode whose symbol attribute is undefined
   * but next siblings and previous siblings help determine where exactly the
   * cursor is.
   *
   * @returns the deepest symbol node found
   */
  public static searchSymbolFromPosition(
    symbols: vscode.DocumentSymbol[],
    cursorPos: vscode.Position
  ): SymbolNode {
    if (symbols === []) {
      return new SymbolNode([], [], undefined, undefined);
    }

    let searchResult = AstSymbols.binarySearch(symbols, cursorPos);

    while (searchResult.symbol) {
      symbols = searchResult.symbol.children;
      searchResult = AstSymbols.binarySearch(symbols, cursorPos, searchResult);
    }

    return searchResult;
  }

  /**
   * Binary search across the list of symbols to find which symbol contains the
   * cursor position. This function returns a symbolNode object.
   *
   * In case the search fails the symbol attribute of SymbolNode will be
   * undefined. It is still possible to determine where exactly the cursor is
   * (ie. in between 2 symbols) by using the previous and next siblings
   * attributes.
   *
   * @param symbols, the symbols to search
   * @param cursorPos, the cursor position
   * @param parent, the optional parent of the created Node
   */
  public static binarySearch(
    symbols: vscode.DocumentSymbol[],
    cursorPos: vscode.Position,
    parent?: SymbolNode
  ): SymbolNode {
    if (symbols === []) {
      return new SymbolNode([], [], undefined, parent);
    }

    let start = 0;
    let end = symbols.length - 1;

    while (start <= end) {
      const middle = Math.floor((start + end) / 2);
      const midRange = symbols[middle].range;

      // We found the right symbol
      if (midRange.contains(cursorPos)) {
        // slice returns an empty list if middle is at beginning or end of list so
        // the appropriate nextSibling or previousSibling list contains all the
        // remaining symbols.
        return new SymbolNode(
          symbols.slice(0, middle),
          symbols.slice(middle + 1),
          symbols[middle],
          parent
        );
      }
      // We searched every symbol and could not find it
      else if (middle === start && middle === end) {
        // Before start
        if (middle === 0) {
          return new SymbolNode([], symbols, undefined, parent);
        }
        // After last
        else if (middle === symbols.length - 1) {
          return new SymbolNode(symbols, [], undefined, parent);
        }
        // Cursor between mid - 1 and mid
        else if (cursorPos.isBefore(midRange.start)) {
          return new SymbolNode(symbols.slice(0, middle), symbols.slice(middle), undefined, parent);
        }
        // Cursor between mid and mid + 1
        else {
          return new SymbolNode(
            symbols.slice(0, middle + 1),
            symbols.slice(middle + 1),
            undefined,
            parent
          );
        }
      }
      // Keep searching before
      else if (cursorPos.isBefore(midRange.start)) {
        end = middle - 1;
      }
      // Keep searching after
      else {
        start = middle + 1;
      }
    }

    return new SymbolNode([], symbols, undefined, parent);
  }
}
