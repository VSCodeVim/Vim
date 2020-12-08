import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import { HistoryFile } from '../../src/history/historyFile';
import { setupWorkspace, cleanUpWorkspace, rndName, TestExtensionContext } from '../testUtils';
import { configuration } from '../../src/configuration/configuration';
import { Globals } from '../../src/globals';

suite('HistoryFile', () => {
  let history: HistoryFile;
  let run_cmds: string[];

  const assertArrayEquals = (expected: any[], actual: any[]) => {
    assert.strictEqual(expected.length, actual.length);
    for (let i: number = 0; i < expected.length; i++) {
      assert.strictEqual(expected[i], actual[i]);
    }
  };

  setup(async () => {
    await setupWorkspace();

    run_cmds = [];
    for (let i = 0; i < configuration.history; i++) {
      run_cmds.push(i.toString());
    }

    Globals.extensionStoragePath = os.tmpdir();
    history = new HistoryFile(new TestExtensionContext(), rndName());
    await history.load();
  });

  teardown(async () => {
    await cleanUpWorkspace();
    history.clear();
  });

  test('add command', async () => {
    for (const cmd of run_cmds) {
      await history.add(cmd);
    }
    assertArrayEquals(run_cmds.slice(), history.get());
  });

  test('add empty command', async () => {
    for (const cmd of run_cmds) {
      await history.add(cmd);
    }
    await history.add('');
    assertArrayEquals(run_cmds.slice(), history.get());
    await history.add(undefined);
    assertArrayEquals(run_cmds.slice(), history.get());
  });

  test('add command over configuration.history', async () => {
    for (const cmd of run_cmds) {
      await history.add(cmd);
    }
    const added_cmd: string = String(configuration.history);
    run_cmds.push(added_cmd);
    await history.add(added_cmd);

    assertArrayEquals(run_cmds.slice(1), history.get());
  });

  test('add command that exists in history', async () => {
    for (const cmd of run_cmds) {
      await history.add(cmd);
    }
    const existed_cmd: string = '0';
    await history.add(existed_cmd);
    const expected_raw_history: string[] = run_cmds.slice();
    expected_raw_history.splice(expected_raw_history.indexOf(existed_cmd), 1);
    expected_raw_history.push(existed_cmd);
    assertArrayEquals(expected_raw_history, history.get());
  });

  test('file system', async () => {
    // history file is lazily created, should not exist
    assert.strictEqual(fs.existsSync(history.historyFilePath), false);

    for (const cmd of run_cmds) {
      await history.add(cmd);
    }

    // history file should exist after an `add` operation
    assert.strictEqual(fs.existsSync(history.historyFilePath), true);

    history.clear();

    // expect history file to be deleted from file system and empty
    assert.strictEqual(fs.existsSync(history.historyFilePath), false);
  });

  test('change configuration.history', async () => {
    for (const cmd of run_cmds) {
      await history.add(cmd);
    }

    assert.strictEqual(history.get().length, configuration.history);

    configuration.history = 10;
    for (const cmd of run_cmds) {
      await history.add(cmd);
    }

    assertArrayEquals(run_cmds.slice(run_cmds.length - configuration.history), history.get());
  });
});
