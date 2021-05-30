import { strict as assert } from 'assert';
import { Position, TextDocument } from 'vscode';
import { PythonDocument } from '../../../../src/actions/languages/python/motion';

suite('PythonDocument lines generator', () => {
  let _lines: string[];
  let doc: TextDocument;

  setup(() => {
    _lines = ['x', 'y', 'z'];

    doc = {
      lineCount: _lines.length,
      lineAt: (line: number) => {
        return { text: _lines[line] };
      },
    } as TextDocument;
  });

  test('lines() generator', () => {
    // GIVEN

    // WHEN
    const array = [...PythonDocument.lines(doc)];

    // THEN
    assert.equal(array.length, 3);
    assert.equal(array[0], 'x');
    assert.equal(array[1], 'y');
    assert.equal(array[2], 'z');
  });
});

suite('PythonDocument constructor without parsing', () => {
  test('constructor', () => {
    // GIVEN
    const doc = { lineCount: 0 } as TextDocument;

    // WHEN
    const pydoc = new PythonDocument(doc);

    // THEN: Object construction succeeds
  });
});

/*
 * Create a fake TextDocument object from a provided array of strings.
 * This has the minimal interface required by the find functionality.
 */
function fakeTextDocument(lines: string[]): TextDocument {
  return {
    lineCount: lines.length,
    lineAt: (line: number) => {
      return { text: lines[line] };
    },
  } as TextDocument;
}

suite('PythonDocument parse lines to extract structure', () => {
  let lines: string[];
  let doc: TextDocument;

  setup(() => {
    lines = [
      'def first(x, y):', // 0
      '    pass',
      '',
      'class A:',
      '',
      '    def inner(self):', // 5
      '        pass',
      '',
      'def second():',
      '    pass',
    ];

    doc = fakeTextDocument(lines);
  });

  test('parse doc to calculate indentation', () => {
    // WHEN
    const parsed = PythonDocument._parseLines(doc);
    const line1 = parsed[0];
    const line2 = parsed[1];
    const line4 = parsed[3];
    const line5 = parsed[4];

    // THEN
    assert.equal(parsed.length, 7);

    assert.equal(line1.line, 0);
    assert.equal(line1.indentation, 0);
    assert.equal(line1.text, 'def first(x, y):');

    assert.equal(line2.line, 1);
    assert.equal(line2.indentation, 4);

    assert.equal(line4.line, 5);
    assert.equal(line4.indentation, 4);

    assert.equal(line5.line, 6);
    assert.equal(line5.indentation, 8);
  });

  test('document structure extraction', () => {
    // GIVEN
    const pydoc = new PythonDocument(doc);

    // WHEN
    const structure = pydoc.structure;

    const func1 = structure[0];
    const class1 = structure[1];
    const func2 = structure[2];
    const func3 = structure[3];

    // THEN
    assert.equal(func1.type, 'function');
    assert.equal(func1.start.line, 0);
    assert.equal(func1.start.character, 0);
    assert.equal(func1.end.line, 1);
    assert.equal(func1.end.character, 7);

    assert.equal(class1.type, 'class');
    assert.equal(class1.start.line, 3);
    assert.equal(class1.start.character, 0);
    assert.equal(class1.end.line, 6);
    assert.equal(class1.end.character, 11);

    assert.equal(func2.type, 'function');
    assert.equal(func2.start.line, 5);
    assert.equal(func2.start.character, 4);
    assert.equal(func2.end.line, 6);
    assert.equal(func2.end.character, 11);

    assert.equal(func3.type, 'function');
    assert.equal(func3.start.line, 8);
    assert.equal(func3.start.character, 0);
    assert.equal(func3.end.line, 9);
    assert.equal(func3.end.character, 7);
  });
});

