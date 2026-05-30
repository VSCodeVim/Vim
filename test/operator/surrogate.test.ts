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

  // === Append (a) ===
  newTest({
    title: 'append after surrogate pair character',
    start: ['|𩸽text'],
    keysPressed: 'a!<Esc>',
    end: ['𩸽|!text'],
  });

  newTest({
    title: 'append after emoji',
    start: ['|😄text'],
    keysPressed: 'a!<Esc>',
    end: ['😄|!text'],
  });

  newTest({
    title: 'append after surrogate pair at end of line',
    start: ['text|😄'],
    keysPressed: 'a!<Esc>',
    end: ['text😄|!'],
  });

  // === Replace (r) ===
  newTest({
    title: 'replace surrogate pair character with ASCII',
    start: ['|😄text'],
    keysPressed: 'ra',
    end: ['|atext'],
  });

  newTest({
    title: 'replace ASCII char before surrogate pair',
    start: ['a|bc😄'],
    keysPressed: 'rx',
    end: ['a|xc😄'],
  });

  newTest({
    title: 'replace count spanning surrogate pairs',
    start: ['|😄😄text'],
    keysPressed: '2rx',
    end: ['x|xtext'],
  });

  newTest({
    title: 'replace count exceeding remaining surrogate-pair chars is a no-op',
    start: ['|😄'],
    keysPressed: '2rx',
    end: ['|😄'],
  });

  // === Toggle case (~) ===
  newTest({
    title: 'toggle case advances past surrogate pair',
    start: ['|😄abc'],
    keysPressed: '~',
    end: ['😄|abc'],
  });

  // === Change char (s) ===
  newTest({
    title: 'change surrogate pair character',
    start: ['|😄text'],
    keysPressed: 'sx<Esc>',
    end: ['|xtext'],
  });

  // === Delete char (x/X) - regression tests ===
  newTest({
    title: 'delete surrogate pair with x',
    start: ['|😄text'],
    keysPressed: 'x',
    end: ['|text'],
  });

  newTest({
    title: 'delete char before surrogate pair with X',
    start: ['a|😄text'],
    keysPressed: 'X',
    end: ['|😄text'],
  });

  // === Mathematical symbols — surrogate pairs in U+1D400 block (#8321) ===
  newTest({
    title: 'replace math symbol with ASCII',
    start: ['|𝒟text'],
    keysPressed: 'rD',
    end: ['|Dtext'],
  });

  newTest({
    title: 'append after math symbol',
    start: ['|𝔸text'],
    keysPressed: 'a!<Esc>',
    end: ['𝔸|!text'],
  });

  // === Vertical movement (j/k) with surrogate pairs (#8321) ===
  newTest({
    title: 'move down and up with surrogate pairs',
    start: ['😄🐕|𩸽', '😄🐕𩸽'],
    keysPressed: 'jk',
    end: ['😄🐕|𩸽', '😄🐕𩸽'],
  });
});
