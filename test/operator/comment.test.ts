import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

suite('comment operator', () => {
  suiteSetup(async () => {
    await setupWorkspace({ fileExtension: '.js' });
  });

  newTest({
    title: 'gcc comments out current line',
    start: ['first line', '|second line'],
    keysPressed: 'gcc',
    end: ['first line', '|// second line'],
  });

  newTest({
    title: 'gcj comments in current and next line',
    start: ['// first| line', '// second line', 'third line'],
    keysPressed: 'gcj',
    end: ['|first line', 'second line', 'third line'],
  });

  newTest({
    title: 'block comment with motion',
    start: ['function test(arg|1, arg2, arg3) {'],
    keysPressed: 'gCi)',
    end: ['function test(|/* arg1, arg2, arg3 */) {'],
  });

  newTest({
    title: 'block comment in Visual Mode',
    start: ['blah |blah blah'],
    keysPressed: 'vlllgC',
    end: ['blah |/* blah */ blah'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'comment in visual line mode',
    start: ['one', '|two', 'three', 'four'],
    keysPressed: 'Vjgc',
    end: ['one', '|// two', '// three', 'four'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'comment in visual block mode',
    start: ['one', '|two', 'three', 'four'],
    keysPressed: '<C-v>lljgc',
    end: ['one', '|// two', '// three', 'four'],
    endMode: Mode.Normal,
  });
});