suite('PythonDocument.isAhead and isBehind', () => {
  test('element is ahead of position', () => {
    // GIVEN
    const position = { line: 3, character: 7 } as Position;
    const elementPosition = { line: 4, character: 0 } as Position;

    // WHEN
    const ahead = PythonDocument.isAhead(position, elementPosition);
    const behind = PythonDocument.isBehind(position, elementPosition);

    // THEN
    assert.equal(ahead, true);
    assert.equal(behind, false);
  });

  test('element is not ahead of position', () => {
    // GIVEN
    const position = { line: 4, character: 0 } as Position;
    const elementPosition = { line: 3, character: 7 } as Position;

    // WHEN
    const ahead = PythonDocument.isAhead(position, elementPosition);
    const behind = PythonDocument.isBehind(position, elementPosition);

    // THEN
    assert.equal(ahead, false);
    assert.equal(behind, true);
  });

  test('element and position are co-located so element is not ahead of position', () => {
    // GIVEN
    const position = { line: 3, character: 7 } as Position;
    const elementPosition = position;

    // WHEN
    const ahead = PythonDocument.isAhead(position, elementPosition);
    const behind = PythonDocument.isBehind(position, elementPosition);

    // THEN
    assert.equal(ahead, false);
    assert.equal(behind, false);
  });
});

suite('PythonDocument._textIndentation and PythonDocument._parseLine', () => {
  test('indentation of line with none', () => {
    // GIVEN
    const line = 'x = 42';

    // WHEN
    const indent = PythonDocument._indentation(line);
    const info = PythonDocument._parseLine(42, line);

    // THEN
    assert.equal(indent, 0);

    assert.notEqual(info, null);
    assert(info !== null);
    assert.equal(info.line, 42);
    assert.equal(info.indentation, 0);
    assert.equal(info.text, line);
  });

  test('indentation of line with 4 spaces', () => {
    // GIVEN
    const line = '    x = 42';

    // WHEN
    const indent = PythonDocument._indentation(line);
    const info = PythonDocument._parseLine(42, line);

    // THEN
    assert.equal(indent, 4);

    assert.notEqual(info, null);
    assert(info !== null);
    assert.equal(info.line, 42);
    assert.equal(info.indentation, 4);
    assert.equal(info.text, line);
  });

  test('indentation of line starting with a comment', () => {
    // GIVEN
    const line = '    # x = 42';

    // WHEN
    const indent = PythonDocument._indentation(line);
    const info = PythonDocument._parseLine(42, line);

    // THEN
    assert.equal(indent, null);
    assert.equal(info, null);
  });

  test('indentation of line containing only whitespace', () => {
    // GIVEN
    const line = '    ';

    // WHEN
    const indent = PythonDocument._indentation(line);
    const info = PythonDocument._parseLine(42, line);

    // THEN
    assert.equal(indent, null);
    assert.equal(info, null);
  });

  test('indentation of empty line', () => {
    // GIVEN
    const line = '';

    // WHEN
    const indent = PythonDocument._indentation(line);
    const info = PythonDocument._parseLine(42, line);

    // THEN
    assert.equal(indent, null);
    assert.equal(info, null);
  });
});

// Type of the find function after all but the last arg have been binded
type Find = (position: Position) => Position | null;

/*
 * Use fakeDocument to create a fake PythonDocument based on the passed in
 * array of strings.
 */
function fakePythonDocument(lines: string[]): PythonDocument {
  const doc = fakeTextDocument(lines);
  return new PythonDocument(doc);
}

