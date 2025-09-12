import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('cmd_line change', () => {
  setup(async () => {
    await setupWorkspace();
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: 'c deletes current line and enters insert mode',
    start: ['first line', 'sec|ond line', 'third line'],
    keysPressed: ':c\n',
    end: ['first line', '|', 'third line'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'c with count deletes multiple lines and enters insert mode',
    start: ['first line', 'sec|ond line', 'third line', 'fourth line'],
    keysPressed: ':c2\n',
    end: ['first line', '|', 'fourth line'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'c with range deletes specified lines and enters insert mode',
    start: ['first line', 'sec|ond line', 'third line', 'fourth line'],
    keysPressed: ':2, 3c\n',
    end: ['first line', '|', 'fourth line'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'c with range and visual selection',
    start: ['first line', 'sec|ond line', 'third line', 'fourth line'],
    keysPressed: 'V:c\n',
    end: ['first line', '|', 'third line', 'fourth line'],
    endMode: Mode.Insert,
  });
});
