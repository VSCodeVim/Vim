import { getTestingFunctions } from '../../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './../../testUtils';

suite('Matching Bracket (%)', () => {
  let { newTest, newTestOnly } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: 'before opening parenthesis',
    start: ['|one (two)'],
    keysPressed: '%',
    end: ['one (two|)'],
  });

  newTest({
    title: 'inside parenthesis',
    start: ['(|one { two })'],
    keysPressed: '%',
    end: ['(one { two |})'],
  });

  newTest({
    title: 'nested parenthesis beginning',
    start: ['|((( )))'],
    keysPressed: '%',
    end: ['((( ))|)'],
  });

  newTest({
    title: 'nested parenthesis end',
    start: ['((( ))|)'],
    keysPressed: '%',
    end: ['|((( )))'],
  });

  newTest({
    title: 'nested bracket and parenthesis beginning',
    start: ['|[(( ))]'],
    keysPressed: '%',
    end: ['[(( ))|]'],
  });

  newTest({
    title: 'nested bracket, parenthesis, braces beginning',
    start: ['|[(( }}} ))]'],
    keysPressed: '%',
    end: ['[(( }}} ))|]'],
  });

  newTest({
    title: 'nested bracket, parenthesis, braces end',
    start: ['[(( }}} ))|]'],
    keysPressed: '%',
    end: ['|[(( }}} ))]'],
  });
});
