import { Configuration } from '../testConfiguration';
import { newTest } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

function leapCommand(key: 's' | 'S', searchStrings: string[], jumpKeys: string[] = []) {
  return [key, ...searchStrings, ...jumpKeys].join('');
}

suite('leap plugin', () => {
  setup(async () => {
    const configuration = new Configuration();
    configuration.leap = true;

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
      title: 'to backward',
      start: ['|abonabonabcd'],
      keysPressed: [...leapCommand('s', ['o', 'n'], ['s']), ...leapCommand('s', ['\n'])].join(''),
      end: ['abonab|onabcd'],
    });

    newTest({
      title: 'different direction',
      start: ['|abonabonab'],
      keysPressed: [...leapCommand('s', ['o', 'n'], ['k']), ...leapCommand('S', ['\n'])].join(''),
      end: ['ab|onabonab'],
    });
  });

  newTest({
    title: 'continuous two matching characters',
    start: ['|boolean'],
    keysPressed: leapCommand('s', ['o', 'l']),
    end: ['bo|olean'],
  });
});
