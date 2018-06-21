import { CommandLineHistory } from '../../src/cmd_line/commandLineHistory';
import { assertEqual, setupWorkspace, cleanUpWorkspace } from '../testUtils';
import { Configuration } from '../testConfiguration';
import { configuration } from '../../src/configuration/configuration';
import * as path from 'path';
import * as os from 'os';
import * as assert from 'assert';

suite('command-line history', () => {
  let history: CommandLineHistory;
  let run_cmds: string[];

  const assertArrayEquals = (expected: any, actual: any) => {
    assertEqual(expected.length, actual.length);
    for (let i: number = 0; i < expected.length; i++) {
      assertEqual(expected[i], actual[i]);
    }
  };

  const rndName = () => {
    return Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substr(0, 10);
  };

  const filePath = path.join(os.tmpdir(), rndName());

  setup(async () => {
    await setupWorkspace(new Configuration());

    run_cmds = [];
    for (let i = 0; i < configuration.history; i++) {
      run_cmds.push(i.toString());
    }

    history = new CommandLineHistory(filePath);
  });

  teardown(async () => {
    cleanUpWorkspace();
    history.clear();
  });

  test('add command', async () => {
    for (let cmd of run_cmds) {
      history.add(cmd);
    }
    assertArrayEquals(run_cmds.slice(), history.get());
  });

  test('add empty command', async () => {
    for (let cmd of run_cmds) {
      history.add(cmd);
    }
    history.add('');
    assertArrayEquals(run_cmds.slice(), history.get());
    history.add(undefined);
    assertArrayEquals(run_cmds.slice(), history.get());
  });

  test('add command over configuration.history', async () => {
    for (let cmd of run_cmds) {
      history.add(cmd);
    }
    let added_cmd: string = String(configuration.history);
    run_cmds.push(added_cmd);
    history.add(added_cmd);
    assertArrayEquals(
      run_cmds
        .slice()
        .splice(1, configuration.history),
      history.get()
    );
  });

  test('add command that exists in history', async () => {
    for (let cmd of run_cmds) {
      history.add(cmd);
    }
    let existed_cmd: string = '0';
    history.add(existed_cmd);
    let expected_raw_history: string[] = run_cmds.slice();
    expected_raw_history.splice(expected_raw_history.indexOf(existed_cmd), 1);
    expected_raw_history.push(existed_cmd);
    assertArrayEquals(expected_raw_history, history.get());
  });

  test('load and save history', async () => {
    for (let cmd of run_cmds) {
      history.add(cmd);
    }

    let history2 = new CommandLineHistory(filePath);
    assertArrayEquals(run_cmds.slice(), history2.get());
  });

  test('change configuration.history', async () => {
    for (let cmd of run_cmds) {
      history.add(cmd);
    }

    assert.equal(history.get().length, configuration.history);

    configuration.history = 10;
    for (let cmd of run_cmds) {
      history.add(cmd);
    }

    assertArrayEquals(
      run_cmds
        .slice()
        .splice(run_cmds.length - 10),
      history.get()
    );
  });
});
