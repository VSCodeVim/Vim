import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

suite('indent object plugin', () => {
  suiteSetup(async () => {
    await setupWorkspace({
      config: {
        tabstop: 4,
        expandtab: false,
      },
    });
  });

  newTest({
    title: 'Can do cai',
    start: ['if foo > 3:', '    log("foo is big")|', '    foo = 3', 'do_something_else()'],
    keysPressed: 'cai',
    end: ['|', 'do_something_else()'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Can do cii',
    start: ['if foo > 3:', '\tlog("foo is big")', '\tfoo = 3', '|', 'do_something_else()'],
    keysPressed: 'cii',
    end: ['if foo > 3:', '\t|', 'do_something_else()'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Can do caI',
    start: ['if foo > 3:', '    log("foo is big")|', '    foo = 3', 'do_something_else()'],
    keysPressed: 'caI',
    end: ['|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Can do dai',
    start: ['if foo > 3:', '    log("foo is big")|', '    foo = 3', 'do_something_else()'],
    keysPressed: 'dai',
    end: ['|do_something_else()'],
  });

  newTest({
    title: 'Can do dii',
    start: ['if foo > 3:', '    log("foo is big")', '    foo = 3', '|', 'do_something_else()'],
    keysPressed: 'dii',
    end: ['if foo > 3:', '|do_something_else()'],
  });

  newTest({
    title: 'Can do daI',
    start: ['if foo > 3:', '    log("foo is big")|', '    foo = 3', 'do_something_else()'],
    keysPressed: 'daI',
    end: ['|'],
  });
});
