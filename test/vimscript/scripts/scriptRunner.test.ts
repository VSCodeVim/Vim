import { toString } from '../../../src/vimscript/expression/evaluate';
import { strict as assert } from 'assert';
import { ListValue } from '../../../src/vimscript/expression/types';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { getAndUpdateModeHandler } from '../../../extensionBase';
import { ModeHandler } from '../../../src/mode/modeHandler';
import { setupWorkspace, cleanUpWorkspace } from '../../testUtils';
import { Script } from '../../../src/vimscript/script';

let modeHandler: ModeHandler;
setup(async () => {
  await setupWorkspace();
  modeHandler = (await getAndUpdateModeHandler())!;
});
teardown(cleanUpWorkspace);

suite.only('Vimscript scripts', () => {
  const scriptsDir = '../../test/vimscript/scripts';
  for (const file of readdirSync(scriptsDir)) {
    if (file.endsWith('.vim')) {
      test(file, async () => {
        const lines = readFileSync(path.join(scriptsDir, file)).toString().split('\n');
        const script = new Script(lines);
        await script.execute(modeHandler.vimState);
        const errors = (
          script.evalContext.evaluate({
            type: 'variable',
            namespace: 'v',
            name: 'errors',
          }) as ListValue
        ).items;
        for (const error of errors) {
          assert.fail(toString(error));
        }
      });
    }
  }
});
