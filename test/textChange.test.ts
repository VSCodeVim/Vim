import { strict as assert } from 'assert';
import * as vscode from 'vscode';
import { Position, Range } from 'vscode';

import {
  applyTextChanges,
  coalesceAdjacentReplacePairs,
  diffTextsToChanges,
  mergeDocumentChanges,
  offsetAtText,
  unapplyTextChanges,
  type ITextChange,
} from '../src/history/textChange';

suite('textChange', () => {
  const P = (line: number, character: number): Position => new Position(line, character);
  const C = (line: number, character: number, before: string, after: string): ITextChange => ({
    start: P(line, character),
    before,
    after,
  });
  const shapeOf = (changes: readonly ITextChange[]): string =>
    changes
      .map(
        (c) =>
          `${c.start.line},${c.start.character}:${JSON.stringify(c.before)}=>${JSON.stringify(c.after)}`,
      )
      .join(' | ');

  suite('offsetAtText', () => {
    test('computes offsets in a single-line string', () => {
      assert.strictEqual(offsetAtText('hello', P(0, 0)), 0);
      assert.strictEqual(offsetAtText('hello', P(0, 3)), 3);
      assert.strictEqual(offsetAtText('hello', P(0, 5)), 5);
    });

    test('computes offsets across LF line breaks', () => {
      const text = 'ab\ncde\nf';
      assert.strictEqual(offsetAtText(text, P(0, 2)), 2);
      assert.strictEqual(offsetAtText(text, P(1, 0)), 3);
      assert.strictEqual(offsetAtText(text, P(1, 3)), 6);
      assert.strictEqual(offsetAtText(text, P(2, 1)), 8);
    });

    test('counts CRLF as a two-unit line break', () => {
      const text = 'ab\r\ncde\r\nf';
      assert.strictEqual(offsetAtText(text, P(0, 2)), 2);
      assert.strictEqual(offsetAtText(text, P(1, 0)), 4);
      assert.strictEqual(offsetAtText(text, P(1, 3)), 7);
      assert.strictEqual(offsetAtText(text, P(2, 1)), 10);
    });

    test('matches TextDocument.offsetAt on real documents', async () => {
      for (const content of ['hello', 'ab\ncde\nf', 'ab\r\ncde\r\nf', 'a\n\nb', '']) {
        const document = await vscode.workspace.openTextDocument({ content });
        const text = document.getText();
        for (let line = 0; line < document.lineCount; line++) {
          const lineLength = document.lineAt(line).text.length;
          for (const character of [0, Math.floor(lineLength / 2), lineLength]) {
            const position = P(line, character);
            assert.strictEqual(
              offsetAtText(text, position),
              document.offsetAt(position),
              `content=${JSON.stringify(content)} pos=${line},${character}`,
            );
          }
        }
      }
    });
  });

  suite('applyTextChanges / unapplyTextChanges', () => {
    test('applies a single insertion', () => {
      assert.strictEqual(applyTextChanges('ab', [C(0, 1, '', 'XY')]), 'aXYb');
    });

    test('applies a single deletion', () => {
      assert.strictEqual(applyTextChanges('aXYb', [C(0, 1, 'XY', '')]), 'ab');
    });

    test('applies a single replace', () => {
      assert.strictEqual(applyTextChanges('foo', [C(0, 0, 'foo', 'bar')]), 'bar');
    });

    test('applies multiline changes', () => {
      assert.strictEqual(applyTextChanges('aaa\nbbb', [C(0, 1, 'aa\nb', 'X\nY\nZ')]), 'aX\nY\nZbb');
    });

    test('unapply inverts apply', () => {
      const initial = 'aaa\nbbb\nccc';
      const changes = [C(1, 1, 'b', 'XY'), C(0, 0, 'aaa\nbXYb', 'Q')];
      const current = applyTextChanges(initial, changes);
      assert.strictEqual(current, 'Q\nccc');
      assert.strictEqual(unapplyTextChanges(current, changes), initial);
    });
  });

  suite('diffTextsToChanges', () => {
    test('produces no changes for identical text', () => {
      assert.deepStrictEqual(diffTextsToChanges('abc', 'abc'), []);
    });

    test('translates hunks into changes that replay the transition', () => {
      const cases: Array<[string, string]> = [
        ['ab', 'aXYb'],
        ['foo bar', 'XYZ bar'],
        ['aaa\nbbb\nccc', 'Q\nccc'],
        ['line1\nline2\nline3\n', 'line1\nline3\nline4\n'],
        ['', 'whole new file\n'],
        ['whole old file\n', ''],
      ];
      for (const [oldText, newText] of cases) {
        const changes = diffTextsToChanges(oldText, newText);
        assert.strictEqual(
          applyTextChanges(oldText, changes),
          newText,
          `old=${JSON.stringify(oldText)} new=${JSON.stringify(newText)}`,
        );
        assert.strictEqual(
          unapplyTextChanges(newText, changes),
          oldText,
          `old=${JSON.stringify(oldText)} new=${JSON.stringify(newText)}`,
        );
      }
    });
  });

  suite('coalesceAdjacentReplacePairs', () => {
    test('merges a delete plus an insert at the same position', () => {
      assert.strictEqual(
        shapeOf(coalesceAdjacentReplacePairs([C(0, 0, 'foo', ''), C(0, 0, '', 'XYZ')])),
        '0,0:"foo"=>"XYZ"',
      );
    });

    test('leaves anything else untouched', () => {
      const changes = [
        C(0, 0, '', 'AA'),
        C(0, 5, '', 'BB'), // disjoint insert
        C(0, 1, 'x', 'y'), // already a replace
      ];
      assert.strictEqual(shapeOf(coalesceAdjacentReplacePairs(changes)), shapeOf(changes));
    });
  });

  suite('mergeDocumentChanges', () => {
    /**
     * Asserts that merging `changes` (which must describe initial -> current) is
     * correct in both directions, and — when `expectedShape` is given — that the
     * merged list has exactly the expected canonical shape.
     */
    const assertMerge = (initial: string, changes: ITextChange[], expectedShape?: string): void => {
      const current = applyTextChanges(initial, changes);
      const merged = mergeDocumentChanges(changes, current);
      assert.strictEqual(
        applyTextChanges(initial, merged),
        current,
        `redo broken: merged=[${shapeOf(merged)}]`,
      );
      const reversed = merged
        .map((c) => C(c.start.line, c.start.character, c.after, c.before))
        .reverse();
      assert.strictEqual(
        applyTextChanges(current, reversed),
        initial,
        `undo broken: merged=[${shapeOf(merged)}]`,
      );
      if (expectedShape !== undefined) {
        assert.strictEqual(shapeOf(merged), expectedShape);
      }
    };

    test('keeps a single change as-is', () => {
      assertMerge('ab', [C(0, 1, '', 'X')], '0,1:""=>"X"');
    });

    test('keeps disjoint changes separate', () => {
      assertMerge(
        '0123456789',
        [C(0, 1, '', 'AA'), C(0, 5, '', 'BB')],
        '0,1:""=>"AA" | 0,5:""=>"BB"',
      );
    });

    test('merges cw-like delete plus adjacent insert into one replace', () => {
      assertMerge('foo bar', [C(0, 0, 'foo', ''), C(0, 0, '', 'XYZ')], '0,0:"foo"=>"XYZ"');
    });

    // The cases below corrupted undo and/or redo with the old pairwise
    // range-intersection merge (VSCodeVim/Vim#2007).

    test('merges a deletion strictly inside a previous insertion', () => {
      assertMerge('12', [C(0, 1, '', 'abcdef'), C(0, 3, 'cde', '')], '0,1:""=>"abf"');
    });

    test('merges an insertion inside a previous insertion', () => {
      assertMerge('12', [C(0, 1, '', 'ABC'), C(0, 2, '', 'XY')], '0,1:""=>"AXYBC"');
    });

    test('merges a replace of the head of a previous insertion', () => {
      assertMerge('12', [C(0, 1, '', 'abcdef'), C(0, 1, 'ab', 'XY')], '0,1:""=>"XYcdef"');
    });

    test('merges sequential inserts at the same position in order', () => {
      assertMerge('ab', [C(0, 1, '', 'X'), C(0, 1, '', 'Y')], '0,1:""=>"YX"');
    });

    test('merges an insertion followed by a superset deletion', () => {
      assertMerge('12', [C(0, 1, '', 'ABC'), C(0, 0, '1ABC2', '')], '0,0:"12"=>""');
    });

    test('merges overlapping multiline changes', () => {
      assertMerge(
        'aaa\nbbb\nccc',
        [C(1, 1, 'b', 'XY'), C(0, 0, 'aaa\nbXYb', 'Q')],
        '0,0:"aaa\\nbbb"=>"Q"',
      );
    });

    test('merges longer chains of overlapping changes', () => {
      assertMerge(
        'abcdef',
        [C(0, 2, '', 'XX'), C(0, 3, 'Xc', ''), C(0, 1, 'b', 'ZZ')],
        '0,1:"bc"=>"ZZX"',
      );
    });

    test('merges changes in CRLF documents', () => {
      assertMerge('ab\r\ncd', [C(0, 1, '', 'X'), C(1, 1, 'd', 'Y')], '0,1:""=>"X" | 1,1:"d"=>"Y"');
    });

    test('returns the input untouched when re-derivation cannot be validated', () => {
      // Adversarial line-break soup (found by brute-forcing over CR/LF-heavy inputs):
      // diff-walk positions split lines on LF only, so with lone CRs mixed in, the
      // re-derived list cannot be mapped back to offsets and fails validation. Merging
      // must then return the input untouched rather than a list spanning nowhere.
      const initial = 'Zb\na\r\ncb';
      const current = 'Zb\rb\r\n\r\n';
      const changes = diffTextsToChanges(initial, current);
      assert.ok(changes.length >= 2);
      assert.strictEqual(shapeOf(mergeDocumentChanges(changes, current)), shapeOf(changes));
    });

    test('round-trips random multi-change steps without corruption', () => {
      // Deterministic PRNG so failures reproduce.
      /* eslint-disable no-bitwise */
      const mulberry32 = (seed: number): (() => number) => {
        let a = seed >>> 0;
        return () => {
          a |= 0;
          a = (a + 0x6d2b79f5) | 0;
          let t = Math.imul(a ^ (a >>> 15), 1 | a);
          t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
      };
      /* eslint-enable no-bitwise */
      const alphabet = ['a', 'b', 'c', 'X', ' ', '\n'];
      const positionOf = (text: string, offset: number): Position => {
        let line = 0;
        let character = 0;
        for (let i = 0; i < offset; i++) {
          if (text[i] === '\n') {
            line++;
            character = 0;
          } else {
            character++;
          }
        }
        return P(line, character);
      };

      for (let iter = 0; iter < 300; iter++) {
        const rng = mulberry32(iter * 2654435761 + 97);
        const randInt = (n: number): number => Math.floor(rng() * n);
        const randText = (maxLen: number): string => {
          let s = '';
          for (let i = 0, n = randInt(maxLen); i < n; i++) {
            s += alphabet[randInt(alphabet.length)];
          }
          return s;
        };

        const initial = randText(14);
        let current = initial;
        const changes: ITextChange[] = [];
        for (let e = 0, nEdits = 2 + randInt(3); e < nEdits; e++) {
          const startOffset = randInt(current.length + 1);
          const deleteLength = randInt(Math.min(5, current.length - startOffset) + 1);
          const before = current.slice(startOffset, startOffset + deleteLength);
          const after = randText(5);
          if (before === '' && after === '') {
            continue;
          }
          changes.push({ start: positionOf(current, startOffset), before, after });
          current =
            current.slice(0, startOffset) + after + current.slice(startOffset + deleteLength);
        }
        if (changes.length < 2) {
          continue;
        }

        const merged = mergeDocumentChanges(changes, current);
        assert.strictEqual(
          applyTextChanges(initial, merged),
          current,
          `iter=${iter} redo broken: merged=[${shapeOf(merged)}]`,
        );
        const reversed = merged
          .map((c) => C(c.start.line, c.start.character, c.after, c.before))
          .reverse();
        assert.strictEqual(
          applyTextChanges(current, reversed),
          initial,
          `iter=${iter} undo broken: merged=[${shapeOf(merged)}]`,
        );
      }
    });

    test('merged lists apply cleanly through real editor edits', async () => {
      // End-to-end shape check: drive the merged changes through actual `editor.edit`
      // calls (which reject invalid ranges) in both directions.
      const runThroughEditor = async (initial: string, changes: ITextChange[]): Promise<void> => {
        const current = applyTextChanges(initial, changes);
        const merged = mergeDocumentChanges(changes, current);
        const document = await vscode.workspace.openTextDocument({ content: initial });
        const editor = await vscode.window.showTextDocument(document);
        try {
          for (const change of merged) {
            const range = new Range(
              change.start,
              change.start.advancePositionByText(change.before),
            );
            assert.ok(
              await editor.edit((builder) => builder.replace(range, change.after)),
              `redo edit failed for [${shapeOf(merged)}]`,
            );
          }
          assert.strictEqual(editor.document.getText(), current);
          for (const change of [...merged].reverse()) {
            const range = new Range(change.start, change.start.advancePositionByText(change.after));
            assert.ok(
              await editor.edit((builder) => builder.replace(range, change.before)),
              `undo edit failed for [${shapeOf(merged)}]`,
            );
          }
          assert.strictEqual(editor.document.getText(), initial);
        } finally {
          await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }
      };

      await runThroughEditor('12', [C(0, 1, '', 'ABC'), C(0, 2, '', 'XY')]);
      await runThroughEditor('12', [C(0, 1, '', 'ABC'), C(0, 0, '1ABC2', '')]);
      await runThroughEditor('foo bar', [C(0, 0, 'foo', ''), C(0, 0, '', 'XYZ')]);
    });
  });
});
