import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../../src/mode/modeHandler';
import { VimState } from '../../src/state/vimState';
import { newTest } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './../testUtils';

suite(':sort', () => {
  let modeHandler: ModeHandler;
  let vimState: VimState;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
    vimState = modeHandler.vimState;
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: 'Sort whole file, ascending',
    start: ['Eggplant', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage'],
    keysPressed: ':sort\n',
    end: ['|Banana', 'Eggplant', 'apple', 'cabbage', 'dragonfruit'],
  });

  newTest({
    title: 'Sort whole file, ascending, ignore case',
    start: ['Eggplant', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage'],
    keysPressed: ':sort i\n',
    end: ['|apple', 'Banana', 'cabbage', 'dragonfruit', 'Eggplant'],
  });

  newTest({
    title: 'Sort whole file, descending',
    start: ['Eggplant', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage'],
    keysPressed: ':sort!\n',
    end: ['|dragonfruit', 'cabbage', 'apple', 'Eggplant', 'Banana'],
  });

  newTest({
    title: 'Sort whole file, descending, ignore case',
    start: ['Eggplant', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage'],
    keysPressed: ':sort! i\n',
    end: ['|Eggplant', 'dragonfruit', 'cabbage', 'Banana', 'apple'],
  });

  newTest({
    title: 'Sort range, ascending',
    start: ['Eggplant', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage'],
    keysPressed: ':2,4sort\n',
    end: ['Eggplant', '|Banana', 'apple', 'dragonfruit', 'cabbage'],
  });

  newTest({
    title: 'Sort range, ascending, ignore case',
    start: ['Eggplant', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage'],
    keysPressed: ':2,4sort i\n',
    end: ['Eggplant', '|apple', 'Banana', 'dragonfruit', 'cabbage'],
  });

  newTest({
    title: 'Sort range, descending',
    start: ['Eggplant', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage'],
    keysPressed: ':2,4sort!\n',
    end: ['Eggplant', '|dragonfruit', 'apple', 'Banana', 'cabbage'],
  });

  newTest({
    title: 'Sort range, descending, ignore case',
    start: ['Eggplant', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage'],
    keysPressed: ':2,4sort! i\n',
    end: ['Eggplant', '|dragonfruit', 'Banana', 'apple', 'cabbage'],
  });

  newTest({
    title: 'Sort whole file, ascending, unique',
    start: ['Eggplant', 'apple', 'Banana', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage', 'apple'],
    keysPressed: ':sort u\n',
    end: ['|Banana', 'Eggplant', 'apple', 'cabbage', 'dragonfruit'],
  });

  newTest({
    title: 'Sort whole file, ascending, ignore case, unique',
    start: ['Eggplant', 'Apple', 'banana', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage', 'apple'],
    keysPressed: ':sort iu\n',
    end: ['|Apple', 'banana', 'cabbage', 'dragonfruit', 'Eggplant'],
  });
});
