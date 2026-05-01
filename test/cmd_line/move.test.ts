import { newTest } from '../testSimplifier';

suite(':[range]m[ove] [address] command', () => {
  newTest({
    title: ':move [address] will move the cursor line to below the line given by {address}',
    start: ['|one', 'two', 'three'],
    keysPressed: '<Esc>:m2\n',
    end: ['two', '|one', 'three'],
  });

  newTest({
    title:
      ':[range]move [address] will move the lines given by [range] to below the line given by {address}',
    start: ['|one', 'two', 'three', 'four', 'five'],
    keysPressed: '<Esc>:1,3m4\n',
    end: ['four', 'one', 'two', '|three', 'five'],
  });

  newTest({
    title: ':[range]move [address] will move the visual range',
    start: ['|one', 'two', 'three', 'four', 'five'],
    keysPressed: 'vjj:m4\n',
    end: ['four', 'one', 'two', '|three', 'five'],
  });

  newTest({
    title: ':[range]move [address], boundary test: move 3 lines to the buttom',
    start: ['|one', 'two', 'three', 'four', 'five'],
    keysPressed: '<Esc>:1,3m5\n',
    end: ['four', 'five', 'one', 'two', '|three'],
  });

  newTest({
    title: ':[range]move [address], boundary test: move 3 lines to the top',
    start: ['|one', 'two', 'three', 'four', 'five'],
    keysPressed: '<Esc>:3,4m0\n',
    end: ['three', '|four', 'one', 'two', 'five'],
  });

  newTest({
    title: ':[range]move [address] will do nothing when move a range of line into itself',
    start: ['|one', 'two', 'three', 'four', 'five'],
    keysPressed: '<Esc>:1,3m2\n',
    end: ['|one', 'two', 'three', 'four', 'five'],
  });

  newTest({
    title: ':[range]move [address] will do nothing when move a range of line right below itself',
    start: ['|one', 'two', 'three', 'four', 'five'],
    keysPressed: '<Esc>:1,3m3\n',
    end: ['|one', 'two', 'three', 'four', 'five'],
  });

  newTest({
    title: ':[range]move [address] will do nothing when move a range of line right above itself',
    start: ['|one', 'two', 'three', 'four', 'five'],
    keysPressed: '<Esc>:1,3m1\n',
    end: ['|one', 'two', 'three', 'four', 'five'],
  });
});
