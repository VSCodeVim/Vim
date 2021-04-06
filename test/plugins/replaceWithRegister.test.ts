import { Globals } from '../../src/globals';
import { newTest } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace, reloadConfiguration } from '../testUtils';

suite('replaceWithRegister plugin', () => {
  const YankInnerWord = 'yiw';
  const ReplaceOperator = 'gr';

  setup(async () => {
    await setupWorkspace();
    Globals.mockConfiguration.replaceWithRegister = true;
    await reloadConfiguration();
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: 'Replaces within inner word',
    start: ['|first second'],
    keysPressed: `${YankInnerWord}w${ReplaceOperator}iw`,
    end: ['first |first'],
  });

  newTest({
    title: 'Replaces within inner Word',
    start: ['|first sec-ond'],
    keysPressed: `${YankInnerWord}w${ReplaceOperator}iW`,
    end: ['first |first'],
  });

  newTest({
    title: "Replaces within ''",
    start: ["|first 'second'"],
    keysPressed: `${YankInnerWord}ww${ReplaceOperator}i'`,
    end: ["first '|first'"],
  });

  newTest({
    title: "Replaces within '' including spaces",
    start: ["|first ' second '"],
    keysPressed: `${YankInnerWord}ww${ReplaceOperator}i'`,
    end: ["first 'f|irst'"],
  });

  newTest({
    title: 'Replaces within ()',
    start: ['|first (second)'],
    keysPressed: `${YankInnerWord}ww${ReplaceOperator}i)`,
    end: ['first (|first)'],
  });

  newTest({
    title: 'Replaces within () including spaces',
    start: ['|first ( second )'],
    keysPressed: `${YankInnerWord}ww${ReplaceOperator}i)`,
    end: ['first (f|irst)'],
  });

  newTest({
    title: 'Replaces within a paragraph',
    start: ['  |first', '  second'],
    keysPressed: `${YankInnerWord}${ReplaceOperator}ap`,
    end: ['fi|rst'],
  });

  newTest({
    title: 'Replaces using a specified register',
    start: ['|first second'],
    keysPressed: `"a${YankInnerWord}w"a${ReplaceOperator}iw`,
    end: ['first |first'],
  });

  newTest({
    title: 'Replaces within {} over multiple lines',
    start: ['{', '  first', '  s|econd', '  third', '}'],
    keysPressed: `${YankInnerWord}${ReplaceOperator}i}`,
    end: ['{', 'secon|d', '}'],
  });

  newTest({
    title: 'Replaces a multiline register within {} over multiple lines',
    start: ['{', '  first', '  s|econd', '  third', '}'],
    keysPressed: `yj${ReplaceOperator}i}`,
    end: ['{', '  second', '  |third', '}'],
  });

  newTest({
    title: 'Yanking inside {} then replacing inside {} in a noop, besides the cursor movement',
    start: ['{', '  first', '  |second', '  third', '}'],
    keysPressed: `yi}${ReplaceOperator}i}`,
    end: ['{', '  first', '  |second', '  third', '}'],
  });

  newTest({
    title: 'grr replaces the entire line with the register',
    start: ['first sec|ond third'],
    keysPressed: `${YankInnerWord}grr`,
    end: ['secon|d'],
  });

  newTest({
    title: 'grr can replace multiple lines',
    start: ['|first', 'second', 'third'],
    keysPressed: `${YankInnerWord}2grr`,
    end: ['|first', 'third'],
  });

  newTest({
    title: 'Replaces in visual mode',
    start: ['|first second'],
    keysPressed: `${YankInnerWord}wviw${ReplaceOperator}`,
    end: ['first firs|t'],
  });

  newTest({
    title: 'Replaces in visual mode using a specified register',
    start: ['|first second'],
    keysPressed: `"a${YankInnerWord}wviw"a${ReplaceOperator}`,
    end: ['first firs|t'],
  });

  newTest({
    title: 'Replaces in visual line mode',
    start: ['|first second'],
    keysPressed: `${YankInnerWord}wV${ReplaceOperator}`,
    end: ['firs|t'],
  });

  newTest({
    title: 'grj is linewise',
    start: ['|first second', 'third fourth', 'fifth sixth'],
    keysPressed: `${YankInnerWord}w${ReplaceOperator}j`,
    end: ['firs|t', 'fifth sixth'],
  });
});
