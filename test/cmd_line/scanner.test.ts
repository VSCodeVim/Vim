import * as assert from 'assert';

import { Scanner } from '../../src/cmd_line/scanner';

suite('command line scanner', () => {
  test('ctor', () => {
    const state = new Scanner('dog');
    assert.strictEqual(state.input, 'dog');
  });

  test('can detect EOF with empty input', () => {
    const state = new Scanner('');
    assert.ok(state.isAtEof);
  });

  test('next() returns EOF at EOF', () => {
    const state = new Scanner('');
    assert.strictEqual(state.next(), Scanner.EOF);
    assert.strictEqual(state.next(), Scanner.EOF);
    assert.strictEqual(state.next(), Scanner.EOF);
  });

  test('can scan', () => {
    const state = new Scanner('dog');
    assert.strictEqual(state.next(), 'd');
    assert.strictEqual(state.next(), 'o');
    assert.strictEqual(state.next(), 'g');
    assert.strictEqual(state.next(), Scanner.EOF);
  });

  test('can emit', () => {
    const state = new Scanner('dog cat');
    state.next();
    state.next();
    state.next();
    assert.strictEqual(state.emit(), 'dog');
    state.next();
    state.next();
    state.next();
    state.next();
    assert.strictEqual(state.emit(), ' cat');
  });

  test('can ignore', () => {
    const state = new Scanner('dog cat');
    state.next();
    state.next();
    state.next();
    state.next();
    state.ignore();
    state.next();
    state.next();
    state.next();
    assert.strictEqual(state.emit(), 'cat');
  });

  test('can skip whitespace', () => {
    const state = new Scanner('dog   cat');
    state.next();
    state.next();
    state.next();
    state.ignore();
    state.skipWhiteSpace();
    assert.strictEqual(state.next(), 'c');
  });

  test('can skip whitespace with one char before EOF', () => {
    const state = new Scanner('dog c');
    state.next();
    state.next();
    state.next();
    state.ignore();
    state.skipWhiteSpace();
    assert.strictEqual(state.next(), 'c');
  });

  test('can skip whitespace at EOF', () => {
    const state = new Scanner('dog   ');
    state.next();
    state.next();
    state.next();
    state.ignore();
    state.skipWhiteSpace();
    assert.strictEqual(state.next(), Scanner.EOF);
  });

  test('nextWord() return EOF at EOF', () => {
    const state = new Scanner('');
    assert.strictEqual(state.nextWord(), Scanner.EOF);
    assert.strictEqual(state.nextWord(), Scanner.EOF);
    assert.strictEqual(state.nextWord(), Scanner.EOF);
  });

  test('nextWord() return word before trailing spaces', () => {
    const state = new Scanner('dog   cat');
    assert.strictEqual(state.nextWord(), 'dog');
  });

  test('nextWord() can skip whitespaces and return word ', () => {
    const state = new Scanner('   dog   cat');
    assert.strictEqual(state.nextWord(), 'dog');
  });

  test('nextWord() return word before EOF', () => {
    const state = new Scanner('dog   cat');
    state.nextWord();
    assert.strictEqual(state.nextWord(), 'cat');
  });

  test('can expect one of a set', () => {
    const state = new Scanner('dog cat');
    state.expectOneOf(['dog', 'mule', 'monkey']);
  });

  test('can expect only one of a set', () => {
    const state = new Scanner('dog cat');
    assert.throws(() => state.expectOneOf(['mule', 'monkey']));
  });
});
