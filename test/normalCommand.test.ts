import { newTest } from './testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';

suite('Execute normal command', () => {
  setup(async () => {
    await setupWorkspace();
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: 'One liner',
    start: ['foo =| bar = 1'],
    keysPressed: ':normal f=i!=\n',
    end: ['foo = bar !|== 1'],
  });

  newTest({
    title: 'One liner with selection',
    start: ['foo =| bar = 1'],
    keysPressed: 'V:normal f=i!=\n',
    end: ['foo !|== bar = 1'],
  });
});