suite('PythonDocument find function functionality', () => {
  let findNextFunctionStart: Find;
  let findPrevFunctionStart: Find;
  let findNextFunctionEnd: Find;
  let findPrevFunctionEnd: Find;

  setup(() => {
    const lines = [
      "'''Module docstring.'''", // 0
      '',
      'def first(x, y):',
      '# a mis-placed comment',
      '    pass',
      '', // 5
      'p = 42',
      '',
      'def second(a, b):',
      '',
      '    def inner():', // 10
      '        pass',
      '',
      'x = 139',
      'greeting = "Hello"',
    ];

    const pydoc = fakePythonDocument(lines);

    findNextFunctionStart = pydoc.find.bind(pydoc, 'function', 'next', 'start');
    findPrevFunctionStart = pydoc.find.bind(pydoc, 'function', 'prev', 'start');
    findNextFunctionEnd = pydoc.find.bind(pydoc, 'function', 'next', 'end');
    findPrevFunctionEnd = pydoc.find.bind(pydoc, 'function', 'prev', 'end');
  });

  test('valid findNextFunctionStart, start of file', () => {
    // GIVEN
    const position = { line: 0, character: 0 } as Position;

    // WHEN
    const newPosition = findNextFunctionStart(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 2);
    assert.equal(newPosition.character, 0);
  });

  test('valid findNextFunctionStart, past outer function', () => {
    // GIVEN
    const position = { line: 8, character: 2 } as Position;

    // WHEN
    const newPosition = findNextFunctionStart(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 10);
    assert.equal(newPosition.character, 4);
  });

  test('Invalid findNextFunctionStart, past last function', () => {
    // GIVEN
    const position = { line: 10, character: 6 } as Position;

    // WHEN
    const newPosition = findNextFunctionStart(position);

    // THEN
    assert.equal(newPosition, null);
  });

  test('valid findPrevFunctionStart, middle of function', () => {
    // GIVEN
    const position = { line: 3, character: 8 } as Position;

    // WHEN
    const newPosition = findPrevFunctionStart(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 2);
    assert.equal(newPosition.character, 0);
  });

  test('valid findPrevFunctionStart, start of inner function', () => {
    // GIVEN
    const position = { line: 10, character: 4 } as Position;

    // WHEN
    const newPosition = findPrevFunctionStart(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 8);
    assert.equal(newPosition.character, 0);
  });

  test('valid findPrevFunctionStart, start of second function', () => {
    // GIVEN
    const position = { line: 8, character: 0 } as Position;

    // WHEN
    const newPosition = findPrevFunctionStart(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 2);
    assert.equal(newPosition.character, 0);
  });

  test('invalid findPrevFunctionStart, above first function', () => {
    // GIVEN
    const position = { line: 0, character: 7 } as Position;

    // WHEN
    const newPosition = findPrevFunctionStart(position);

    // THEN
    assert.equal(newPosition, null);
  });

  test('Invalid findNextFunctionEnd, past last indented block', () => {
    // GIVEN
    const position = { line: 13, character: 2 } as Position;

    // WHEN
    const newPosition = findNextFunctionEnd(position);

    // THEN
    assert.equal(newPosition, null);
  });

  test('valid findNextFuntionEnd, inside inner function', () => {
    // GIVEN
    const position = { line: 10, character: 10 } as Position;

    // WHEN
    const newPosition = findNextFunctionEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 11);
    assert.equal(newPosition.character, 11);
  });

  test('valid findNextFuntionEnd, from inside outer function', () => {
    // GIVEN
    const position = { line: 9, character: 0 } as Position;

    // WHEN
    const newPosition = findNextFunctionEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 11);
    assert.equal(newPosition.character, 11);
  });

  test('valid findNextFunctionEnd, from start of function', () => {
    // GIVEN
    const position = { line: 2, character: 0 } as Position;

    // WHEN
    const newPosition = findNextFunctionEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 4);
    assert.equal(newPosition.character, 7);
  });

  test('valid findNextFunctionEnd, in middle from outside any function', () => {
    // GIVEN
    const position = { line: 6, character: 2 } as Position;

    // WHEN
    const newPosition = findNextFunctionEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 11);
    assert.equal(newPosition.character, 11);
  });

  test('valid findNextFunctionEnd, at exact end of first function', () => {
    // GIVEN
    const position = { line: 4, character: 7 } as Position;

    // WHEN
    const newPosition = findNextFunctionEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 11);
    assert.equal(newPosition.character, 11);
  });

  test('valid findPrevFunctionEnd, after first function, outside any function', () => {
    // GIVEN
    const position = { line: 6, character: 2 } as Position;

    // WHEN
    const newPosition = findPrevFunctionEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 4);
    assert.equal(newPosition.character, 7);
  });

  test('valid findPrevFunctionEnd, inside second function', () => {
    // GIVEN
    const position = { line: 9, character: 0 } as Position;

    // WHEN
    const newPosition = findPrevFunctionEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 4);
    assert.equal(newPosition.character, 7);
  });

  test('valid findPrevFunctionEnd, inside second function-s inner function', () => {
    // GIVEN
    const position = { line: 10, character: 7 } as Position;

    // WHEN
    const newPosition = findPrevFunctionEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 4);
    assert.equal(newPosition.character, 7);
  });

  test('valid findPrevFunctionEnd, after last function', () => {
    // GIVEN
    const position = { line: 13, character: 4 } as Position;

    // WHEN
    const newPosition = findPrevFunctionEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 11);
    assert.equal(newPosition.character, 11);
  });

  test('invalid findPrevFunctionEnd, before first function', () => {
    // GIVEN
    const position = { line: 1, character: 0 } as Position;

    // WHEN
    const newPosition = findPrevFunctionEnd(position);

    // THEN
    assert.equal(newPosition, null);
  });
});

