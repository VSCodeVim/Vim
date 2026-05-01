import * as assert from 'assert';
import { InputMethodSwitcher } from '../../src/actions/plugins/imswitcher';
import { Mode } from '../../src/mode/mode';
import { setupWorkspace } from '../testUtils';

suite('Input method plugin', () => {
  let savedCmd = '';

  const fakeExecuteChinese = (cmd: string): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      if (cmd === 'im-select') {
        resolve('chinese');
      } else {
        savedCmd = cmd;
        resolve('');
      }
    });
  };

  const fakeExecuteDefault = (cmd: string): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      if (cmd === 'im-select') {
        resolve('default');
      } else {
        savedCmd = cmd;
        resolve('');
      }
    });
  };

  setup(async () => {
    await setupWorkspace({
      config: {
        autoSwitchInputMethod: {
          enable: true,
          defaultIM: 'default',
          obtainIMCmd: 'im-select',
          switchIMCmd: 'im-select {im}',
        },
      },
    });
  });

  test('use default im in insert mode', async () => {
    savedCmd = '';
    const inputMethodSwitcher = new InputMethodSwitcher(fakeExecuteDefault);
    await inputMethodSwitcher.switchInputMethod(Mode.Normal, Mode.Insert);
    assert.strictEqual('', savedCmd);
    await inputMethodSwitcher.switchInputMethod(Mode.Insert, Mode.Normal);
    assert.strictEqual('', savedCmd);
    await inputMethodSwitcher.switchInputMethod(Mode.Normal, Mode.Insert);
    assert.strictEqual('', savedCmd);
    await inputMethodSwitcher.switchInputMethod(Mode.Insert, Mode.Normal);
    assert.strictEqual('', savedCmd);
  });

  test('use other im in insert mode', async () => {
    savedCmd = '';
    const inputMethodSwitcher = new InputMethodSwitcher(fakeExecuteChinese);
    await inputMethodSwitcher.switchInputMethod(Mode.Normal, Mode.Insert);
    assert.strictEqual('', savedCmd);
    await inputMethodSwitcher.switchInputMethod(Mode.Insert, Mode.Normal);
    assert.strictEqual('im-select default', savedCmd);
    await inputMethodSwitcher.switchInputMethod(Mode.Normal, Mode.Insert);
    assert.strictEqual('im-select chinese', savedCmd);
    await inputMethodSwitcher.switchInputMethod(Mode.Insert, Mode.Normal);
    assert.strictEqual('im-select default', savedCmd);
  });
});
