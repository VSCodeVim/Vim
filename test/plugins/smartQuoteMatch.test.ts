import { Configuration } from '../testConfiguration';
import { newTest } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('smartQuotes plugin', () => {
  setup(async () => {
    const configuration = new Configuration();
    // configuration.smartQuotes = true;
    await setupWorkspace(configuration, '.js');
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: 'no quotes at all',
    start: ['|abcd'],
    keysPressed: 'di"',
    end: ['|abcd'],
  });
  newTest({
    title: 'single quote - 1',
    start: ['|a"b'],
    keysPressed: 'di"',
    end: ['|a"b'],
  });
  newTest({
    title: 'single quote - 2',
    start: ['a|"b'],
    keysPressed: 'di"',
    end: ['a|"b'],
  });
  newTest({
    title: 'single quote - 3',
    start: ['a"|b'],
    keysPressed: 'di"',
    end: ['a"|b'],
  });
  newTest({
    title: 'even quotes - 1',
    start: ['|a "b" c "d" e '],
    keysPressed: 'di"',
    end: ['a "|" c "d" e '],
  });
  newTest({
    title: 'even quotes - 2',
    start: ['a |"b" c "d" e '],
    keysPressed: 'di"',
    end: ['a "|" c "d" e '],
  });
  newTest({
    title: 'even quotes - 3',
    start: ['a "|b" c "d" e '],
    keysPressed: 'di"',
    end: ['a "|" c "d" e '],
  });
  newTest({
    title: 'even quotes - 4',
    start: ['a "b|" c "d" e '],
    keysPressed: 'di"',
    end: ['a "|" c "d" e '],
  });
  newTest({
    title: 'even quotes - 5',
    start: ['a "b"| c "d" e '],
    keysPressed: 'di"',
    end: ['a "b" c "|" e '],
  });
  newTest({
    title: 'even quotes - 6',
    start: ['a "b" c |"d" e '],
    keysPressed: 'di"',
    end: ['a "b" c "|" e '],
  });
  newTest({
    title: 'even quotes - 7',
    start: ['a "b" c "|d" e '],
    keysPressed: 'di"',
    end: ['a "b" c "|" e '],
  });
  newTest({
    title: 'even quotes - 8',
    start: ['a "b" c "d|" e '],
    keysPressed: 'di"',
    end: ['a "b" c "|" e '],
  });
  newTest({
    title: 'even quotes - 9',
    start: ['a "b" c "d"| e '],
    keysPressed: 'di"',
    end: ['a "b" c "d"| e '],
  });
  newTest({
    title: 'odd quotes - 1',
    start: ['|a "b" c "d" e " f'],
    keysPressed: 'di"',
    end: ['a "|" c "d" e " f'],
  });
  newTest({
    title: 'odd quotes - 2',
    start: ['a |"b" c "d" e " f'],
    keysPressed: 'di"',
    end: ['a "|" c "d" e " f'],
  });
  newTest({
    title: 'odd quotes - 3',
    start: ['a "|b" c "d" e " f'],
    keysPressed: 'di"',
    end: ['a "|" c "d" e " f'],
  });
  newTest({
    title: 'odd quotes - 4',
    start: ['a "b|" c "d" e " f'],
    keysPressed: 'di"',
    end: ['a "|" c "d" e " f'],
  });
  newTest({
    title: 'odd quotes - 5',
    start: ['a "b"| c "d" e " f'],
    keysPressed: 'di"',
    end: ['a "b" c "|" e " f'],
  });
  newTest({
    title: 'odd quotes - 6',
    start: ['a "b" c |"d" e " f'],
    keysPressed: 'di"',
    end: ['a "b" c "|" e " f'],
  });
  newTest({
    title: 'odd quotes - 7',
    start: ['a "b" c "|d" e " f'],
    keysPressed: 'di"',
    end: ['a "b" c "|" e " f'],
  });
  newTest({
    title: 'odd quotes - 8',
    start: ['a "b" c "d|" e " f'],
    keysPressed: 'di"',
    end: ['a "b" c "|" e " f'],
  });
  newTest({
    title: 'odd quotes - 9',
    start: ['a "b" c "d"| e " f'],
    keysPressed: 'di"',
    end: ['a "b" c "d"| e " f'],
  });
  newTest({
    title: 'odd quotes - 10',
    start: ['a "b" c "d" e |" f'],
    keysPressed: 'di"',
    end: ['a "b" c "d" e |" f'],
  });
  newTest({
    title: 'odd quotes - 11',
    start: ['a "b" c "d" e "| f'],
    keysPressed: 'di"',
    end: ['a "b" c "d" e "| f'],
  });
});
