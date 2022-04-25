import * as assert from 'assert';
import { Configuration } from '../testConfiguration';
import { setupWorkspace, cleanUpWorkspace } from '../testUtils';
import { ImTurnOffCM } from '../../src/actions/plugins/imTurnOffCM';
import { Mode } from '../../src/mode/mode';

suite('turn off IME conversion mode plugin', () => {
  function fakeExecute(cmd: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      resolve('');
    });
  }

  setup(async () => {
    const configuration = new Configuration();
    configuration.imTurnOffConversionMode.enable = true;
    await setupWorkspace(configuration);
  });

  teardown(cleanUpWorkspace);

  test('turn off IME conversion mode mode', async () => {
    const imTurnOffCM = new ImTurnOffCM(fakeExecute);
    await imTurnOffCM.turnOffConversionMode(Mode.Insert, Mode.Normal);
    await imTurnOffCM.turnOffConversionMode(Mode.Normal, Mode.Insert);
    await imTurnOffCM.turnOffConversionMode(Mode.Insert, Mode.Normal);
  });
});
