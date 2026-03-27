import * as assert from 'assert';

import { evaluateWhenClause, validateWhenClause } from '../../src/configuration/whenExpression';

suite('When Expression', () => {
  test('evaluates booleans and equality checks', () => {
    const context = new Map<string, boolean | string>([
      ['vim.active', true],
      ['vim.mode', 'Normal'],
      ['vim.isTextDiffEditor', true],
    ]);

    assert.strictEqual(
      evaluateWhenClause('vim.active && vim.mode == "Normal"', (key) => context.get(key)),
      true,
    );
    assert.strictEqual(
      evaluateWhenClause('vim.active && !vim.isTextDiffEditor', (key) => context.get(key)),
      false,
    );
    assert.strictEqual(
      evaluateWhenClause('vim.mode != "Insert" && (vim.active || vim.isTextDiffEditor)', (key) =>
        context.get(key),
      ),
      true,
    );
  });

  test('reports syntax errors', () => {
    assert.notStrictEqual(validateWhenClause('vim.active && ('), undefined);
  });
});