suite('PythonDocument find function functionality in doc containing class', () => {
  let findNextFunctionEnd: Find;

  setup(() => {
    const lines = [
      'def first(x, y):', // 0
      '    pass',
      '',
      'class A:',
      '',
      '    def inner(self):', // 5
      '        pass',
      '',
      'def second():',
      '    pass',
    ];

    const pydoc = fakePythonDocument(lines);

    findNextFunctionEnd = pydoc.find.bind(pydoc, 'function', 'next', 'end');
  });

  test('valid findNextFunctionEnd, from within a class that follows a function', () => {
    // GIVEN
    const position = { line: 4, character: 0 } as Position;

    // WHEN
    const newPosition = findNextFunctionEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 6);
    assert.equal(newPosition.character, 11);
  });

  test('valid findNextFunctionEnd, from inside last function at end of file', () => {
    // GIVEN
    const position = { line: 8, character: 6 } as Position;

    // WHEN
    const newPosition = findNextFunctionEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 9);
    assert.equal(newPosition.character, 7);
  });
});

suite('PythonDocument find function functionality near end of file', () => {
  let findNextFunctionEnd: Find;

  setup(() => {
    const lines = [
      'def first(x, y):', // 0
      '    pass',
      '',
    ];

    const pydoc = fakePythonDocument(lines);
    findNextFunctionEnd = pydoc.find.bind(pydoc, 'function', 'next', 'end');
  });

  test('valid findNextFunctionEnd, function ends with single empty line after it before file ends', () => {
    // GIVEN
    const position = { line: 0, character: 6 } as Position;

    // WHEN
    const newPosition = findNextFunctionEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 1);
    assert.equal(newPosition.character, 7);
  });
});

suite('findPrevFunctionEnd with nested functions', () => {
  let findPrevFunctionEnd: Find;

  setup(() => {
    const lines = [
      'def outer(a, b):', // 0
      '',
      '    def inner():',
      '        pass',
      '',
      '    return inner', // 5
      '',
      'x = 139',
    ];

    const pydoc = fakePythonDocument(lines);

    findPrevFunctionEnd = pydoc.find.bind(pydoc, 'function', 'prev', 'end');
  });

  test('findPrevFunctoinEnd from after nested function should find outer function-s end', () => {
    // GIVEN
    const position = { line: 7, character: 4 } as Position;

    // WHEN
    const newPosition = findPrevFunctionEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 5);
    assert.equal(newPosition.character, 15);
  });
});

