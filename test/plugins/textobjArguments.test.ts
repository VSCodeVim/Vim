import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

suite('textobj-arguments plugin', () => {
  suiteSetup(async () => {
    await setupWorkspace({
      config: {
        tabstop: 4,
        expandtab: false,
      },
    });
  });

  newTest({
    title: "Will fail 'cia' with no delimiters",
    start: ['f|oo'],
    keysPressed: 'cia',
    end: ['f|oo'],
  });

  newTest({
    title: "Will fail 'cia' with flipped delimiters",
    start: [')f|oo('],
    keysPressed: 'cia',
    end: [')f|oo('],
  });

  newTest({
    title: "Will fail 'cia' with separators but no delimiters",
    start: ['alpha,', 'b|eta,', 'gamma'],
    keysPressed: 'cia',
    end: ['alpha,', 'b|eta,', 'gamma'],
  });

  newTest({
    title: "Can do 'cia' in a single argument",
    start: ['(f|oo)'],
    keysPressed: 'cia',
    end: ['(|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in () with cursor at opening delimiter",
    start: ['|()'],
    keysPressed: 'cia',
    end: ['(|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in () with cursor at closing delimiter",
    start: ['(|)'],
    keysPressed: 'cia',
    end: ['(|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in (,) with cursor at opening delimiter",
    start: ['|(,)'],
    keysPressed: 'cia',
    end: ['(|,)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in (,) with cursor at regular delimiter",
    start: ['(|,)'],
    keysPressed: 'cia',
    end: ['(,|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in (,) with cursor at closing delimiter",
    start: ['(,|)'],
    keysPressed: 'cia',
    end: ['(,|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in (,,,) with cursor at regular delimiter",
    start: ['(|,,,)'],
    keysPressed: 'cia',
    end: ['(,|,,)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in (,,,) with cursor at second-to-last delimiter",
    start: ['(,,|,)'],
    keysPressed: 'cia',
    end: ['(,,,|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in (,,,) with cursor at closing delimiter",
    start: ['(,,,|)'],
    keysPressed: 'cia',
    end: ['(,,,|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' with nested parentheses in argument",
    start: ['(foo, (void*) ba|r(Foo<T>), baz)'],
    keysPressed: 'cia',
    end: ['(foo, |, baz)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a single-line comma seperated list with cursor in first argument",
    start: ['(f|oo, bar, baz)'],
    keysPressed: 'cia',
    end: ['(|, bar, baz)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a single-line comma seperated list with cursor on opening delimiter",
    start: ['|(foo, bar, baz)'],
    keysPressed: 'cia',
    end: ['(|, bar, baz)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a single-line comma seperated list with cursor in middle argument",
    start: ['(foo, ba|r, baz)'],
    keysPressed: 'cia',
    end: ['(foo, |, baz)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a single-line comma seperated list with cursor on regular delimiter",
    start: ['(foo|, bar, baz)'],
    keysPressed: 'cia',
    end: ['(foo, |, baz)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a single-line comma seperated list with cursor in last argument",
    start: ['(foo, bar, b|az)'],
    keysPressed: 'cia',
    end: ['(foo, bar, |)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a single-line comma seperated list with cursor on closing delimiter",
    start: ['(foo, bar, baz|)'],
    keysPressed: 'cia',
    end: ['(foo, bar, |)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a whitespace-only argument",
    start: ['(foo, | , baz)'],
    keysPressed: 'cia',
    end: ['(foo,|, baz)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a whitespace-only argument across multiple lines",
    start: ['(foo,', '  ', ' | ', '  ', ' , baz)'],
    keysPressed: 'cia',
    end: ['(foo,|, baz)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' with trailing whitespace after separator",
    start: ['(', '   foo, ', '   b|ar,', '   baz', ')'],
    keysPressed: 'cia',
    end: ['(', '   foo, ', '   |,', '   baz', ')'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' with trailing whitespace after separator and empty line",
    start: ['(', '   foo, ', '    ', '   b|ar,', '   baz', ')'],
    keysPressed: 'cia',
    end: ['(', '   foo, ', '    ', '   |,', '   baz', ')'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a multiline-line comma seperated list with cursor in first argument",
    start: ['(', '   f|oo,', '   bar,', '   baz', ')'],
    keysPressed: 'cia',
    end: ['(', '   |,', '   bar,', '   baz', ')'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a multiline-line comma seperated list with cursor in center argument",
    start: ['(', '   foo,', '   b|ar,', '   baz', ')'],
    keysPressed: 'cia',
    end: ['(', '   foo,', '   |,', '   baz', ')'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a multiline-line comma seperated list with cursor in last argument",
    start: ['(', '   foo,', '   bar,', '   |baz', ')'],
    keysPressed: 'cia',
    end: ['(', '   foo,', '   bar,', '   |', ')'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a multi-line indented statement with one argument.",
    start: ['   functionCall(', '      fo|o', '   )'],
    keysPressed: 'cia',
    end: ['   functionCall(', '      |', '   )'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'daa' in a single argument",
    start: ['(f|oo)'],
    keysPressed: 'daa',
    end: ['(|)'],
  });

  newTest({
    title: "Will fail 'daa' in ()",
    start: ['(|)'],
    keysPressed: 'daa',
    end: ['(|)'],
  });

  newTest({
    title: "Can do 'daa' in a single-line comma seperated list with cursor in first argument",
    start: ['(f|oo, bar, baz)'],
    keysPressed: 'daa',
    end: ['(|bar, baz)'],
  });

  newTest({
    title: "Can do 'daa' in a single-line comma seperated list with cursor in middle argument",
    start: ['(foo, b|ar, baz)'],
    keysPressed: 'daa',
    end: ['(foo|, baz)'],
  });

  newTest({
    title: "Can do 'daa' in a single-line comma seperated list with cursor in last argument",
    start: ['(foo, bar, |baz)'],
    keysPressed: 'daa',
    end: ['(foo, bar|)'],
  });

  newTest({
    title: "Can do 'daa' in a multiline-line comma seperated list with cursor in first argument",
    start: ['(', '   |foo,', '   bar,', '   baz', ')'],
    keysPressed: 'daa',
    end: ['|(', '   bar,', '   baz', ')'],
  });

  newTest({
    title: "Can do 'daa' in a multiline-line comma seperated list with cursor in center argument",
    start: ['(', '   foo,', '   b|ar,', '   baz', ')'],
    keysPressed: 'daa',
    end: ['(', '   foo|,', '   baz', ')'],
  });

  newTest({
    title: "Can do 'daa' in a multiline-line comma seperated list with cursor in last argument",
    start: ['(', '   foo,', '   bar,', '   ba|z', ')'],
    keysPressed: 'daa',
    end: ['(', '   foo,', '   ba|r', ')'],
  });
});
