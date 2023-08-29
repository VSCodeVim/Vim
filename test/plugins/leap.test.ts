import { Configuration } from '../testConfiguration';
import { newTest } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

function leapCommand(key: 's' | 'S', searchStrings: string[], jumpKeys: string[] = []) {
  return [key, ...searchStrings, ...jumpKeys].join('');
}

suite('leap plugin', () => {
  suite('normal mode', () => {
    setup(async () => {
      const configuration = new Configuration();
      configuration.leap.enable = true;

      await setupWorkspace(configuration);
    });

    teardown(cleanUpWorkspace);

    suite('to backward', async () => {
      newTest({
        title: 'move first marker position',
        start: ['|cccabcabfg'],
        keysPressed: leapCommand('s', ['a', 'b'], ['s']),
        end: ['ccc|abcabfg'],
      });

      newTest({
        title: 'move first marker position and across lines',
        start: ['|cccabcabfg', 'hei'],
        keysPressed: leapCommand('s', ['e', 'i'], ['s']),
        end: ['cccabcabfg', 'h|ei'],
      });

      newTest({
        title: 'move second marker position',
        start: ['|cccabcabfg'],
        keysPressed: leapCommand('s', ['a', 'b'], ['k']),
        end: ['cccabc|abfg'],
      });

      newTest({
        title: 'marker name is not exist',
        start: ['|cccabcabfg'],
        keysPressed: leapCommand('s', ['a', 'b'], ['l']),
        end: ['|cccabcabfg'],
      });

      newTest({
        title: 'directly jump target position when only have one marker',
        start: ['|cccabcabfg'],
        keysPressed: leapCommand('s', ['f', 'g']),
        end: ['cccabcab|fg'],
      });

      newTest({
        title: 'cursor should not change when no marker',
        start: ['|cccabcabfg'],
        keysPressed: leapCommand('s', ['z', 'z']),
        end: ['|cccabcabfg'],
      });
    });

    suite('to forward', async () => {
      newTest({
        title: 'move first marker position',
        start: ['cccabcabf|g'],
        keysPressed: leapCommand('S', ['a', 'b'], ['s']),
        end: ['cccabc|abfg'],
      });

      newTest({
        title: 'move first marker position and across lines',
        start: ['cccabcabfg', 'h|ei'],
        keysPressed: leapCommand('S', ['a', 'b'], ['s']),
        end: ['cccabc|abfg', 'hei'],
      });

      newTest({
        title: 'move second marker position',
        start: ['cccabcabf|g'],
        keysPressed: leapCommand('S', ['a', 'b'], ['k']),
        end: ['ccc|abcabfg'],
      });

      newTest({
        title: 'marker name is not exist',
        start: ['cccabcabf|g'],
        keysPressed: leapCommand('S', ['a', 'b'], ['z']),
        end: ['cccabcabf|g'],
      });

      newTest({
        title: 'directly jump target position when only have one marker',
        start: ['fgcccabca|b'],
        keysPressed: leapCommand('S', ['f', 'g']),
        end: ['|fgcccabcab'],
      });

      newTest({
        title: 'cursor should not change when no marker',
        start: ['cccabcabf|g'],
        keysPressed: leapCommand('S', ['z', 'z']),
        end: ['cccabcabf|g'],
      });

      newTest({
        title: 'should not match when cursor position is search string',
        start: ['lsdjaflonkdjfjo|n'],
        keysPressed: leapCommand('S', ['o', 'n'], ['s']),
        end: ['lsdjafl|onkdjfjon'],
      });
    });

    suite('last repeat search', async () => {
      newTest({
        title: 'to forward',
        start: ['onabonabc|d'],
        keysPressed: [...leapCommand('S', ['o', 'n'], ['s']), ...leapCommand('S', ['\n'])].join(''),
        end: ['|onabonabcd'],
      });

      newTest({
        title: 'to forward and across lines',
        start: ['onabonabcd', 'he|i'],
        keysPressed: [...leapCommand('S', ['o', 'n'], ['s']), ...leapCommand('S', ['\n'])].join(''),
        end: ['|onabonabcd', 'hei'],
      });

      newTest({
        title: 'to backward',
        start: ['|abonabonabcd'],
        keysPressed: [...leapCommand('s', ['o', 'n'], ['s']), ...leapCommand('s', ['\n'])].join(''),
        end: ['abonab|onabcd'],
      });

      newTest({
        title: 'to backward and across lines',
        start: ['|abonababcd', 'heion'],
        keysPressed: [...leapCommand('s', ['o', 'n'], ['s']), ...leapCommand('s', ['\n'])].join(''),
        end: ['abonababcd', 'hei|on'],
      });

      newTest({
        title: 'different direction',
        start: ['|abonabonab'],
        keysPressed: [...leapCommand('s', ['o', 'n'], ['k']), ...leapCommand('S', ['\n'])].join(''),
        end: ['ab|onabonab'],
      });

      newTest({
        title: 'different direction and across lines',
        start: ['|abonabab', 'heion'],
        keysPressed: [...leapCommand('s', ['o', 'n'], ['k']), ...leapCommand('S', ['\n'])].join(''),
        end: ['ab|onabab', 'heion'],
      });
    });

    newTest({
      title: 'continuous two matching characters',
      start: ['|boolean'],
      keysPressed: leapCommand('s', ['o', 'l']),
      end: ['bo|olean'],
    });

    suite('A single character + whitespace characters', () => {
      newTest({
        title: 'search last character {',
        start: ['|()=>{'],
        keysPressed: 's{ ',
        end: ['()=>|{'],
      });
      newTest({
        title: 'search middle character b',
        start: ['|test case'],
        keysPressed: 'st ',
        end: ['tes|t case'],
      });
    });

    suite('visual mode', () => {
      newTest({
        title: 'backward search when press x',
        start: ['|boolean'],
        keysPressed: 'vxead',
        end: ['|ean'],
      });

      newTest({
        title: 'backward search when press x and across lines',
        start: ['|bool', 'heiean'],
        keysPressed: 'vxead',
        end: ['|ean'],
      });

      newTest({
        title: 'forward search when press X',
        start: ['boole|an'],
        keysPressed: 'vXood',
        end: ['boo|n'],
      });

      newTest({
        title: 'forward search when press X and across lines',
        start: ['boolean', 'h|ei'],
        keysPressed: 'vXood',
        end: ['boo|i'],
      });

      newTest({
        title: 'backward search when press s',
        start: ['|boolean'],
        keysPressed: 'vsead',
        end: ['|n'],
      });

      newTest({
        title: 'backward search when press s and across lines',
        start: ['|boolean', 'heih'],
        keysPressed: 'vseid',
        end: ['|h'],
      });
    });
  });

  suite('bidirectional search mode', () => {
    setup(async () => {
      const configuration = new Configuration();
      configuration.leap.enable = true;
      configuration.leap.bidirectionalSearch = true;

      await setupWorkspace(configuration);
    });

    teardown(cleanUpWorkspace);

    suite('backward', () => {
      newTest({
        title: 'a simple line',
        start: ['|cccabcabfg'],
        keysPressed: leapCommand('s', ['a', 'b'], ['s']),
        end: ['ccc|abcabfg'],
      });

      newTest({
        title: 'across lines',
        start: ['|cccabcabfg', 'abd'],
        keysPressed: leapCommand('s', ['a', 'b'], ['l']),
        end: ['cccabcabfg', '|abd'],
      });
    });

    suite('forward', () => {
      newTest({
        title: 'a simple line',
        start: ['cccabcabf|g'],
        keysPressed: leapCommand('s', ['a', 'b'], ['s']),
        end: ['cccabc|abfg'],
      });

      newTest({
        title: 'across lines',
        start: ['cccabcabfg', 'ab|d'],
        keysPressed: leapCommand('s', ['a', 'b'], ['k']),
        end: ['cccabc|abfg', 'abd'],
      });
    });

    suite('visual mode', () => {
      suite('press s', () => {
        newTest({
          title: 'forward',
          start: ['cccabcabf|g'],
          keysPressed: 'vscasd',
          end: ['ccca|b'],
        });
        newTest({
          title: 'backward',
          start: ['|cccabcabfg'],
          keysPressed: 'vscasd',
          end: ['|bcabfg'],
        });
      });

      suite('press x', () => {
        newTest({
          title: 'forward',
          start: ['cccabcabf|g'],
          keysPressed: 'vxcasd',
          end: ['cccabc|a'],
        });
        newTest({
          title: 'backward',
          start: ['|cccabcabfg'],
          keysPressed: 'vxcasd',
          end: ['|cabcabfg'],
        });
      });
    });
  });

  suite('caseSensitive', () => {
    setup(async () => {
      const configuration = new Configuration();
      configuration.leap.enable = true;
      configuration.leap.caseSensitive = true;

      await setupWorkspace(configuration);
    });

    teardown(cleanUpWorkspace);

    newTest({
      title: 'match',
      start: ['|booLean'],
      keysPressed: leapCommand('s', ['o', 'L']),
      end: ['bo|oLean'],
    });

    newTest({
      title: 'not match',
      start: ['|booLean'],
      keysPressed: leapCommand('s', ['o', 'l']),
      end: ['|booLean'],
    });
  });
});
