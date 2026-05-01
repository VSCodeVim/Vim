import { strict as assert } from 'assert';
import { Address, LineRange } from '../../src/vimscript/lineRange';
import { Pattern, SearchDirection } from '../../src/vimscript/pattern';

function parseTest(name: string, input: string, output: LineRange) {
  test(name, () => {
    assert.deepStrictEqual(LineRange.parser.tryParse(input), output);
  });
}

suite('LineRange parsing', () => {
  suite('Basic', () => {
    parseTest('number', '123', new LineRange(new Address({ type: 'number', num: 123 })));
    parseTest('current_line', '.', new LineRange(new Address({ type: 'current_line' })));
    parseTest('last_line', '$', new LineRange(new Address({ type: 'last_line' })));
    parseTest('entire_file', '%', new LineRange(new Address({ type: 'entire_file' })));
    parseTest('last_visual_range', '*', new LineRange(new Address({ type: 'last_visual_range' })));
    parseTest("mark ('a)", "'a", new LineRange(new Address({ type: 'mark', mark: 'a' })));
    parseTest("mark ('A)", "'A", new LineRange(new Address({ type: 'mark', mark: 'A' })));
    parseTest("mark ('<)", "'<", new LineRange(new Address({ type: 'mark', mark: '<' })));
    parseTest(
      'pattern_next (no closing /)',
      '/abc',
      new LineRange(
        new Address({
          type: 'pattern_next',
          pattern: Pattern.parser({ direction: SearchDirection.Forward }).tryParse('abc'),
        }),
      ),
    );
    parseTest(
      'pattern_next (closing /)',
      '/abc/',
      new LineRange(
        new Address({
          type: 'pattern_next',
          pattern: Pattern.parser({
            direction: SearchDirection.Forward,
            delimiter: '/',
          }).tryParse('abc/'),
        }),
      ),
    );
    parseTest(
      'pattern_prev (no closing ?)',
      '?abc',
      new LineRange(
        new Address({
          type: 'pattern_prev',
          pattern: Pattern.parser({ direction: SearchDirection.Backward }).tryParse('abc'),
        }),
      ),
    );
    parseTest(
      'pattern_prev (closing ?)',
      '?abc?',
      new LineRange(
        new Address({
          type: 'pattern_prev',
          pattern: Pattern.parser({
            direction: SearchDirection.Backward,
            delimiter: '?',
          }).tryParse('abc?'),
        }),
      ),
    );
    parseTest(
      'last_search_pattern_next',
      '\\/',
      new LineRange(new Address({ type: 'last_search_pattern_next' })),
    );
    parseTest(
      'last_search_pattern_prev',
      '\\?',
      new LineRange(new Address({ type: 'last_search_pattern_prev' })),
    );
    parseTest(
      'last_substitute_pattern_next',
      '\\&',
      new LineRange(new Address({ type: 'last_substitute_pattern_next' })),
    );
  });

  for (const sep of [',', ';'] as const) {
    suite(`Start and end (${sep})`, () => {
      parseTest(
        'Separator but no second address',
        `5${sep}`,
        new LineRange(new Address({ type: 'number', num: 5 }), sep),
      );
      parseTest(
        'Separator but no first address',
        `${sep}5`,
        new LineRange(
          new Address({ type: 'current_line' }),
          sep,
          new Address({ type: 'number', num: 5 }),
        ),
      );
      parseTest(
        'Separator but no address at all',
        `${sep}`,
        new LineRange(new Address({ type: 'current_line' }), sep),
      );
      parseTest(
        'Two numbers',
        `14${sep}23`,
        new LineRange(
          new Address({ type: 'number', num: 14 }),
          sep,
          new Address({ type: 'number', num: 23 }),
        ),
      );
      parseTest(
        'Two numbers (out of order)',
        `123${sep}6`,
        new LineRange(
          new Address({ type: 'number', num: 123 }),
          sep,
          new Address({ type: 'number', num: 6 }),
        ),
      );
      parseTest(
        'Visual selection using marks',
        `'<${sep}'>`,
        new LineRange(
          new Address({ type: 'mark', mark: '<' }),
          sep,
          new Address({ type: 'mark', mark: '>' }),
        ),
      );
    });

    suite('Whitespace', () => {
      parseTest(
        'Spacing between numbers adds them',
        '1 2 3 , 4  5  6',
        new LineRange(
          new Address({ type: 'number', num: 1 }, 5),
          ',',
          new Address({ type: 'number', num: 4 }, 11),
        ),
      );
    });
  }
});
