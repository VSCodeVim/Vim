import { CommandLineHistory } from '../../src/cmd_line/commandLineHistory';
import { assertEqual, setupWorkspace, cleanUpWorkspace } from '../testUtils';
import { Configuration } from '../testConfiguration';
import { configuration } from '../../src/configuration/configuration';

suite('command-line history', () => {
  const _fs = require('fs');
  const _os = require('os');
  const _path = require('path');
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

  setup(async () => {
    let _configuration: Configuration = new Configuration();
    await setupWorkspace(_configuration);

    run_cmds = new Array();
    for (let i: number = 0; i < _configuration.history; i++) {
      run_cmds.push(i.toString());
    }
    history = new CommandLineHistory();
  });

  teardown(async () => {
    cleanUpWorkspace();
  });

  test('add command', async () => {
    for (let cmd of run_cmds) {
      history.add(cmd);
    }
    assertArrayEquals(run_cmds.slice().reverse(), history.get());
  });

  test('add empty command', async () => {
    for (let cmd of run_cmds) {
      history.add(cmd);
    }
    history.add('');
    assertArrayEquals(run_cmds.slice().reverse(), history.get());
    history.add(undefined);
    assertArrayEquals(run_cmds.slice().reverse(), history.get());
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
        .splice(1, configuration.history)
        .reverse(),
      history.get()
    );
  });

  test('add command that exists in history', async () => {
    for (let cmd of run_cmds) {
      history.add(cmd);
    }
    let existed_cmd: string = '0';
    history.add(existed_cmd);
    let expected_raw_history: string[] = run_cmds.slice().reverse();
    expected_raw_history.splice(expected_raw_history.indexOf(existed_cmd), 1);
    expected_raw_history.unshift(existed_cmd);
    assertArrayEquals(expected_raw_history, history.get());
  });

  test('load and save history', async () => {
    let filePath: string = _path.join(_os.tmpdir(), rndName());
    history.setFilePath(filePath);

    await history.load();
    for (let cmd of run_cmds) {
      history.add(cmd);
    }
    await history.save();

    await history.load();
    assertArrayEquals(run_cmds.slice().reverse(), history.get());
    await history.save();
  });

  test('change configuration.history', async () => {
    let filePath: string = _path.join(_os.tmpdir(), rndName());
    history.setFilePath(filePath);

    await history.load();
    for (let cmd of run_cmds) {
      history.add(cmd);
    }
    configuration.history = 10;
    assertArrayEquals(
      run_cmds
        .slice()
        .splice(run_cmds.length - 10)
        .reverse(),
      history.get()
    );
    await history.save();

    await history.load();
    assertArrayEquals(
      run_cmds
        .slice()
        .splice(run_cmds.length - 10)
        .reverse(),
      history.get()
    );
    await history.save();
  });
});
