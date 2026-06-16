import { newTest } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

suite('tildeop plugin', () => {
  suiteSetup(async () => {
    await setupWorkspace({
      config: {
        tildeop: true,
      },
      fileExtension: '.js',
    });
  });

  newTest({
    title: '~ acts as operator on tildeop = true',
    start: ['first |line test'],
    keysPressed: '~w',
    end: ['first |LINE test'],
  });

  newTest({
    title: 'g~ still works with tildeop = true',
    start: ['Im |Pickle Rick'],
    keysPressed: 'g~2w',
    end: ['Im |pICKLE rICK'],
  });

  newTest({
    title: '~ waits for motion when tildeop = true',
    start: ['Nothing is gonna h|appen'],
    keysPressed: '~',
    end: ['Nothing is gonna h|appen'],
  });

  newTest({
    title: 'g~~ toggles whole line',
    start: ['argentina ro|cks!'],
    keysPressed: 'g~~',
    end: ['|ARGENTINA ROCKS!'],
  });

  newTest({
    title: '~ works in visual mode with tildeop',
    start: ['arch lin|ux'],
    keysPressed: 've~',
    end: ['arch lin|UX'],
  });

  newTest({
    title: '~ works in visual line mode with tildeop',
    start: ['ar|ch linux'],
    keysPressed: 'V~',
    end: ['|ARCH LINUX'],
  });

  newTest({
    title: 'tildeop can be toggled dynamically',
    start: ['|one two three'],
    keysPressed: '~wwl:set notildeop\n~w:set tildeop\n~w',
    end: ['ONE tWo |THREE'],
  });

  newTest({
    title: 'count works with ~ operator',
    start: ['one t|wo three four'],
    keysPressed: '2~w',
    end: ['one t|WO THREE four'],
  });

  newTest({
    title: '~ works with $ motion',
    start: ['hello |world test'],
    keysPressed: '~$',
    end: ['hello |WORLD TEST'],
  });

  newTest({
    title: '~~ toggles whole line with tildeop',
    start: ['hello wor|ld'],
    keysPressed: '~~',
    end: ['|HELLO WORLD'],
  });

  newTest({
    title: 'top and notop aliases work as expected',
    start: ['|one two three'],
    keysPressed: '~wwl:set notop\n~w:set top\n~w',
    end: ['ONE tWo |THREE'],
  });
});
