import * as assert from 'assert';

import { Scanner } from '../../src/cmd_line/scanner';

suite('command line scanner', () => {
  test('ctor', () => {
    var state = new Scanner('dog');
    assert.equal(state.input, 'dog');
  });

  test('can detect EOF with empty input', () => {
    var state = new Scanner('');
    assert.ok(state.isAtEof);
  });

  test('next() returns EOF at EOF', () => {
    var state = new Scanner('');
    assert.equal(state.next(), Scanner.EOF);
    assert.equal(state.next(), Scanner.EOF);
    assert.equal(state.next(), Scanner.EOF);
  });

  test('can scan', () => {
    var state = new Scanner('dog');
    assert.equal(state.next(), 'd');
    assert.equal(state.next(), 'o');
    assert.equal(state.next(), 'g');
    assert.equal(state.next(), Scanner.EOF);
  });

  test('can emit', () => {
    var state = new Scanner('dog cat');
    state.next();
    state.next();
    state.next();
    assert.equal(state.emit(), 'dog');
    state.next();
    state.next();
    state.next();
    state.next();
    assert.equal(state.emit(), ' cat');
  });

  test('can ignore', () => {
    var state = new Scanner('dog cat');
    state.next();
    state.next();
    state.next();
    state.next();
    state.ignore();
    state.next();
    state.next();
    state.next();
    assert.equal(state.emit(), 'cat');
  });

  test('can skip whitespace', () => {
    var state = new Scanner('dog   cat');
    state.next();
    state.next();
    state.next();
    state.ignore();
    state.skipWhiteSpace();
    assert.equal(state.next(), 'c');
  });

  test('can skip whitespace with one char before EOF', () => {
    var state = new Scanner('dog c');
    state.next();
    state.next();
    state.next();
    state.ignore();
    state.skipWhiteSpace();
    assert.equal(state.next(), 'c');
  });

  test('can skip whitespace at EOF', () => {
    var state = new Scanner('dog   ');
    state.next();
    state.next();
    state.next();
    state.ignore();
    state.skipWhiteSpace();
    assert.equal(state.next(), Scanner.EOF);
  });

  test('nextWord() return EOF at EOF', () => {
    var state = new Scanner('');
    assert.equal(state.nextWord(), Scanner.EOF);
    assert.equal(state.nextWord(), Scanner.EOF);
    assert.equal(state.nextWord(), Scanner.EOF);
  });

  test('nextWord() return word before trailing spaces', () => {
    var state = new Scanner('dog   cat');
    assert.equal(state.nextWord(), 'dog');
  });

  test('nextWord() can skip whitespaces and return word ', () => {
    var state = new Scanner('   dog   cat');
    assert.equal(state.nextWord(), 'dog');
  });

  test('nextWord() return word before EOF', () => {
    var state = new Scanner('dog   cat');
    state.nextWord();
    assert.equal(state.nextWord(), 'cat');
  });

  test('can expect one of a set', () => {
    var state = new Scanner('dog cat');
    state.expectOneOf(['dog', 'mule', 'monkey']);
  });

  test('can expect only one of a set', () => {
    var state = new Scanner('dog cat');
    assert.throws(() => state.expectOneOf(['mule', 'monkey']));
  });
});
