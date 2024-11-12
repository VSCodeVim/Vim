import { newTest } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

suite('format operator', () => {
  suiteSetup(async () => {
    await setupWorkspace({ fileExtension: '.ts' });
  });

  newTest({
    title: '== formats current line',
    start: [' |let a;', '  let b;'],
    keysPressed: '==',
    end: ['|let a;', '  let b;'],
  });

  newTest({
    title: '=$ formats entire line',
    start: [' function f() {|let a;', 'let b;', '}'],
    keysPressed: '=$',
    end: ['|function f() {', '  let a;', 'let b;', '}'],
  });

  newTest({
    title: '=j formats two lines',
    start: [' |let a;', '  let b;', '  let c;'],
    keysPressed: '=j',
    end: ['|let a;', 'let b;', '  let c;'],
  });

  newTest({
    title: '3=k formats three lines',
    start: [' let a;', '  let b;', '|  let c;'],
    keysPressed: '3=k',
    end: ['|let a;', 'let b;', 'let c;'],
  });

  newTest({
    title: '=gg formats to top of file',
    start: [' let a;', '  let b;', '|  let c;'],
    keysPressed: '=gg',
    end: ['|let a;', 'let b;', 'let c;'],
  });

  newTest({
    title: '=G formats to bottom of file',
    start: ['|  let a;', '  let b;', '  let c;'],
    keysPressed: '=G',
    end: ['|let a;', 'let b;', 'let c;'],
  });

  newTest({
    title: '=ip formats paragraph',
    start: ['  function f() {', '|let a;', '  }', '', '  let b;'],
    keysPressed: '=ip',
    end: ['|function f() {', '  let a;', '}', '', '  let b;'],
  });

  newTest({
    title: 'format in visual mode',
    start: ['  function f() {', 'let a;', '|  }', '', '  let b;'],
    keysPressed: 'vkk=',
    end: ['|function f() {', '  let a;', '}', '', '  let b;'],
  });
});
