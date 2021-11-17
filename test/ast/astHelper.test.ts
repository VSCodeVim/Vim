import { DocumentSymbol, Position, Range, SymbolKind } from 'vscode';

import * as assert from 'assert';
import { ListSymbolAbbrev, generateAstRecursive } from '../ast/astGenerator';
import { AstHelper } from '../../src/ast/astHelper';
import {
  AfterLast,
  BeforeFirst,
  PositionBetweenSymbols,
  SymbolFound,
} from '../../src/ast/symbolSearchResult';

suite('AST Symbol search', () => {
  suite('AST binary search', () => {
    // prettier-ignore
    const symbolsAbbrev: ListSymbolAbbrev = [
      [ 'm1', 2, 10, SymbolKind.Method,[] ],
      [ 'm2', 12, 20, SymbolKind.Method,[] ],
      [ 'm3', 22, 30, SymbolKind.Method, []],
    ];

    const symbols = generateAstRecursive(symbolsAbbrev, true);

    test('Binary search position before first symbol', () => {
      const pos = new Position(1, 0);
      const searchRes = AstHelper.binarySearchSymbolsFromPosition(symbols, pos);

      assert(searchRes instanceof BeforeFirst);
      assert(searchRes.symbol === undefined);
    });

    test('Binary search position after last symbol', () => {
      const pos = new Position(32, 0);
      const searchRes = AstHelper.binarySearchSymbolsFromPosition(symbols, pos);

      assert(searchRes instanceof AfterLast);
      assert(searchRes.symbol === undefined);
    });

    test('Binary search position between first symbol and 2nd symbol', () => {
      const pos = new Position(11, 0);
      const searchRes = AstHelper.binarySearchSymbolsFromPosition(symbols, pos);

      assert(searchRes instanceof PositionBetweenSymbols);
      assert(searchRes.index1 === 0);
      assert(searchRes.index2 === 1);
      assert(searchRes.symbol === undefined);
    });

    test('Binary search position between second symbol and third symbol', () => {
      const pos = new Position(21, 0);
      const searchRes = AstHelper.binarySearchSymbolsFromPosition(symbols, pos);

      assert(searchRes instanceof PositionBetweenSymbols);
      assert(searchRes.index1 === 1);
      assert(searchRes.index2 === 2);
      assert(searchRes.symbol === undefined);
    });

    test('Binary search position inside first symbol', () => {
      const pos = new Position(3, 0);
      const searchRes = AstHelper.binarySearchSymbolsFromPosition(symbols, pos);

      assert(searchRes instanceof SymbolFound);
      assert(searchRes.index1 === 0);
      assert(searchRes.symbol?.name === 'm1');
    });

    test('Binary search position inside 2nd symbol', () => {
      const pos = new Position(13, 0);
      const searchRes = AstHelper.binarySearchSymbolsFromPosition(symbols, pos);

      assert(searchRes instanceof SymbolFound);
      assert(searchRes.index1 === 1);
      assert(searchRes.symbol?.name === 'm2');
    });

    test('Binary search position inside third symbol', () => {
      const pos = new Position(23, 0);
      const searchRes = AstHelper.binarySearchSymbolsFromPosition(symbols, pos);

      assert(searchRes instanceof SymbolFound);
      assert(searchRes.index1 === 2);
      assert(searchRes.symbol?.name === 'm3');
    });
  });

  suite('AST search symbol containing position', () => {
    // prettier-ignore
    const symbolsAbbrev: ListSymbolAbbrev = [
      ['m1', 1, 100, SymbolKind.Method, [
        ['f1', 2, 99, SymbolKind.Function, [
          ['m2', 3, 98, SymbolKind.Method, [
            ['f2', 4, 97, SymbolKind.Function, []]]]],
        ], ],
      ],
    ];

    const symbols = generateAstRecursive(symbolsAbbrev, true);

    test('Search position innermost symbol', () => {
      const pos = new Position(50, 0);
      const symbolNode = AstHelper.searchSymbolContainingPos(symbols, pos);

      assert(symbolNode.searchResult instanceof SymbolFound);
      assert(symbolNode.searchResult.symbol?.name === 'f2');
    });

    test('Search position 2nd innermost symbol', () => {
      const pos = new Position(3, 10);
      const symbolNode = AstHelper.searchSymbolContainingPos(symbols, pos);

      assert(symbolNode.searchResult instanceof BeforeFirst);
    });

    test('Search position third innermost symbol', () => {
      const pos = new Position(2, 10);
      const symbolNode = AstHelper.searchSymbolContainingPos(symbols, pos);

      assert(symbolNode.searchResult instanceof BeforeFirst);
    });
  });

  suite('AST find deepest symbol in the whitelist', () => {
    // prettier-ignore
    const symbolsAbbrev: ListSymbolAbbrev = [
      ['m1', 1, 100, SymbolKind.Method, [
        ['f1', 2, 99, SymbolKind.Function, [
          ['m2', 3, 98, SymbolKind.Method, [
            ['f2', 4, 97, SymbolKind.Function, []]]]],
        ], ],
      ],
    ];

    const symbols = generateAstRecursive(symbolsAbbrev, true);

    const whitelistFunAndMeth = new Set([SymbolKind.Function, SymbolKind.Method]);
    const whitelistFun = new Set([SymbolKind.Function]);
    const whitelistMeth = new Set([SymbolKind.Method]);
    const whitelistClass = new Set([SymbolKind.Class]);

    const posF2 = new Position(50, 0);
    const symbolNodeF2 = AstHelper.searchSymbolContainingPos(symbols, posF2);

    const posM2 = new Position(3, 10);
    const symbolNodeM2 = AstHelper.searchSymbolContainingPos(symbols, posM2);

    const posF1 = new Position(2, 10);
    const symbolNodef1 = AstHelper.searchSymbolContainingPos(symbols, posF1);

    const posM1 = new Position(1, 10);
    const symbolNodeM1 = AstHelper.searchSymbolContainingPos(symbols, posM1);

    test('Search upward from innermost node', () => {
      const deepestFun = symbolNodeF2.searchUpward(whitelistFun);
      const deepestMeth = symbolNodeF2.searchUpward(whitelistMeth);
      const deepestFunAndMeth = symbolNodeF2.searchUpward(whitelistFunAndMeth);
      const deepestClass = symbolNodeF2.searchUpward(whitelistClass);

      assert(deepestFun !== undefined);
      assert(deepestFun?.searchResult.symbol?.name === 'f2');

      assert(deepestMeth !== undefined);
      assert(deepestMeth?.searchResult.symbol?.name === 'm2');

      assert(deepestFunAndMeth !== undefined);
      assert(deepestFunAndMeth?.searchResult.symbol?.name === 'f2');

      assert(deepestClass === null);
    });

    test('Search upward 2nd innermost symbol', () => {
      const deepestFun = symbolNodeM2.searchUpward(whitelistFun);
      const deepestMeth = symbolNodeM2.searchUpward(whitelistMeth);
      const deepestFunAndMeth = symbolNodeM2.searchUpward(whitelistFunAndMeth);
      const deepestClass = symbolNodeM2.searchUpward(whitelistClass);

      assert(deepestFun !== undefined);
      assert(deepestFun?.searchResult.symbol?.name === 'f1');

      assert(deepestMeth !== undefined);
      assert(deepestMeth?.searchResult.symbol?.name === 'm2');

      assert(deepestFunAndMeth !== undefined);
      assert(deepestFunAndMeth?.searchResult.symbol?.name === 'm2');

      assert(deepestClass === null);
    });

    test('Search upward third innermost symbol', () => {
      const deepestFun = symbolNodef1.searchUpward(whitelistFun);
      const deepestMeth = symbolNodef1.searchUpward(whitelistMeth);
      const deepestFunAndMeth = symbolNodef1.searchUpward(whitelistFunAndMeth);
      const deepestClass = symbolNodef1.searchUpward(whitelistClass);

      assert(deepestFun !== undefined);
      assert(deepestFun?.searchResult.symbol?.name === 'f1');

      assert(deepestMeth !== undefined);
      assert(deepestMeth?.searchResult.symbol?.name === 'm1');

      assert(deepestFunAndMeth !== undefined);
      assert(deepestFunAndMeth?.searchResult.symbol?.name === 'f1');

      assert(deepestClass === null);
    });

    test('Search upward outermost symbol', () => {
      const deepestFun = symbolNodeM1.searchUpward(whitelistFun);
      const deepestMeth = symbolNodeM1.searchUpward(whitelistMeth);
      const deepestFunAndMeth = symbolNodeM1.searchUpward(whitelistFunAndMeth);
      const deepestClass = symbolNodeM1.searchUpward(whitelistClass);

      assert(!(deepestFun?.searchResult instanceof SymbolFound));
      assert(deepestFun?.searchResult.symbol === undefined);

      assert(deepestMeth !== undefined);
      assert(deepestMeth?.searchResult.symbol?.name === 'm1');

      assert(deepestFunAndMeth !== undefined);
      assert(deepestFunAndMeth?.searchResult.symbol?.name === 'm1');

      assert(deepestClass === null);
    });
  });
});
