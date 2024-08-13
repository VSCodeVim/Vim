import { strict as assert } from 'assert';
import { SearchOffset } from '../../src/vimscript/pattern';

function parseTest(name: string, input: string, output: SearchOffset) {
  test(name, () => {
    assert.deepStrictEqual(SearchOffset.parser.tryParse(input), output);
  });
}

suite('SearchOffset parsing', () => {
  parseTest('+', '+', new SearchOffset({ type: 'lines', delta: 1 }));
  parseTest('-', '-', new SearchOffset({ type: 'lines', delta: -1 }));

  parseTest('[num]', '123', new SearchOffset({ type: 'lines', delta: 123 }));
  parseTest('+[num]', '+123', new SearchOffset({ type: 'lines', delta: 123 }));
  parseTest('-[num]', '-123', new SearchOffset({ type: 'lines', delta: -123 }));

  parseTest('e', 'e', new SearchOffset({ type: 'chars_from_end', delta: 0 }));
  parseTest('e+', 'e+', new SearchOffset({ type: 'chars_from_end', delta: 1 }));
  parseTest('e-', 'e-', new SearchOffset({ type: 'chars_from_end', delta: -1 }));
  parseTest('e[num]', 'e123', new SearchOffset({ type: 'chars_from_end', delta: 123 }));
  parseTest('e+[num]', 'e+123', new SearchOffset({ type: 'chars_from_end', delta: 123 }));
  parseTest('e-[num]', 'e-123', new SearchOffset({ type: 'chars_from_end', delta: -123 }));

  parseTest('s', 's', new SearchOffset({ type: 'chars_from_start', delta: 0 }));
  parseTest('s+', 's+', new SearchOffset({ type: 'chars_from_start', delta: 1 }));
  parseTest('s-', 's-', new SearchOffset({ type: 'chars_from_start', delta: -1 }));
  parseTest('s[num]', 's123', new SearchOffset({ type: 'chars_from_start', delta: 123 }));
  parseTest('s+[num]', 's+123', new SearchOffset({ type: 'chars_from_start', delta: 123 }));
  parseTest('s-[num]', 's-123', new SearchOffset({ type: 'chars_from_start', delta: -123 }));

  parseTest('b', 'b', new SearchOffset({ type: 'chars_from_start', delta: 0 }));
  parseTest('b+', 'b+', new SearchOffset({ type: 'chars_from_start', delta: 1 }));
  parseTest('b-', 'b-', new SearchOffset({ type: 'chars_from_start', delta: -1 }));
  parseTest('b[num]', 'b123', new SearchOffset({ type: 'chars_from_start', delta: 123 }));
  parseTest('b+[num]', 'b+123', new SearchOffset({ type: 'chars_from_start', delta: 123 }));
  parseTest('b-[num]', 'b-123', new SearchOffset({ type: 'chars_from_start', delta: -123 }));

  // TODO: ;{pattern}
});

// TODO: Write these tests
// suite('SearchOffset application', () => {});
