import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import { HistoryFile } from '../../src/history/historyFile';
import { rndName, TestExtensionContext } from '../testUtils';
import { configuration } from '../../src/configuration/configuration';
import { Globals } from '../../src/globals';

suite('HistoryFile', () => {
  let history: HistoryFile;
  let runCmds: string[];

  const assertArrayEquals = <T>(expected: T[], actual: T[]) => {
    assert.strictEqual(expected.length, actual.length);
    for (let i: number = 0; i < expected.length; i++) {
      assert.strictEqual(expected[i], actual[i]);
    }
  };

  setup(async () => {
    runCmds = [];
    for (let i = 0; i < configuration.history; i++) {
      runCmds.push(i.toString());
    }

    Globals.extensionStoragePath = os.tmpdir();
    history = new HistoryFile(new TestExtensionContext(), rndName());
    await history.load();
  });

  teardown(async () => {
    history.clear();
  });

  test('add command', async () => {
    for (const cmd of runCmds) {
      await history.add(cmd);
    }
    assertArrayEquals(runCmds.slice(), history.get());
  });

  test('add empty command', async () => {
    for (const cmd of runCmds) {
      await history.add(cmd);
    }
    await history.add('');
    assertArrayEquals(runCmds.slice(), history.get());
    await history.add(undefined);
    assertArrayEquals(runCmds.slice(), history.get());
  });

  test('add command over configuration.history', async () => {
    for (const cmd of runCmds) {
      await history.add(cmd);
    }
    const addedCmd: string = String(configuration.history);
    runCmds.push(addedCmd);
    await history.add(addedCmd);

    assertArrayEquals(runCmds.slice(1), history.get());
  });

  test('add command that exists in history', async () => {
    for (const cmd of runCmds) {
      await history.add(cmd);
    }
    const existedCmd: string = '0';
    await history.add(existedCmd);
    const expectedRawHistory: string[] = runCmds.slice();
    expectedRawHistory.splice(expectedRawHistory.indexOf(existedCmd), 1);
    expectedRawHistory.push(existedCmd);
    assertArrayEquals(expectedRawHistory, history.get());
  });

  test('file system', async () => {
    // history file is lazily created, should not exist
    assert.strictEqual(fs.existsSync(history.historyFilePath), false);

    for (const cmd of runCmds) {
      await history.add(cmd);
    }

    // history file should exist after an `add` operation
    assert.strictEqual(fs.existsSync(history.historyFilePath), true);

    history.clear();

    // expect history file to be deleted from file system and empty
    assert.strictEqual(fs.existsSync(history.historyFilePath), false);
  });

  test('change configuration.history', async () => {
    for (const cmd of runCmds) {
      await history.add(cmd);
    }

    assert.strictEqual(history.get().length, configuration.history);

    configuration.history = 10;
    for (const cmd of runCmds) {
      await history.add(cmd);
    }

    assertArrayEquals(runCmds.slice(runCmds.length - configuration.history), history.get());
  });
});
