import * as assert from 'assert';
import { Globals } from '../../src/globals';
import { newTest } from '../testSimplifier';
import { RetabCommand } from '../../src/cmd_line/commands/retab';
import * as testUtils from './../testUtils';

suite(':retab', () => {
  suiteSetup(testUtils.setupWorkspace);

  suite('Retab line segments', () => {
    test('replaceSpaces=false', () => {
      const r = new RetabCommand({
        replaceSpaces: false,
      });

      assert.deepStrictEqual(r.retabLineSegment('    ', 0, 4), { value: '    ', length: 4 });
      assert.deepStrictEqual(r.retabLineSegment('    ', 2, 4), { value: '    ', length: 4 });
      assert.deepStrictEqual(r.retabLineSegment('\t', 0, 4), { value: '\t', length: 4 });
      assert.deepStrictEqual(r.retabLineSegment('\t', 1, 4), { value: '\t', length: 3 });
      assert.deepStrictEqual(r.retabLineSegment('\t ', 3, 4), { value: '\t ', length: 2 });

      assert.deepStrictEqual(r.retabLineSegment('       ', 0, 7), { value: '       ', length: 7 });
      assert.deepStrictEqual(r.retabLineSegment('    ', 3, 7), { value: '    ', length: 4 });
      assert.deepStrictEqual(r.retabLineSegment('\t  ', 0, 7), { value: '\t  ', length: 9 });
      assert.deepStrictEqual(r.retabLineSegment('  \t ', 0, 7), { value: '\t ', length: 8 });
      assert.deepStrictEqual(r.retabLineSegment('      \t', 0, 7), { value: '\t', length: 7 });
    });

    test('replaceSpaces=true', () => {
      const r = new RetabCommand({
        replaceSpaces: true,
      });

      assert.deepStrictEqual(r.retabLineSegment('    ', 0, 4), { value: '\t', length: 4 });
      assert.deepStrictEqual(r.retabLineSegment('    ', 2, 4), { value: '\t  ', length: 4 });
      assert.deepStrictEqual(r.retabLineSegment('\t', 0, 4), { value: '\t', length: 4 });
      assert.deepStrictEqual(r.retabLineSegment('\t', 1, 4), { value: '\t', length: 3 });
      assert.deepStrictEqual(r.retabLineSegment('\t ', 3, 4), { value: '\t ', length: 2 });

      assert.deepStrictEqual(r.retabLineSegment('       ', 0, 7), { value: '\t', length: 7 });
      assert.deepStrictEqual(r.retabLineSegment('    ', 3, 7), { value: '\t', length: 4 });
      assert.deepStrictEqual(r.retabLineSegment('\t  ', 0, 7), { value: '\t  ', length: 9 });
      assert.deepStrictEqual(r.retabLineSegment('  \t ', 0, 7), { value: '\t ', length: 8 });
      assert.deepStrictEqual(r.retabLineSegment('      \t', 0, 7), { value: '\t', length: 7 });
    });
  });

  suite('Retab lines', () => {
    test('replaceSpaces=false', () => {
      const r = new RetabCommand({
        replaceSpaces: false,
      });

      assert.strictEqual(r.retabLine('', 4), '');
      assert.strictEqual(r.retabLine('abcd', 4), 'abcd');
      assert.strictEqual(r.retabLine('ab  ', 4), 'ab  ');
      assert.strictEqual(r.retabLine(' bc ', 4), ' bc ');
      assert.strictEqual(r.retabLine('  cd', 4), '  cd');
    });

    test('replaceSpaces=true', () => {
      const r = new RetabCommand({
        replaceSpaces: true,
      });

      assert.strictEqual(r.retabLine('', 4), '');
      assert.strictEqual(r.retabLine('abcd', 4), 'abcd');
      assert.strictEqual(r.retabLine('ab  ', 4), 'ab\t');
      assert.strictEqual(r.retabLine(' bc ', 4), ' bc\t');
      assert.strictEqual(r.retabLine('  cd', 4), '  cd');
    });
  });

  suite('Expand lines segments', () => {
    test('replaceSpaces=false', () => {
      const r = new RetabCommand({
        replaceSpaces: false,
      });

      assert.strictEqual(r.expandtab('    ', 0, 4), '    ');
      assert.strictEqual(r.expandtab('    ', 2, 4), '    ');
      assert.strictEqual(r.expandtab('\t', 0, 4), '    ');
      assert.strictEqual(r.expandtab('\t', 1, 4), '   ');
      assert.strictEqual(r.expandtab('\t ', 3, 4), '  ');

      assert.strictEqual(r.expandtab('       ', 0, 7), '       ');
      assert.strictEqual(r.expandtab('    ', 3, 7), '    ');
      assert.strictEqual(r.expandtab('\t  ', 0, 7), '         ');
      assert.strictEqual(r.expandtab('  \t ', 0, 7), '        ');
      assert.strictEqual(r.expandtab('      \t', 0, 7), '       ');
    });

    test('replaceSpaces=true', () => {
      const r = new RetabCommand({
        replaceSpaces: true,
      });

      assert.strictEqual(r.expandtab('    ', 0, 4), '    ');
      assert.strictEqual(r.expandtab('    ', 2, 4), '    ');
      assert.strictEqual(r.expandtab('\t', 0, 4), '    ');
      assert.strictEqual(r.expandtab('\t', 1, 4), '   ');
      assert.strictEqual(r.expandtab('\t ', 3, 4), '  ');

      assert.strictEqual(r.expandtab('       ', 0, 7), '       ');
      assert.strictEqual(r.expandtab('    ', 3, 7), '    ');
      assert.strictEqual(r.expandtab('\t  ', 0, 7), '         ');
      assert.strictEqual(r.expandtab('  \t ', 0, 7), '        ');
      assert.strictEqual(r.expandtab('      \t', 0, 7), '       ');
    });
  });

  const start = ['|a       b   \tc   d'];

  suite(':retab (tabstop=4, noexpandtab)', () => {
    setup(async () => {
      Globals.mockConfiguration.tabstop = 4;
      Globals.mockConfiguration.expandtab = false;

      await testUtils.reloadConfiguration();
    });

    newTest({ title: 'retab', start, keysPressed: ':retab\n', end: ['|a       b\t\tc   d'] });
    newTest({ title: 'retab!', start, keysPressed: ':retab!\n', end: ['|a\t\tb\t\tc\td'] });
    newTest({ title: 'retab 4', start, keysPressed: ':retab 4\n', end: ['|a       b\t\tc   d'] });
    newTest({ title: 'retab! 4', start, keysPressed: ':retab! 4\n', end: ['|a\t\tb\t\tc\td'] });
    newTest({ title: 'retab 7', start, keysPressed: ':retab 7\n', end: ['|a       b\t  c   d'] });
    newTest({ title: 'retab! 7', start, keysPressed: ':retab! 7\n', end: ['|a\t b\t  c   d'] });
  });

  suite(':retab (tabstop=7, noexpandtab)', () => {
    setup(async () => {
      Globals.mockConfiguration.tabstop = 7;
      Globals.mockConfiguration.expandtab = false;

      await testUtils.reloadConfiguration();
    });

    newTest({ title: 'retab', start, keysPressed: ':retab\n', end: ['|a       b\tc   d'] });
    newTest({ title: 'retab!', start, keysPressed: ':retab!\n', end: ['|a\t b\tc   d'] });
    newTest({ title: 'retab 4', start, keysPressed: ':retab 4\n', end: ['|a       b\t  c   d'] });
    newTest({ title: 'retab! 4', start, keysPressed: ':retab! 4\n', end: ['|a\t\tb\t  c\t  d'] });
    newTest({ title: 'retab 7', start, keysPressed: ':retab 7\n', end: ['|a       b\tc   d'] });
    newTest({ title: 'retab! 7', start, keysPressed: ':retab! 7\n', end: ['|a\t b\tc   d'] });
  });

  suite(':retab (tabstop=4, expandtab)', () => {
    setup(async () => {
      Globals.mockConfiguration.tabstop = 4;
      Globals.mockConfiguration.expandtab = true;

      await testUtils.reloadConfiguration();
    });

    const end = ['|a       b       c   d'];

    newTest({ title: 'retab', start, keysPressed: ':retab\n', end });
    newTest({ title: 'retab!', start, keysPressed: ':retab!\n', end });
    newTest({ title: 'retab 4', start, keysPressed: ':retab 4\n', end });
    newTest({ title: 'retab! 4', start, keysPressed: ':retab! 4\n', end });
    newTest({ title: 'retab 7', start, keysPressed: ':retab 7\n', end });
    newTest({ title: 'retab! 7', start, keysPressed: ':retab! 7\n', end });
  });

  suite(':retab (tabstop=7, expandtab)', () => {
    setup(async () => {
      Globals.mockConfiguration.tabstop = 7;
      Globals.mockConfiguration.expandtab = true;

      await testUtils.reloadConfiguration();
    });

    const end = ['|a       b     c   d'];

    newTest({ title: 'retab', start, keysPressed: ':retab\n', end });
    newTest({ title: 'retab!', start, keysPressed: ':retab!\n', end });
    newTest({ title: 'retab 4', start, keysPressed: ':retab 4\n', end });
    newTest({ title: 'retab! 4', start, keysPressed: ':retab! 4\n', end });
    newTest({ title: 'retab 7', start, keysPressed: ':retab 7\n', end });
    newTest({ title: 'retab! 7', start, keysPressed: ':retab! 7\n', end });
  });
});
