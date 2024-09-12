import { newTest } from '../testSimplifier';

suite(':[range]y[ank] [count] command', () => {
  newTest({
    title: ':yank will yank a single line',
    start: ['|one', 'two', 'three'],
    keysPressed: '<Esc>:yank\n' + 'p',
    end: ['one', '|one', 'two', 'three'],
  });

  newTest({
    title: ':yank [cnt] will yank 3 lines',
    start: ['|one', 'two', 'three', 'four', 'five'],
    keysPressed: '<Esc>:y3\n' + 'p',
    end: ['one', '|one', 'two', 'three', 'two', 'three', 'four', 'five'],
  });

  newTest({
    title: ':yank [x] [cnt] will yank [cnt] lines',
    start: ['|one', 'two', 'three', 'four', 'five'],
    keysPressed: '<Esc>:ya3\n' + 'p',
    end: ['one', '|one', 'two', 'three', 'two', 'three', 'four', 'five'],
  });

  newTest({
    title: ':yank [register] [cnt] will yank [cnt] lines',
    start: ['|one', 'two', 'three', 'four', 'five'],
    keysPressed: '<Esc>:yan3\n' + 'p',
    end: ['one', '|one', 'two', 'three', 'two', 'three', 'four', 'five'],
  });

  newTest({
    title:
      ':[range]yank [cnt] will yank from the end of the range, if range is VisualLine highlight',
    start: ['|one', 'two', 'three', 'four', 'five'],
    keysPressed: 'vjj:yan3\nG' + 'p',
    end: ['one', 'two', 'three', 'four', 'five', '|three', 'four', 'five'],
  });

  newTest({
    title: ':[range]yank [cnt] will yank [cnt] from the end of the range, if range a line number',
    start: ['|one', 'two', 'three', 'four', 'five'],
    keysPressed: '<Esc>:.+3yan2\n' + 'p',
    end: ['one', '|four', 'five', 'two', 'three', 'four', 'five'],
  });

  newTest({
    title: ':[range]yank will yank from the end of the range, if range a line number',
    start: ['|one', 'two', 'three', 'four', 'five'],
    keysPressed: '<Esc>:.+3yan\n' + 'p',
    end: ['one', '|four', 'two', 'three', 'four', 'five'],
  });
});
