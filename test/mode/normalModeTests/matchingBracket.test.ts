import { newTest } from '../../testSimplifier';
import { setupWorkspace } from './../../testUtils';

suite('Matching Bracket (%)', () => {
  suiteSetup(setupWorkspace);

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

  newTest({
    title: 'parentheses after >',
    start: ['|foo->bar(baz);'],
    keysPressed: '%',
    end: ['foo->bar(baz|);'],
  });

  newTest({
    title: 'parentheses after "',
    start: ['|test "in quotes" [(in brackets)]'],
    keysPressed: '%',
    end: ['test "in quotes" [(in brackets)|]'],
  });
});
