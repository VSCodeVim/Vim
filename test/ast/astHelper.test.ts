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
import { assertEqualLines } from 'test/testUtils';

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
      assert.deepStrictEqual(searchRes.indicesIfInBetween, [0, 1]);
      assert(searchRes.symbol === undefined);
    });

    test('Binary search position between second symbol and third symbol', () => {
      const pos = new Position(21, 0);
      const searchRes = AstHelper.binarySearchSymbolsFromPosition(symbols, pos);

      assert(searchRes instanceof PositionBetweenSymbols);
      assert.deepStrictEqual(searchRes.indicesIfInBetween, [1, 2]);
      assert(searchRes.symbol === undefined);
    });

    test('Binary search position inside first symbol', () => {
      const pos = new Position(3, 0);
      const searchRes = AstHelper.binarySearchSymbolsFromPosition(symbols, pos);

      assert(searchRes instanceof SymbolFound);
      assert(searchRes.indexFound === 0);
      assert.deepStrictEqual(searchRes.symbol?.name, 'm1');
    });

    test('Binary search position inside 2nd symbol', () => {
      const pos = new Position(13, 0);
      const searchRes = AstHelper.binarySearchSymbolsFromPosition(symbols, pos);

      assert(searchRes instanceof SymbolFound);
      assert(searchRes.indexFound === 1);
      assert.deepStrictEqual(searchRes.symbol?.name, 'm2');
    });

    test('Binary search position inside third symbol', () => {
      const pos = new Position(23, 0);
      const searchRes = AstHelper.binarySearchSymbolsFromPosition(symbols, pos);

      assert(searchRes instanceof SymbolFound);
      assert(searchRes.indexFound === 2);
      assert.deepStrictEqual(searchRes.symbol?.name, 'm3');
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
      const searchResult = AstHelper.searchSymbolContainingPos(symbols, pos);

      assert(searchResult instanceof SymbolFound);
      assert.deepStrictEqual(searchResult.symbol?.name, 'f2');
    });

    test('Search position 2nd innermost symbol', () => {
      const pos = new Position(3, 10);
      const symbolResult = AstHelper.searchSymbolContainingPos(symbols, pos);

      assert(symbolResult instanceof BeforeFirst);
    });

    test('Search position third innermost symbol', () => {
      const pos = new Position(2, 10);
      const symbolResult = AstHelper.searchSymbolContainingPos(symbols, pos);

      assert(symbolResult instanceof BeforeFirst);
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
    const symbolResultF2 = AstHelper.searchSymbolContainingPos(symbols, posF2);

    const posM2 = new Position(3, 10);
    const symbolResultM2 = AstHelper.searchSymbolContainingPos(symbols, posM2);

    const posF1 = new Position(2, 10);
    const symbolResultf1 = AstHelper.searchSymbolContainingPos(symbols, posF1);

    const posM1 = new Position(1, 10);
    const symbolResultM1 = AstHelper.searchSymbolContainingPos(symbols, posM1);

    test('Search upward from innermost node', () => {
      const deepestFun = symbolResultF2.searchUpward(whitelistFun);
      const deepestMeth = symbolResultF2.searchUpward(whitelistMeth);
      const deepestFunAndMeth = symbolResultF2.searchUpward(whitelistFunAndMeth);
      const deepestClass = symbolResultF2.searchUpward(whitelistClass);

      assert(deepestFun !== undefined);
      assert.deepStrictEqual(deepestFun?.symbol?.name, 'f2');

      assert(deepestMeth !== undefined);
      assert.deepStrictEqual(deepestMeth?.symbol?.name, 'm2');

      assert(deepestFunAndMeth !== undefined);
      assert.deepStrictEqual(deepestFunAndMeth?.symbol?.name, 'f2');

      assert(deepestClass === null);
    });

    test('Search upward 2nd innermost symbol', () => {
      const deepestFun = symbolResultM2.searchUpward(whitelistFun);
      const deepestMeth = symbolResultM2.searchUpward(whitelistMeth);
      const deepestFunAndMeth = symbolResultM2.searchUpward(whitelistFunAndMeth);
      const deepestClass = symbolResultM2.searchUpward(whitelistClass);

      assert(deepestFun !== undefined);
      assert.deepStrictEqual(deepestFun?.symbol?.name, 'f1');

      assert(deepestMeth !== undefined);
      assert.deepStrictEqual(deepestMeth?.symbol?.name, 'm2');

      assert(deepestFunAndMeth !== undefined);
      assert.deepStrictEqual(deepestFunAndMeth?.symbol?.name, 'm2');

      assert(deepestClass === null);
    });

    test('Search upward third innermost symbol', () => {
      const deepestFun = symbolResultf1.searchUpward(whitelistFun);
      const deepestMeth = symbolResultf1.searchUpward(whitelistMeth);
      const deepestFunAndMeth = symbolResultf1.searchUpward(whitelistFunAndMeth);
      const deepestClass = symbolResultf1.searchUpward(whitelistClass);

      assert(deepestFun !== undefined);
      assert.deepStrictEqual(deepestFun?.symbol?.name, 'f1');

      assert(deepestMeth !== undefined);
      assert.deepStrictEqual(deepestMeth?.symbol?.name, 'm1');

      assert(deepestFunAndMeth !== undefined);
      assert.deepStrictEqual(deepestFunAndMeth?.symbol?.name, 'f1');

      assert(deepestClass === null);
    });

    test('Search upward outermost symbol', () => {
      const deepestFun = symbolResultM1.searchUpward(whitelistFun);
      const deepestMeth = symbolResultM1.searchUpward(whitelistMeth);
      const deepestFunAndMeth = symbolResultM1.searchUpward(whitelistFunAndMeth);
      const deepestClass = symbolResultM1.searchUpward(whitelistClass);

      assert(!(deepestFun instanceof SymbolFound));
      assert(deepestFun?.symbol === undefined);

      assert(deepestMeth !== undefined);
      assert.deepStrictEqual(deepestMeth?.symbol?.name, 'm1');

      assert(deepestFunAndMeth !== undefined);
      assert.deepStrictEqual(deepestFunAndMeth?.symbol?.name, 'm1');

      assert(deepestClass === null);
    });
  });
});
