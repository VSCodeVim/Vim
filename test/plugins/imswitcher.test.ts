import * as assert from 'assert';
import { Configuration } from '../testConfiguration';
import { setupWorkspace, cleanUpWorkspace } from '../testUtils';
import { InputMethodSwitcher } from '../../src/actions/plugins/imswitcher';
import { ModeName } from '../../src/mode/mode';

suite('Input method plugin', () => {
  let savedCmd = '';

  function fakeExecuteChinese(cmd: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (cmd === 'im-select') {
        resolve('chinese');
      } else {
        savedCmd = cmd;
        resolve('');
      }
    });
  }

  function fakeExecuteDefault(cmd: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (cmd === 'im-select') {
        resolve('default');
      } else {
        savedCmd = cmd;
        resolve('');
      }
    });
  }

  setup(async () => {
    const configuration = new Configuration();
    configuration.autoSwitchInputMethod.enable = true;
    configuration.autoSwitchInputMethod.defaultIM = 'default';
    configuration.autoSwitchInputMethod.obtainIMCmd = 'im-select';
    configuration.autoSwitchInputMethod.switchIMCmd = 'im-select {im}';
    await setupWorkspace(configuration);
  });

  teardown(cleanUpWorkspace);

  test('use default im in insert mode', async () => {
    savedCmd = '';
    const inputMethodSwitcher = new InputMethodSwitcher(fakeExecuteDefault);
    await inputMethodSwitcher.switchInputMethod(ModeName.Normal, ModeName.Insert);
    assert.strictEqual('', savedCmd);
    await inputMethodSwitcher.switchInputMethod(ModeName.Insert, ModeName.Normal);
    assert.strictEqual('', savedCmd);
    await inputMethodSwitcher.switchInputMethod(ModeName.Normal, ModeName.Insert);
    assert.strictEqual('', savedCmd);
    await inputMethodSwitcher.switchInputMethod(ModeName.Insert, ModeName.Normal);
    assert.strictEqual('', savedCmd);
  });

  test('use other im in insert mode', async () => {
    savedCmd = '';
    const inputMethodSwitcher = new InputMethodSwitcher(fakeExecuteChinese);
    await inputMethodSwitcher.switchInputMethod(ModeName.Normal, ModeName.Insert);
    assert.strictEqual('', savedCmd);
    await inputMethodSwitcher.switchInputMethod(ModeName.Insert, ModeName.Normal);
    assert.strictEqual('im-select default', savedCmd);
    await inputMethodSwitcher.switchInputMethod(ModeName.Normal, ModeName.Insert);
    assert.strictEqual('im-select chinese', savedCmd);
    await inputMethodSwitcher.switchInputMethod(ModeName.Insert, ModeName.Normal);
    assert.strictEqual('im-select default', savedCmd);
  });
});
