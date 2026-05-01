import { Mode } from '../../../src/mode/mode';
import { newTest } from '../../testSimplifier';

suite('Mode Normal', () => {
  newTest({
    title: "Can handle 'x'",
    start: ['te|xt'],
    keysPressed: 'x',
    end: ['te|t'],
  });

  newTest({
    title: "Can handle 'Nx'",
    start: ['te|xt'],
    keysPressed: '2x',
    end: ['t|e'],
  });

  newTest({
    title: "Can handle 'Nx' and paste",
    start: ['t|ext'],
    keysPressed: '2xo<Esc>p',
    end: ['tt', 'e|x'],
  });

  newTest({
    title: "Can handle 'x' at end of line",
    start: ['one tw|o'],
    keysPressed: '^llxxxxxxxxx',
    end: ['|'],
  });

  newTest({
    title: "'x' with count does not go over EOL",
    start: ['one t|wo', 'three four'],
    keysPressed: '1000x',
    end: ['one |t', 'three four'],
  });

  newTest({
    title: "Can handle 'Ns'",
    start: ['|text'],
    keysPressed: '3s',
    end: ['|t'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'Ns' at end of line",
    start: ['te|xt'],
    keysPressed: '3s',
    end: ['te|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle '<Del>'",
    start: ['te|xt'],
    keysPressed: '<Del>',
    end: ['te|t'],
  });

  newTest({
    title: "Can handle '<Del>' with counts, which removes the last character of the count",
    start: ['|text'],
    keysPressed: '10<Del>x',
    end: ['|ext'],
  });

  newTest({
    title: "Can handle '<Del>' at end of line",
    start: ['one tw|o'],
    keysPressed: '^ll<Del><Del><Del><Del><Del><Del><Del><Del><Del>',
    end: ['|'],
  });

  newTest({
    title: "Can handle 'cc'",
    start: ['one', '|one two', 'three'],
    keysPressed: 'cca<Esc>',
    end: ['one', '|a', 'three'],
  });

  newTest({
    title: "Can handle 'Ncc'",
    start: ['one', '|one two', 'three four', 'five'],
    keysPressed: '2cca<Esc>',
    end: ['one', '|a', 'five'],
  });

  newTest({
    title: "Can handle 'yy'",
    start: ['|one'],
    keysPressed: 'yyO<Esc>p',
    end: ['', '|one', 'one'],
  });

  newTest({
    title: "Can handle 'D'",
    start: ['tex|t'],
    keysPressed: '^llD',
    end: ['t|e'],
  });

  newTest({
    title: "Can handle 'D' on empty lines",
    start: ['text', '|', 'text'],
    keysPressed: 'D',
    end: ['text', '|', 'text'],
  });

  newTest({
    title: "Can handle 'D' with count 1",
    start: ['o|ne', 'two', 'three'],
    keysPressed: '1D',
    end: ['|o', 'two', 'three'],
  });

  newTest({
    title: "Can handle 'D' with count 3",
    start: ['o|ne', 'two', 'three', 'four'],
    keysPressed: '3D',
    end: ['|o', 'four'],
  });

  newTest({
    title: "Can handle 'D' with count exceeding max number of rows",
    start: ['o|ne', 'two', 'three', 'four'],
    keysPressed: '100D',
    end: ['|o'],
  });

  newTest({
    title: "Can handle 'D' with count when end position is on blank line",
    start: ['o|ne', '', 'three'],
    keysPressed: '2D',
    end: ['|o', 'three'],
  });

  newTest({
    title: "Can handle 'DD'",
    start: ['tex|t'],
    keysPressed: '^llDD',
    end: ['|t'],
  });

  newTest({
    title: "Can handle 'C'",
    start: ['tex|t'],
    keysPressed: '^llC',
    end: ['te|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'NC'",
    start: ['tex|t', 'one', 'two'],
    keysPressed: '^ll2C',
    end: ['te|', 'two'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'NC' and put",
    start: ['tex|t', 'one', 'two'],
    keysPressed: '"a2C<C-r>a',
    end: ['text', 'one|', 'two'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'r'",
    start: ['tex|t'],
    keysPressed: 'hrs',
    end: ['te|st'],
  });

  newTest({
    title: "Can handle '<Count>r'",
    start: ['123|456', '789'],
    keysPressed: '2ra',
    end: ['123a|a6', '789'],
  });

  newTest({
    title: "Can handle '<Count>r'",
    start: ['123|456', '789'],
    keysPressed: '4ra',
    end: ['123|456', '789'],
  });

  newTest({
    title: "Can handle 'r' after 'dd'",
    start: ['one', 'two', 'thre|e'],
    keysPressed: 'kddrT',
    end: ['one', '|Three'],
  });

  newTest({
    title: "Can handle 'r\n'",
    start: ['abc|defg', '12345'],
    keysPressed: 'r\n',
    end: ['abc', '|efg', '12345'],
  });

  // `r` only ever inserts one newline, regardless of count prefix
  newTest({
    title: "Can handle '<Count>r\n'",
    start: ['abc|defg', '12345'],
    keysPressed: '3r\n',
    end: ['abc', '|g', '12345'],
  });

  newTest({
    title: "Can handle 'J' once",
    start: ['one', 'tw|o'],
    keysPressed: 'kJ',
    end: ['one| two'],
  });

  newTest({
    title: "Can handle 'J' twice",
    start: ['one', 'two', 'thre|e'],
    keysPressed: 'kkJJ',
    end: ['one two| three'],
  });

  newTest({
    title: "Can handle 'J' with empty last line",
    start: ['one', 'two', '|'],
    keysPressed: 'kJ',
    end: ['one', 'tw|o'],
  });

  newTest({
    title: "Can handle 'J's with multiple empty last lines",
    start: ['one', 'two', '', '', '', '|'],
    keysPressed: 'kkkkkJJJJJ',
    end: ['one tw|o'],
  });

  newTest({
    title: "Can handle 'J' with leading white space on next line",
    start: ['on|e', ' two'],
    keysPressed: 'kJ',
    end: ['one| two'],
  });

  newTest({
    title: "Can handle 'J' with only white space on next line",
    start: ['on|e', '    '],
    keysPressed: 'J',
    end: ['on|e'],
  });

  newTest({
    title: "Can handle 'J' with TWO indented lines",
    start: ['   on|e', '    two'],
    keysPressed: 'kJ',
    end: ['   one| two'],
  });

  newTest({
    title: "Can handle 'J' with ')' first character on next line",
    start: ['one(', ')tw|o'],
    keysPressed: 'kJ',
    end: ['one(|)two'],
  });

  newTest({
    title: "Can handle 'J' with line ending with '.'",
    start: ['one.', 'tw|o'],
    keysPressed: 'kJ',
    end: ['one.|  two'],
  });

  newTest({
    title: "Can handle 'J' with line ending with '?'",
    start: ['one?', 'tw|o'],
    keysPressed: 'kJ',
    end: ['one?|  two'],
  });

  newTest({
    title: "Can handle 'J' with line ending with '!'",
    start: ['one!', 'tw|o'],
    keysPressed: 'kJ',
    end: ['one!|  two'],
  });

  newTest({
    title: "Can handle 'J' with line ending with tab",
    start: ['one.\t', 'tw|o'],
    keysPressed: 'kJ',
    end: ['one.\t|two'],
  });

  newTest({
    title: "Can handle 'J' with a following delete",
    start: ['on|e', 'two'],
    keysPressed: 'Jx',
    end: ['one|two'],
  });

  newTest({
    title: "Can handle 'J' with count",
    start: ['|one', 'two', 'three', 'four'],
    keysPressed: '3J',
    end: ['one two| three', 'four'],
  });

  newTest({
    title: "Can handle 'J' with count if count is larger than EOF",
    start: ['|one', 'two', 'three', 'four'],
    keysPressed: '100J',
    end: ['one two three| four'],
  });

  newTest({
    title: "Can handle 'J' in Visual Line mode",
    start: ['on|e', 'two'],
    keysPressed: 'VJ',
    end: ['one| two'],
  });

  newTest({
    title: "Can handle 'gJ' once",
    start: ['|one', 'two'],
    keysPressed: 'kgJ',
    end: ['one|two'],
  });

  newTest({
    title: "Can handle 'gJ' once when line has whitespaces",
    start: ['|one', '  two'],
    keysPressed: 'kgJ',
    end: ['one|  two'],
  });

  newTest({
    title: "Can handle 'gJ' with count",
    start: ['|one', 'two', 'three', 'four'],
    keysPressed: '3gJ',
    end: ['onetwo|three', 'four'],
  });

  newTest({
    title: "Can handle 'gJ' with count when line has whitespaces",
    start: ['|one', '  two  ', 'three', 'four'],
    keysPressed: '3gJ',
    end: ['one  two  |three', 'four'],
  });

  newTest({
    title: "Can handle 'gJ' with count and end position is blank line",
    start: ['|one', 'two', '', 'three', 'four'],
    keysPressed: '3gJ',
    end: ['onetw|o', 'three', 'four'],
  });

  newTest({
    title: "Can handle 'gJ' with count exceeding max number of rows",
    start: ['|one', 'two', 'three', 'four'],
    keysPressed: '100gJ',
    end: ['onetwothree|four'],
  });

  newTest({
    title: "Can handle '~'",
    start: ['|text'],
    keysPressed: '~',
    end: ['T|ext'],
  });

  newTest({
    title: "'~' goes over line boundaries if whichwrap contains '~'",
    config: { whichwrap: '~' },
    start: ['on|e', 'two'],
    keysPressed: '~',
    end: ['onE', '|two'],
  });

  newTest({
    title: "'~' does not goes over line boundaries if whichwrap does not contain '~'",
    config: { whichwrap: '' },
    start: ['on|e', 'two'],
    keysPressed: '~',
    end: ['on|E', 'two'],
  });

  newTest({
    title: "Can handle 'g~{motion}'",
    start: ['|one two'],
    keysPressed: 'g~w',
    end: ['|ONE two'],
  });

  newTest({
    title: "Can handle 'g~~'",
    start: ['oNe', 'Tw|O', 'tHrEe'],
    keysPressed: 'g~~',
    end: ['oNe', '|tWo', 'tHrEe'],
  });

  newTest({
    title: "Can handle '<BS>' in insert mode",
    start: ['one', '|'],
    keysPressed: 'i<BS><Esc>',
    end: ['on|e'],
  });

  newTest({
    title: 'Can handle undo with P',
    start: ['one', '|two', 'three'],
    keysPressed: 'ddkPjddu',
    end: ['two', '|one', 'three'],
  });

  newTest({
    title: "Can handle 'ge' in multiple lines case1",
    start: ['one two', 'three', 'four fiv|e'],
    keysPressed: 'gege',
    end: ['one two', 'thre|e', 'four five'],
  });

  newTest({
    title: "Can handle 'ge' in multiple lines case2",
    start: ['one two', 'three', 'four fiv|e'],
    keysPressed: 'gegegegege',
    end: ['|one two', 'three', 'four five'],
  });
});
