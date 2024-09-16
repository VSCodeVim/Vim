import { newTest } from '../testSimplifier';

suite('put operator', () => {
  suite('p', () => {
    suite('Normal mode', () => {
      newTest({
        title: 'Putting empty register throws E353',
        start: ['one t|wo three'],
        keysPressed: '"xp',
        end: ['one t|wo three'],
        statusBar: 'E353: Nothing in register x',
      });

      newTest({
        title: 'Yank character-wise, <count>p',
        start: ['|XYZone two three'],
        keysPressed: 'd3l' + 'w' + '2p',
        end: ['one tXYZXY|Zwo three'],
      });

      newTest({
        title: 'Yank two lines character-wise, <count>p',
        start: ['|XYZ', 'ABCone two three'],
        keysPressed: 'vj2ld' + 'w' + '2p',
        end: ['one t|XYZ', 'ABCXYZ', 'ABCwo three'],
      });

      newTest({
        title: 'Yank line-wise, <count>p',
        start: ['|abc', 'one', 'two', 'three'],
        keysPressed: 'dd' + 'j' + '2p',
        end: ['one', 'two', '|abc', 'abc', 'three'],
      });

      newTest({
        title: 'Yank two lines line-wise, <count>p',
        start: ['|abc', 'def', 'one', 'two', 'three'],
        keysPressed: 'd2d' + 'j' + '2p',
        end: ['one', 'two', '|abc', 'def', 'abc', 'def', 'three'],
      });

      newTest({
        title: 'Yank line-wise, <count>p on last line',
        start: ['|abc', 'one', 'two', 'three'],
        keysPressed: 'dd' + 'G' + '2p',
        end: ['one', 'two', 'three', '|abc', 'abc'],
      });

      newTest({
        title: 'Yank block-wise, <count>p',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'jl' + '2p',
        end: ['ABCD', 'ab|[1][1]cd', 'wx[2][2]yz', 'WXYZ'],
      });

      newTest({
        title: 'Yank ragged block-wise selection, <count>p',
        start: ['|ABCDEFG', 'abcd', 'wxyz', 'WXYZ'],
        keysPressed: '3l' + '<C-v>j$' + 'y' + 'jh' + '2p',
        end: ['ABCDEFG', 'abc|DEFGDEFGd', 'wxyd   d   z', 'WXYZ'],
      });

      newTest({
        title: 'Yank block-wise, <count>p past last line',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'Gl' + '2p',
        end: ['ABCD', 'abcd', 'wxyz', 'WX|[1][1]YZ', '  [2][2]'],
      });

      newTest({
        title: 'Record macro, <count>p',
        start: ['|one', 'two', 'three'],
        keysPressed: 'qx' + 'ccblah<Esc>' + 'q' + '' + '"xp',
        end: ['blahccblah<Esc|>', 'two', 'three'],
      });
    });

    suite('Visual mode', () => {
      newTest({
        title: 'Yank character-wise, <count>p in Visual mode',
        start: ['one', '|two', 'three'],
        keysPressed: 'ye' + 'R123<Esc>' + 'viw' + '3p',
        end: ['one', 'twotwotw|o', 'three'],
        registers: { '"': '123' },
      });

      newTest({
        title: 'Yank line-wise, <count>p in Visual mode',
        start: ['one', '|two', 'three'],
        keysPressed: 'yy' + 'R123<Esc>' + 'viw' + '3p',
        end: ['one', '', '|two', 'two', 'two', '', 'three'],
        registers: { '"': '123' },
      });

      newTest({
        title: 'Yank block-wise, <count>p in Visual mode',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'jl' + 'vj' + '2p',
        end: ['ABCD', 'a|[1][1]yz', 'W[2][2]XYZ'],
      });
    });

    suite('VisualLine mode', () => {
      newTest({
        title: 'Yank character-wise, <count>p in VisualLine mode',
        start: ['one', '|two', 'three'],
        keysPressed: 'ye' + 'V' + '3p',
        end: ['one', '|two', 'two', 'two', 'three'],
      });

      newTest({
        title: 'Yank line-wise, <count>p in VisualLine mode',
        start: ['one', '|two', 'three'],
        keysPressed: 'yy' + 'V' + '3p',
        end: ['one', '|two', 'two', 'two', 'three'],
      });

      newTest({
        title: 'Yank block-wise, <count>p in VisualLine mode',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'jVj' + '2p',
        end: ['ABCD', '|[1]', '[2]', '[1]', '[2]', 'WXYZ'],
      });
    });

    suite('VisualBlock mode', () => {
      newTest({
        title: 'Yank character-wise, <count>p in VisualBlock mode',
        start: ['ABCDE', '|TESTabcde', '12345', 'vwxyz', 'VWXYZ'],
        keysPressed: 'd4l' + 'l<C-v>jjll' + '2p',
        end: ['ABCDE', 'aTESTTES|Te', '1TESTTEST5', 'vTESTTESTz', 'VWXYZ'],
      });

      newTest({
        title: 'Yank line-wise, <count>p in VisualBlock mode',
        start: ['ABCDE', '|TEST', 'abcde', '12345', 'vwxyz', 'VWXYZ'],
        keysPressed: 'dd' + 'l<C-v>jjll' + '2p',
        end: ['ABCDE', 'ae', '15', 'vz', '|TEST', 'TEST', 'VWXYZ'],
      });

      newTest({
        title: 'Yank block-wise, <count>p in VisualBlock mode (into smaller block)',
        start: ['|[1]ABCD', '[2]abcd', '[3]wxyz', 'WXYZ'],
        keysPressed: '<C-v>lljj' + 'd' + 'jl<C-v>lj' + '2p',
        end: ['ABCD', 'a|[1][1]d', 'w[2][2]z', 'W[3][3]XYZ'],
      });

      newTest({
        title: 'Yank block-wise, <count>p in VisualBlock mode (into larger block)',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'jl<C-v>ljj' + '2p',
        end: ['ABCD', 'a|[1][1]d', 'w[2][2]z', 'WZ'],
      });
    });
  });

  suite('P', () => {
    suite('Normal mode', () => {
      newTest({
        title: 'Yank character-wise, <count>P',
        start: ['|XYZone two three'],
        keysPressed: 'd3l' + 'w' + '2P',
        end: ['one XYZXY|Ztwo three'],
      });

      newTest({
        title: 'Yank two lines character-wise, <count>P',
        start: ['|XYZ', 'ABCone two three'],
        keysPressed: 'vj2ld' + 'w' + '2P',
        end: ['one |XYZ', 'ABCXYZ', 'ABCtwo three'],
      });

      newTest({
        title: 'Yank line-wise, <count>P',
        start: ['|abc', 'one', 'two', 'three'],
        keysPressed: 'dd' + 'j' + '2P',
        end: ['one', '|abc', 'abc', 'two', 'three'],
      });

      newTest({
        title: 'Yank line-wise, <count>P on first line',
        start: ['|abc', 'one', 'two', 'three'],
        keysPressed: 'dd' + '2P',
        end: ['|abc', 'abc', 'one', 'two', 'three'],
      });

      newTest({
        title: 'Yank block-wise, <count>P',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'jl' + '2P',
        end: ['ABCD', 'a|[1][1]bcd', 'w[2][2]xyz', 'WXYZ'],
      });

      newTest({
        title: 'Yank ragged block-wise selection, <count>P',
        start: ['|ABCDEFG', 'abcd', 'wxyz', 'WXYZ'],
        keysPressed: '3l' + '<C-v>j$' + 'y' + 'jh' + '2P',
        end: ['ABCDEFG', 'ab|DEFGDEFGcd', 'wxd   d   yz', 'WXYZ'],
      });

      newTest({
        title: 'Yank block-wise, <count>P past last line',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'Gl' + '2P',
        end: ['ABCD', 'abcd', 'wxyz', 'W|[1][1]XYZ', ' [2][2]'],
      });
    });

    suite('Visual mode', () => {
      newTest({
        title: 'Yank character-wise, <count>P in Visual mode',
        start: ['one', '|two', 'three'],
        keysPressed: 'ye' + 'R123<Esc>' + 'viw' + '3P',
        end: ['one', 'twotwotw|o', 'three'],
        registers: { '"': 'two' }, // NOTE: unnamed register not overwritten
      });

      newTest({
        title: 'Yank line-wise, <count>P in Visual mode',
        start: ['one', '|two', 'three'],
        keysPressed: 'yy' + 'R123<Esc>' + 'viw' + '3P',
        end: ['one', '', '|two', 'two', 'two', '', 'three'],
        registers: { '"': 'two' }, // NOTE: unnamed register not overwritten
      });

      newTest({
        title: 'Yank block-wise, <count>P in Visual mode',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'jl' + 'vj' + '2P',
        end: ['ABCD', 'a|[1][1]yz', 'W[2][2]XYZ'],
      });
    });

    suite('VisualLine mode', () => {
      newTest({
        title: 'Yank character-wise, <count>P in VisualLine mode',
        start: ['one', '|two', 'three'],
        keysPressed: 'ye' + 'V' + '3P',
        end: ['one', '|two', 'two', 'two', 'three'],
      });

      newTest({
        title: 'Yank line-wise, <count>P in VisualLine mode',
        start: ['one', '|two', 'three'],
        keysPressed: 'yy' + 'V' + '3P',
        end: ['one', '|two', 'two', 'two', 'three'],
      });

      newTest({
        title: 'Yank block-wise, <count>P in VisualLine mode',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'jVj' + '2P',
        end: ['ABCD', '|[1]', '[2]', '[1]', '[2]', 'WXYZ'],
      });
    });

    suite('VisualBlock mode', () => {
      newTest({
        title: 'Yank character-wise, <count>P in VisualBlock mode',
        start: ['ABCDE', '|TESTabcde', '12345', 'vwxyz', 'VWXYZ'],
        keysPressed: 'd4l' + 'l<C-v>jjll' + '2P',
        end: ['ABCDE', 'aTESTTES|Te', '1TESTTEST5', 'vTESTTESTz', 'VWXYZ'],
      });

      newTest({
        title: 'Yank line-wise, <count>P in VisualBlock mode',
        start: ['ABCDE', '|TEST', 'abcde', '12345', 'vwxyz', 'VWXYZ'],
        keysPressed: 'dd' + 'l<C-v>jjll' + '2P',
        end: ['ABCDE', '|TEST', 'TEST', 'ae', '15', 'vz', 'VWXYZ'],
      });

      newTest({
        title: 'Yank block-wise, <count>P in VisualBlock mode (into smaller block)',
        start: ['|[1]ABCD', '[2]abcd', '[3]wxyz', 'WXYZ'],
        keysPressed: '<C-v>lljj' + 'd' + 'jl<C-v>lj' + '2P',
        end: ['ABCD', 'a|[1][1]d', 'w[2][2]z', 'W[3][3]XYZ'],
      });

      newTest({
        title: 'Yank block-wise, <count>P in VisualBlock mode (into larger block)',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'jl<C-v>ljj' + '2P',
        end: ['ABCD', 'a|[1][1]d', 'w[2][2]z', 'WZ'],
      });
    });
  });

  suite('gp', () => {
    suite('Normal mode', () => {
      newTest({
        title: 'Yank character-wise, <count>gp',
        start: ['|XYZone two three'],
        keysPressed: 'd3l' + 'w' + '2gp',
        end: ['one tXYZXYZ|wo three'],
      });

      newTest({
        title: 'Yank two lines character-wise, <count>gp',
        start: ['|XYZ', 'ABCone two three'],
        keysPressed: 'vj2ld' + 'w' + '3gp',
        end: ['one tXYZ', 'ABC|XYZ', 'ABCXYZ', 'ABCwo three'],
      });

      newTest({
        title: 'Yank line-wise, <count>gp',
        start: ['|abc', 'one', 'two', 'three'],
        keysPressed: 'dd' + 'j' + '2gp',
        end: ['one', 'two', 'abc', 'abc', '|three'],
      });

      newTest({
        title: 'Yank line-wise, <count>gp on last line',
        start: ['|abc', 'one', 'two', 'three'],
        keysPressed: 'dd' + 'G' + '2gp',
        end: ['one', 'two', 'three', 'abc', '|abc'],
      });

      newTest({
        title: 'Yank block-wise, <count>gp',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'jl' + '2gp',
        end: ['ABCD', 'ab[1][1]cd', 'wx[2][2]|yz', 'WXYZ'],
      });

      newTest({
        title: 'Yank ragged block-wise selection, <count>gp',
        start: ['|abcd', 'ABCDEFG', 'wxyz', 'WXYZ'],
        keysPressed: '2l' + '<C-v>j$' + 'y' + '2gp',
        end: ['abccd   cd   d', 'ABCCDEFGCDEFG|DEFG', 'wxyz', 'WXYZ'],
      });

      newTest({
        title: 'Yank block-wise, <count>gp past last line',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'Gl' + '2gp',
        end: ['ABCD', 'abcd', 'wxyz', 'WX[1][1]YZ', '  [2][2|]'],
      });
    });

    suite('Visual mode', () => {
      newTest({
        title: 'Yank character-wise, <count>gp in Visual mode',
        start: ['one', '|two', 'three'],
        keysPressed: 'ye' + 'R123<Esc>' + 'viw' + '3gp',
        end: ['one', 'twotwotw|o', 'three'],
        registers: { '"': '123' },
      });

      newTest({
        title: 'Yank two lines character-wise, <count>gp in Visual mode',
        start: ['|XYZ', 'ABCone two three'],
        keysPressed: 'vj2ld' + 'wl' + 'v' + '3gp',
        end: ['one tXYZ', 'ABC|XYZ', 'ABCXYZ', 'ABCo three'],
      });

      newTest({
        title: 'Yank line-wise, <count>gp in Visual mode',
        start: ['one', '|two', 'three'],
        keysPressed: 'yy' + 'R123<Esc>' + 'viw' + '3gp',
        end: ['one', '', 'two', 'two', 'two', '|', 'three'],
        registers: { '"': '123' },
      });

      newTest({
        title: 'Yank block-wise, <count>gp in Visual mode',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'jl' + 'vj' + '2gp',
        end: ['ABCD', 'a[1][1]yz', 'W[2][2]|XYZ'],
      });
    });

    suite('VisualLine mode', () => {
      newTest({
        title: 'Yank character-wise, <count>gp in VisualLine mode',
        start: ['one', '|two', 'three'],
        keysPressed: 'ye' + 'V' + '3gp',
        end: ['one', 'two', 'two', 'two', '|three'],
      });

      newTest({
        title: 'Yank line-wise, <count>gp in VisualLine mode',
        start: ['one', '|two', 'three'],
        keysPressed: 'yy' + 'V' + '3gp',
        end: ['one', 'two', 'two', 'two', '|three'],
      });

      newTest({
        title: 'Yank block-wise, <count>gp in VisualLine mode',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'jVj' + '2gp',
        end: ['ABCD', '[1]', '[2]', '[1]', '[2]', '|WXYZ'],
      });
    });

    suite('VisualBlock mode', () => {
      newTest({
        title: 'Yank character-wise, <count>gp in VisualBlock mode',
        start: ['ABCDE', '|TESTabcde', '12345', 'vwxyz', 'VWXYZ'],
        keysPressed: 'd4l' + 'l<C-v>jjll' + '2gp',
        end: ['ABCDE', 'aTESTTEST|e', '1TESTTEST5', 'vTESTTESTz', 'VWXYZ'],
      });

      newTest({
        title: 'Yank line-wise, <count>gp in VisualBlock mode',
        start: ['ABCDE', '|TEST', 'abcde', '12345', 'vwxyz', 'VWXYZ'],
        keysPressed: 'dd' + 'l<C-v>jjll' + '2gp',
        end: ['ABCDE', 'ae', '15', 'vz', 'TEST', 'TEST', '|VWXYZ'],
      });

      newTest({
        title: 'Yank block-wise, <count>gp in VisualBlock mode (into smaller block)',
        start: ['|[1]ABCD', '[2]abcd', '[3]wxyz', 'WXYZ'],
        keysPressed: '<C-v>lljj' + 'd' + 'jl<C-v>lj' + '2gp',
        end: ['ABCD', 'a[1][1]d', 'w[2][2]z', 'W[3][3]|XYZ'],
      });

      newTest({
        title: 'Yank block-wise, <count>gp in VisualBlock mode (into larger block)',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'jl<C-v>ljj' + '2gp',
        end: ['ABCD', 'a[1][1]d', 'w[2][2]|z', 'WZ'],
      });
    });
  });

  suite('gP', () => {
    suite('Normal mode', () => {
      newTest({
        title: 'Yank character-wise, <count>gP',
        start: ['|XYZone two three'],
        keysPressed: 'd3l' + 'w' + '2gP',
        end: ['one XYZXYZ|two three'],
      });

      newTest({
        title: 'Yank two lines character-wise, <count>gP',
        start: ['|XYZ', 'ABCone two three'],
        keysPressed: 'vj2ld' + 'w' + '3gP',
        end: ['one XYZ', 'ABC|XYZ', 'ABCXYZ', 'ABCtwo three'],
      });

      newTest({
        title: 'Yank line-wise, <count>gP',
        start: ['|abc', 'one', 'two', 'three'],
        keysPressed: 'dd' + 'j' + '2gP',
        end: ['one', 'abc', 'abc', '|two', 'three'],
      });

      newTest({
        title: 'Yank line-wise, <count>gP on first line',
        start: ['|abc', 'one', 'two', 'three'],
        keysPressed: 'dd' + '2gP',
        end: ['abc', 'abc', '|one', 'two', 'three'],
      });

      newTest({
        title: 'Yank block-wise, <count>gP',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'jl' + '2gP',
        end: ['ABCD', 'a[1][1]bcd', 'w[2][2]|xyz', 'WXYZ'],
      });

      newTest({
        title: 'Yank ragged block-wise selection, <count>gP',
        start: ['|abcd', 'ABCDEFG', 'wxyz', 'WXYZ'],
        keysPressed: '2l' + '<C-v>j$' + 'y' + '2gP',
        end: ['abcd   cd   cd', 'ABCDEFGCDEFG|CDEFG', 'wxyz', 'WXYZ'],
      });

      newTest({
        title: 'Yank block-wise, <count>gP past last line',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'Gl' + '2gP',
        end: ['ABCD', 'abcd', 'wxyz', 'W[1][1]XYZ', ' [2][2|]'],
      });
    });

    suite('Visual mode', () => {
      newTest({
        title: 'Yank character-wise, <count>gP in Visual mode',
        start: ['one', '|two', 'three'],
        keysPressed: 'ye' + 'R123<Esc>' + 'viw' + '3gP',
        end: ['one', 'twotwotw|o', 'three'],
        registers: { '"': '123' },
      });

      newTest({
        title: 'Yank two lines character-wise, <count>gP in Visual mode',
        start: ['|XYZ', 'ABCone two three'],
        keysPressed: 'vj2ld' + 'wl' + 'v' + '3gP',
        end: ['one tXYZ', 'ABC|XYZ', 'ABCXYZ', 'ABCo three'],
      });

      newTest({
        title: 'Yank line-wise, <count>gP in Visual mode',
        start: ['one', '|two', 'three'],
        keysPressed: 'yy' + 'R123<Esc>' + 'viw' + '3gP',
        end: ['one', '', 'two', 'two', 'two', '|', 'three'],
        registers: { '"': '123' },
      });

      newTest({
        title: 'Yank block-wise, <count>gP in Visual mode',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'jl' + 'vj' + '2gP',
        end: ['ABCD', 'a[1][1]yz', 'W[2][2]|XYZ'],
      });
    });

    suite('VisualLine mode', () => {
      newTest({
        title: 'Yank character-wise, <count>gP in VisualLine mode',
        start: ['one', '|two', 'three'],
        keysPressed: 'ye' + 'V' + '3gP',
        end: ['one', 'two', 'two', 'two', '|three'],
      });

      newTest({
        title: 'Yank line-wise, <count>gP in VisualLine mode',
        start: ['one', '|two', 'three'],
        keysPressed: 'yy' + 'V' + '3gP',
        end: ['one', 'two', 'two', 'two', '|three'],
      });

      newTest({
        title: 'Yank block-wise, <count>gP in VisualLine mode',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'jVj' + '2gP',
        end: ['ABCD', '[1]', '[2]', '[1]', '[2]', '|WXYZ'],
      });
    });

    suite('VisualBlock mode', () => {
      newTest({
        title: 'Yank character-wise, <count>gP in VisualBlock mode',
        start: ['ABCDE', '|TESTabcde', '12345', 'vwxyz', 'VWXYZ'],
        keysPressed: 'd4l' + 'l<C-v>jjll' + '2gP',
        end: ['ABCDE', 'aTESTTEST|e', '1TESTTEST5', 'vTESTTESTz', 'VWXYZ'],
      });

      newTest({
        title: 'Yank line-wise, <count>gP in VisualBlock mode',
        start: ['ABCDE', '|TEST', 'abcde', '12345', 'vwxyz', 'VWXYZ'],
        keysPressed: 'dd' + 'l<C-v>jjll' + '2gP',
        end: ['ABCDE', 'TEST', 'TEST', '|ae', '15', 'vz', 'VWXYZ'],
      });

      newTest({
        title: 'Yank block-wise, <count>gP in VisualBlock mode (into smaller block)',
        start: ['|[1]ABCD', '[2]abcd', '[3]wxyz', 'WXYZ'],
        keysPressed: '<C-v>lljj' + 'd' + 'jl<C-v>lj' + '2gP',
        end: ['ABCD', 'a[1][1]d', 'w[2][2]z', 'W[3][3]|XYZ'],
      });

      newTest({
        title: 'Yank block-wise, <count>gP in VisualBlock mode (into larger block)',
        start: ['|[1]ABCD', '[2]abcd', 'wxyz', 'WXYZ'],
        keysPressed: '<C-v>llj' + 'd' + 'jl<C-v>ljj' + '2gP',
        end: ['ABCD', 'a[1][1]d', 'w[2][2]|z', 'WZ'],
      });
    });
  });

  suite(']p', () => {
    suite('Normal mode', () => {
      newTest({
        title: 'Yank character-wise, <count>]p',
        start: ['|XYZone two three'],
        keysPressed: 'd3l' + 'w' + '2]p',
        end: ['one tXYZXY|Zwo three'],
      });

      newTest({
        title: 'Yank two lines character-wise, <count>]p',
        start: ['|XYZ', 'ABCone two three'],
        keysPressed: 'vj2ld' + 'w' + '2]p',
        end: ['one t|XYZ', 'ABCXYZ', 'ABCwo three'],
      });

      newTest({
        title: 'Yank line-wise, <count>]p',
        start: ['|abc', 'one', '  two', 'three'],
        keysPressed: 'dd' + 'j' + '2]p',
        end: ['one', '  two', '  |abc', '  abc', 'three'],
      });

      // TODO: Yank block-wise, <count>]p
    });

    suite('Visual mode', () => {
      // TODO
    });

    suite('VisualLine mode', () => {
      newTest({
        title: 'Yank line-wise, <count>]p in VisualLine mode',
        start: ['|XYZ', ' one', '  two', '   three'],
        keysPressed: 'dd' + 'j' + 'V' + '2]p',
        end: [' one', '   |XYZ', '   XYZ', '   three'],
      });

      newTest({
        title: 'Yank line-wise, <count>]p in VisualLine mode on last line',
        start: ['|XYZ', ' one', '  two', '   three'],
        keysPressed: 'dd' + 'G' + 'V' + '2]p',
        end: [' one', '  two', '  |XYZ', '  XYZ'],
      });

      newTest({
        title: 'Yank line-wise, <count>]p in VisualLine mode with whole document selected',
        start: ['|XYZ', ' one', '  two', '   three'],
        keysPressed: 'dd' + 'V' + 'G' + '2]p',
        end: ['|XYZ', 'XYZ'],
      });

      // TODO: Yank block-wise, <count>]p in VisualLine
    });

    suite('VisualBlock mode', () => {
      // TODO
    });
  });

  suite('[p', () => {
    suite('Normal mode', () => {
      newTest({
        title: 'Yank character-wise, <count>[p',
        start: ['|XYZone two three'],
        keysPressed: 'd3l' + 'w' + '2[p',
        end: ['one XYZXY|Ztwo three'],
      });

      newTest({
        title: 'Yank two lines character-wise, <count>[p',
        start: ['|XYZ', 'ABCone two three'],
        keysPressed: 'vj2ld' + 'w' + '2[p',
        end: ['one |XYZ', 'ABCXYZ', 'ABCtwo three'],
      });

      newTest({
        title: 'Yank line-wise, <count>[p',
        start: ['|abc', 'one', '  two', 'three'],
        keysPressed: 'dd' + 'j' + '2[p',
        end: ['one', '  |abc', '  abc', '  two', 'three'],
      });

      // TODO: Yank block-wise, <count>[p in Visual
    });

    suite('Visual mode', () => {
      // TODO
    });

    suite('VisualLine mode', () => {
      newTest({
        title: 'Yank line-wise, <count>[p in VisualLine mode',
        start: ['|XYZ', ' one', '  two', '   three'],
        keysPressed: 'dd' + 'j' + 'V' + '2[p',
        end: [' one', '   |XYZ', '   XYZ', '   three'],
      });

      newTest({
        title: 'Yank line-wise, <count>[p in VisualLine mode on last line',
        start: ['|XYZ', ' one', '  two', '   three'],
        keysPressed: 'dd' + 'G' + 'V' + '2[p',
        end: [' one', '  two', '  |XYZ', '  XYZ'],
      });

      newTest({
        title: 'Yank line-wise, <count>[p in VisualLine mode with whole document selected',
        start: ['|XYZ', ' one', '  two', '   three'],
        keysPressed: 'dd' + 'V' + 'G' + '2[p',
        end: ['|XYZ', 'XYZ'],
      });

      // TODO: Yank block-wise, <count>[p in VisualLine
    });

    suite('VisualBlock mode', () => {
      // TODO
    });
  });
});
