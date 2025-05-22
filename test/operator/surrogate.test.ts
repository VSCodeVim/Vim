import { newTest } from '../testSimplifier';

suite('surrogate-pair', () => {
  newTest({
    title: 'yank single hokke',
    start: ['|𩸽'],
    keysPressed: 'vyp',
    end: ['𩸽|𩸽'],
  });

  newTest({
    title: 'move across hokke',
    start: ['|𩸽𩸽𩸽𩸽𩸽'],
    keysPressed: 'lll',
    end: ['𩸽𩸽𩸽|𩸽𩸽'],
  });

  newTest({
    title: 'move and yank triple hokke',
    start: ['|𩸽𩸽𩸽'],
    keysPressed: 'vllyp',
    end: ['𩸽𩸽𩸽|𩸽𩸽𩸽'],
  });

  newTest({
    title: 'yank cute dog and hokke across lines',
    start: ['|𩸽𩸽𩸽🐕🐕🐕', '🐕🐕🐕𩸽𩸽𩸽'],
    keysPressed: 'vjllyP',
    end: ['|𩸽𩸽𩸽🐕🐕🐕', '🐕🐕🐕𩸽𩸽𩸽🐕🐕🐕', '🐕🐕🐕𩸽𩸽𩸽'],
  });

  newTest({
    title: 'insert a cute dog',
    start: ['|'],
    keysPressed: 'i🐕weee<ESC>',
    end: ['🐕weee|'],
  });

  newTest({
    title: 'insert some more cute dogs',
    start: ['|'],
    keysPressed: 'i🐕🐕<ESC>',
    end: ['🐕🐕|'],
  });

  newTest({
    title: 'move left over cute dog',
    start: ['|𩸽🐕', 'text'],
    keysPressed: 'jlllkh',
    end: ['|𩸽🐕', 'text'],
  });
});
