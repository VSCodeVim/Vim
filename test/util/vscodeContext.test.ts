import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';

import { VSCodeContext } from '../../src/util/vscodeContext';
import { rndName } from '../testUtils';

suite('VSCodeContext', () => {
  let sandbox: sinon.SinonSandbox;
  /** The values sent with `setContext`, in order */
  let sent: unknown[];
  /** Finishes the oldest `setContext` call still on its way */
  let finishOne: () => Promise<void>;
  /** Fails the oldest `setContext` call still on its way */
  let failOne: () => Promise<void>;
  let key: string;

  setup(() => {
    sandbox = sinon.createSandbox();
    sent = [];
    const pending: Array<{ resolve: () => void; reject: (error: Error) => void }> = [];
    // Let `VSCodeContext` see that the call ended, and send the next value if there is one
    const afterCall = async () => new Promise((resolve) => setImmediate(resolve));
    finishOne = async () => {
      pending.shift()!.resolve();
      await afterCall();
    };
    failOne = async () => {
      pending.shift()!.reject(new Error('setContext failed'));
      await afterCall();
    };

    const executeCommand = vscode.commands.executeCommand.bind(vscode.commands);
    sandbox
      .stub(vscode.commands, 'executeCommand')
      .callsFake(async (command, ...args: unknown[]) => {
        if (command !== 'setContext' || args[0] !== key) {
          return executeCommand(command, ...args);
        }
        sent.push(args[1]);
        await new Promise<void>((resolve, reject) => pending.push({ resolve, reject }));
        return undefined;
      });
    key = `vim.test.${rndName()}`;
  });

  teardown(() => {
    sandbox.restore();
  });

  test('sends only the latest of the values set while one is on its way', async () => {
    const promises = [
      VSCodeContext.set(key, 'a'),
      VSCodeContext.set(key, 'b'),
      VSCodeContext.set(key, 'c'),
    ];
    assert.deepStrictEqual(sent, ['a']);
    assert.strictEqual(VSCodeContext.get(key), 'c');

    await finishOne();
    assert.deepStrictEqual(sent, ['a', 'c']);

    await finishOne();
    await Promise.all(promises);
    assert.deepStrictEqual(sent, ['a', 'c']);
  });

  test("doesn't send again when the value is set back to the one on its way", async () => {
    const promises = [VSCodeContext.set(key, 'a'), VSCodeContext.set(key, 'b')];
    promises.push(VSCodeContext.set(key, 'a'));

    await finishOne();
    await Promise.all(promises);
    assert.deepStrictEqual(sent, ['a']);
  });

  test("doesn't send a value VS Code already has", async () => {
    const first = VSCodeContext.set(key, true);
    await finishOne();
    await first;

    await VSCodeContext.set(key, true);
    assert.deepStrictEqual(sent, [true]);
  });

  test('sends the latest value again after a call fails', async () => {
    const settled = Promise.allSettled([VSCodeContext.set(key, 'a'), VSCodeContext.set(key, 'b')]);

    await failOne();
    assert.deepStrictEqual(
      (await settled).map((result) => result.status),
      ['rejected', 'rejected'],
    );
    assert.deepStrictEqual(sent, ['a']);

    const retry = VSCodeContext.set(key, 'b');
    assert.deepStrictEqual(sent, ['a', 'b']);
    await finishOne();
    await retry;
  });
});