suite('PythonDocument find class functionality', () => {
  let findNextClassStart: Find;
  let findPrevClassStart: Find;
  let findNextClassEnd: Find;
  let findPrevClassEnd: Find;

  setup(() => {
    const lines = [
      "'''Module docstring.'''", // 0
      '',
      'class First:',
      '# a mis-placed comment',
      '    def __init__(self):',
      '        pass', // 5
      '',
      'p = 42',
      '',
      'class Second:',
      '', // 10
      '    def __init__(self):',
      '        pass',
      '',
      '    class Inner:',
      '        def __init__(self):', // 15
      '            pass',
      '',
      'x = 139',
    ];

    const pydoc = fakePythonDocument(lines);
    findNextClassStart = pydoc.find.bind(pydoc, 'class', 'next', 'start');
    findPrevClassStart = pydoc.find.bind(pydoc, 'class', 'prev', 'start');
    findNextClassEnd = pydoc.find.bind(pydoc, 'class', 'next', 'end');
    findPrevClassEnd = pydoc.find.bind(pydoc, 'class', 'prev', 'end');
  });

  test('valid findNextClassStart, start of file', () => {
    // GIVEN
    const position = { line: 0, character: 0 } as Position;

    // WHEN
    const newPosition = findNextClassStart(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 2);
    assert.equal(newPosition.character, 0);
  });

  test('valid findNextClassStart, past first class', () => {
    // GIVEN
    const position = { line: 8, character: 2 } as Position;

    // WHEN
    const newPosition = findNextClassStart(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 9);
    assert.equal(newPosition.character, 0);
  });

  test('valid findNextClassStart, past second outer class', () => {
    // GIVEN
    const position = { line: 9, character: 3 } as Position;

    // WHEN
    const newPosition = findNextClassStart(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 14);
    assert.equal(newPosition.character, 4);
  });

  test('Invalid findNextClassStart, past last class', () => {
    // GIVEN
    const position = { line: 14, character: 6 } as Position;

    // WHEN
    const newPosition = findNextClassStart(position);

    // THEN
    assert.equal(newPosition, null);
  });

  test('valid findPrevClassStart, end of file', () => {
    // GIVEN
    const position = { line: 18, character: 0 } as Position;

    // WHEN
    const newPosition = findPrevClassStart(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 14);
    assert.equal(newPosition.character, 4);
  });

  test('valid findPrevClassStart, past first class', () => {
    // GIVEN
    const position = { line: 7, character: 2 } as Position;

    // WHEN
    const newPosition = findPrevClassStart(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 2);
    assert.equal(newPosition.character, 0);
  });

  test('valid findPrevClassStart, past second outer class, before inner class', () => {
    // GIVEN
    const position = { line: 11, character: 8 } as Position;

    // WHEN
    const newPosition = findPrevClassStart(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 9);
    assert.equal(newPosition.character, 0);
  });

  test('Invalid findPrevClassStart, before first class', () => {
    // GIVEN
    const position = { line: 0, character: 6 } as Position;

    // WHEN
    const newPosition = findPrevClassStart(position);

    // THEN
    assert.equal(newPosition, null);
  });

  test('valid findNextClassEnd, start of file', () => {
    // GIVEN
    const position = { line: 0, character: 0 } as Position;

    // WHEN
    const newPosition = findNextClassEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 5);
    assert.equal(newPosition.character, 11);
  });

  test('valid findNextClassEnd, past first class', () => {
    // GIVEN
    const position = { line: 7, character: 2 } as Position;

    // WHEN
    const newPosition = findNextClassEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 16);
    assert.equal(newPosition.character, 15);
  });

  test('valid findNextClassEnd, past second outer class', () => {
    // GIVEN
    const position = { line: 9, character: 3 } as Position;

    // WHEN
    const newPosition = findNextClassEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 16);
    assert.equal(newPosition.character, 15);
  });

  test('Invalid findNextClassEnd, past last class', () => {
    // GIVEN
    const position = { line: 18, character: 3 } as Position;

    // WHEN
    const newPosition = findNextClassEnd(position);

    // THEN
    assert.equal(newPosition, null);
  });

  test('valid findPrevClassEnd, end of file', () => {
    // GIVEN
    const position = { line: 18, character: 4 } as Position;

    // WHEN
    const newPosition = findPrevClassEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 16);
    assert.equal(newPosition.character, 15);
  });

  test('valid findPrevClassEnd, past first class', () => {
    // GIVEN
    const position = { line: 7, character: 2 } as Position;

    // WHEN
    const newPosition = findPrevClassEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 5);
    assert.equal(newPosition.character, 11);
  });

  test('valid findPrevClassEnd, past second outer class', () => {
    // GIVEN
    const position = { line: 9, character: 3 } as Position;

    // WHEN
    const newPosition = findPrevClassEnd(position);

    // THEN
    assert.notEqual(newPosition, null);
    assert(newPosition !== null);
    assert.equal(newPosition.line, 5);
    assert.equal(newPosition.character, 11);
  });

  test('Invalid findPrevClassEnd, before end of first class', () => {
    // GIVEN
    const position = { line: 4, character: 8 } as Position;

    // WHEN
    const newPosition = findPrevClassEnd(position);

    // THEN
    assert.equal(newPosition, null);
  });
});