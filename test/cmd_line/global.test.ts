import { newTest } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('Global command tests', () => {
  setup(setupWorkspace);
  teardown(cleanUpWorkspace);

  suite('Parser tests for all command variants', () => {
    // Test :g command variant (Requirements 1.1, 1.2)
    newTest({
      title: ':g/pattern/command - basic global command',
      start: ['|hello world', 'goodbye world', 'hello there'],
      keysPressed: ':g/hello/d\n',
      end: ['goodbye worl|d'],
    });

    // Test :global command variant (Requirements 1.2)
    newTest({
      title: ':global/pattern/command - full command name',
      start: ['|hello world', 'goodbye world', 'hello there'],
      keysPressed: ':global/hello/d\n',
      end: ['goodbye worl|d'],
    });

    // Test :g! command variant (Requirements 2.1, 2.2)
    newTest({
      title: ':g!/pattern/command - inverse global command',
      start: ['|hello world', 'goodbye world', 'hello there'],
      keysPressed: ':g!/hello/d\n',
      end: ['hello world', '|hello there'],
    });

    // Test :v command variant (Requirements 2.2, 2.3)
    newTest({
      title: ':v/pattern/command - inverse global alias',
      start: ['|hello world', 'goodbye world', 'hello there'],
      keysPressed: ':v/hello/d\n',
      end: ['hello world', '|hello there'],
    });

    // Test :vglobal command variant (Requirements 2.3)
    newTest({
      title: ':vglobal/pattern/command - full inverse command name',
      start: ['|hello world', 'goodbye world', 'hello there'],
      keysPressed: ':vglobal/hello/d\n',
      end: ['hello world', '|hello there'],
    });
  });

  suite('Pattern delimiter tests', () => {
    // Test hash delimiter (Requirements 4.1, 4.3)
    newTest({
      title: 'Global command with # delimiter',
      start: ['|hello/world', 'goodbye/world', 'hello/there'],
      keysPressed: ':g#hello#d\n',
      end: ['goodbye/worl|d'],
    });

    // Test @ delimiter (Requirements 4.1, 4.3)
    newTest({
      title: 'Global command with @ delimiter',
      start: ['|hello@world', 'goodbye@world', 'hello@there'],
      keysPressed: ':g@hello@d\n',
      end: ['goodbye@worl|d'],
    });

    // Test % delimiter (Requirements 4.1, 4.3)
    newTest({
      title: 'Global command with % delimiter',
      start: ['|hello%world', 'goodbye%world', 'hello%there'],
      keysPressed: ':g%hello%d\n',
      end: ['goodbye%worl|d'],
    });

    // Test + delimiter (Requirements 4.1, 4.3)
    newTest({
      title: 'Global command with + delimiter',
      start: ['|hello+world', 'goodbye+world', 'hello+there'],
      keysPressed: ':g+hello+d\n',
      end: ['goodbye+worl|d'],
    });
  });

  suite('Command execution tests', () => {
    // Test delete command (Requirements 5.1)
    newTest({
      title: 'Global command with delete (d)',
      start: ['|hello world', 'goodbye world', 'hello there', 'goodbye there'],
      keysPressed: ':g/hello/d\n',
      end: ['goodbye world', 'goodbye ther|e'],
    });

    // Test substitute command (Requirements 5.2)
    newTest({
      title: 'Global command with substitute (s)',
      start: ['|hello world', 'goodbye world', 'hello there'],
      keysPressed: ':g/hello/s/hello/hi/\n',
      end: ['hi world', 'goodbye world', '|hi there'],
    });

    // Test normal mode commands (Requirements 5.5)
    newTest({
      title: 'Global command with normal mode commands',
      start: ['|hello world', 'goodbye world', 'hello there'],
      keysPressed: ':g/hello/normal A!\n',
      end: ['hello world!', 'goodbye world', 'hello there|!'],
    });

    // Test default print command (Requirements 1.5)
    newTest({
      title: 'Global command with default print command',
      start: ['|hello world', 'goodbye world', 'hello there'],
      keysPressed: ':g/hello/\n',
      end: ['hello world', 'goodbye world', '|hello there'],
    });
  });

  suite('Range tests', () => {
    // Test entire document range (Requirements 3.2)
    newTest({
      title: 'Global command on entire document (default)',
      start: ['|hello world', 'goodbye world', 'hello there', 'goodbye there'],
      keysPressed: ':g/hello/d\n',
      end: ['goodbye world', 'goodbye ther|e'],
    });

    // Test specific line range (Requirements 3.1)
    newTest({
      title: 'Global command with specific line range',
      start: ['|hello world', 'goodbye world', 'hello there', 'goodbye there'],
      keysPressed: ':1,2g/hello/d\n',
      end: ['|goodbye world', 'hello there', 'goodbye there'],
    });

    // Test current line range (Requirements 3.1)
    newTest({
      title: 'Global command with current line range',
      start: ['hello world', '|goodbye world', 'hello there', 'goodbye there'],
      keysPressed: ':.g/goodbye/d\n',
      end: ['hello world', '|hello there', 'goodbye there'],
    });

    // Test visual selection range (Requirements 3.3)
    newTest({
      title: 'Global command with visual selection range',
      start: ['|hello world', 'goodbye world', 'hello there', 'goodbye there'],
      keysPressed: 'Vjj:g/hello/d\n',
      end: ['goodbye world', 'goodbye ther|e'],
    });

    // Test percentage range (Requirements 3.1)
    newTest({
      title: 'Global command with percentage range',
      start: ['|hello world', 'goodbye world', 'hello there', 'goodbye there'],
      keysPressed: ':%g/hello/d\n',
      end: ['goodbye world', 'goodbye ther|e'],
    });
  });

  suite('Complex pattern and command combinations', () => {
    // Test multiple substitutions on matching lines
    newTest({
      title: 'Global with multiple substitutions',
      start: ['|foo bar foo', 'baz qux', 'foo bar foo'],
      keysPressed: ':g/foo/s/foo/FOO/g\n',
      end: ['FOO bar FOO', 'baz qux', '|FOO bar FOO'],
    });

    // Test global with regex patterns
    newTest({
      title: 'Global with regex pattern',
      start: ['|line1', 'line2', 'line3', 'other'],
      keysPressed: ':g/line[0-9]/d\n',
      end: ['othe|r'],
    });

    // Test inverse global with simple pattern
    newTest({
      title: 'Inverse global with simple pattern',
      start: ['|apple', 'banana', 'cherry'],
      keysPressed: ':v/banana/d\n',
      end: ['banan|a'],
    });

    // Test global with word boundaries
    newTest({
      title: 'Global with word boundary pattern',
      start: ['|hello world', 'say hello', 'helloworld', 'hello there'],
      keysPressed: ':g/\\bhello\\b/d\n',
      end: ['helloworl|d'],
    });
  });

  suite('Line tracking and adjustment tests', () => {
    // Test line number adjustment with deletions
    newTest({
      title: 'Global delete adjusts line numbers correctly',
      start: ['|delete1', 'keep1', 'delete2', 'keep2', 'delete3'],
      keysPressed: ':g/delete/d\n',
      end: ['keep1', 'keep|2'],
    });

    // Test line number adjustment with insertions
    newTest({
      title: 'Global with line insertions',
      start: ['|line1', 'line2', 'line3'],
      keysPressed: ':g/line/normal o  inserted\n',
      end: ['line1', 'line2', 'line3', '  inserted', '    inserted', '      inserte|d'],
    });

    // Test mixed operations affecting line count
    newTest({
      title: 'Global with mixed line count changes',
      start: ['|match1', 'nomatch', 'match2', 'nomatch', 'match3'],
      keysPressed: ':g/match/s/match/MATCH\\nNEWLINE/\n',
      end: [
        'MATCH',
        'NEWLINE1',
        'noMATCH',
        'NEWLINE',
        'MATCH',
        '|NEWLINE2',
        'noMATCH',
        'NEWLINE',
        'MATCH',
        'NEWLINE3',
      ],
    });
  });

  suite('Undo grouping tests', () => {
    // Test single undo for entire global operation (Requirements 7.1, 7.2)
    newTest({
      title: 'Global command creates single undo point',
      start: ['|hello world', 'hello there', 'goodbye world'],
      keysPressed: ':g/hello/s/hello/hi/\nu',
      end: ['|hello world', 'hello there', 'goodbye world'],
    });

    // Test undo after global delete
    newTest({
      title: 'Global delete creates single undo point',
      start: ['|delete1', 'keep1', 'delete2', 'keep2'],
      keysPressed: ':g/delete/d\nu',
      end: ['|delete1', 'keep1', 'delete2', 'keep2'],
    });

    // Test redo after undo (Requirements 7.4)
    newTest({
      title: 'Global command redo works correctly',
      start: ['|hello world', 'hello there', 'goodbye world'],
      keysPressed: ':g/hello/s/hello/hi/\nu<C-r>',
      end: ['|hi world', 'hi there', 'goodbye world'],
    });
  });

  suite('Edge cases and error conditions', () => {
    // Test empty document
    newTest({
      title: 'Global command on empty document',
      start: ['|'],
      keysPressed: ':g/test/d\n',
      end: ['|'],
      statusBar: 'E486: Pattern not found: test',
    });

    // Test no matching lines (Requirements 6.3)
    newTest({
      title: 'Global command with no matching lines',
      start: ['|hello world', 'hello there'],
      keysPressed: ':g/xyz/d\n',
      end: ['|hello world', 'hello there'],
      statusBar: 'E486: Pattern not found: xyz',
    });

    // Test inverse global with all lines matching
    newTest({
      title: 'Inverse global with all lines matching',
      start: ['|hello world', 'hello there'],
      keysPressed: ':v/hello/d\n',
      end: ['|hello world', 'hello there'],
    });

    // Test global on single line document
    newTest({
      title: 'Global command on single line document',
      start: ['|hello world'],
      keysPressed: ':g/hello/s/hello/hi/\n',
      end: ['|hi world'],
    });

    // Test global with empty pattern (should use last search)
    newTest({
      title: 'Global with empty pattern uses last search',
      start: ['|hello world', 'goodbye world', 'hello there'],
      keysPressed: '/hello\n:g//d\n',
      end: ['hello world', 'goodbye world', '|hello there'],
    });
  });

  suite('Error handling and validation tests', () => {
    // Test invalid pattern syntax errors (Requirements 6.1)
    newTest({
      title: 'Invalid regex pattern syntax',
      start: ['|hello world', 'goodbye world'],
      keysPressed: ':g/[unclosed/d\n',
      end: ['|hello world', 'goodbye world'],
      statusBar: 'E486: Pattern not found: [unclosed',
    });

    newTest({
      title: 'Invalid regex with unmatched parentheses',
      start: ['|hello world', 'goodbye world'],
      keysPressed: ':g/\\(unclosed/d\n',
      end: ['|hello world', 'goodbye world'],
      statusBar: 'E486: Pattern not found: \\(unclosed',
    });

    newTest({
      title: 'Invalid regex with bad escape sequence',
      start: ['|hello world', 'goodbye world'],
      keysPressed: ':g/\\z/d\n',
      end: ['|hello world', 'goodbye world'],
      statusBar: 'E486: Pattern not found: \\z',
    });

    // Test invalid command syntax errors (Requirements 6.2)
    newTest({
      title: 'Invalid ex-command in global',
      start: ['|hello world', 'goodbye world'],
      keysPressed: ':g/hello/invalidcommand\n',
      end: ['|hello world', 'goodbye world'],
      statusBar: 'E492: Not an editor command: invalidcommand',
    });

    newTest({
      title: 'Invalid substitute command syntax',
      start: ['|hello world', 'goodbye world'],
      keysPressed: ':g/hello/s/unclosed\n',
      end: ['|hello world', 'goodbye world'],
      statusBar: 'E486: Pattern not found: unclosed',
    });

    newTest({
      title: 'Invalid normal mode command',
      start: ['|hello world', 'goodbye world'],
      keysPressed: ':g/hello/normal \\invalid\n',
      end: ['|ello world', 'goodbye world'],
      statusBar: '-- NORMAL --',
    });

    // Test "Pattern not found" scenarios (Requirements 6.3)
    newTest({
      title: 'Pattern not found in document',
      start: ['|apple', 'banana', 'cherry'],
      keysPressed: ':g/orange/d\n',
      end: ['|apple', 'banana', 'cherry'],
      statusBar: 'E486: Pattern not found: orange',
    });

    newTest({
      title: 'Pattern not found in specified range',
      start: ['|hello world', 'goodbye world', 'hello there'],
      keysPressed: ':2,2g/hello/d\n',
      end: ['|hello world', 'goodbye world', 'hello there'],
      statusBar: 'E486: Pattern not found: hello',
    });

    newTest({
      title: 'Inverse pattern matches all lines in range',
      start: ['|hello world', 'hello there'],
      keysPressed: ':g!/hello/d\n',
      end: ['|hello world', 'hello there'],
    });

    // Test empty document and no matching lines cases (Requirements 6.3, 6.4)
    newTest({
      title: 'Empty document with global command',
      start: ['|'],
      keysPressed: ':g/anything/d\n',
      end: ['|'],
      statusBar: 'E486: Pattern not found: anything',
    });

    newTest({
      title: 'Document with only empty lines',
      start: ['|', '', ''],
      keysPressed: ':g/text/d\n',
      end: ['|', '', ''],
      statusBar: 'E486: Pattern not found: text',
    });

    newTest({
      title: 'Global command on whitespace-only document',
      start: ['|   ', '  ', '\t'],
      keysPressed: ':g/\\S/d\n',
      end: ['|   ', '  ', '\t'],
      statusBar: 'E486: Pattern not found: \\S',
    });

    // Test range validation errors (Requirements 6.5)
    newTest({
      title: 'Invalid range - line number too high',
      start: ['|hello world', 'goodbye world'],
      keysPressed: ':1,10g/hello/d\n',
      end: ['|hello world', 'goodbye world'],
      statusBar: 'E16: Invalid range',
    });

    newTest({
      title: 'Invalid range - negative line number',
      start: ['|hello world', 'goodbye world'],
      keysPressed: ':-1,1g/hello/d\n',
      end: ['|hello world', 'goodbye world'],
      statusBar: 'E16: Invalid range',
    });

    newTest({
      title: 'Invalid range - backwards range',
      start: ['|hello world', 'goodbye world', 'hello there'],
      keysPressed: ':3,1g/hello/d\n',
      end: ['goodbye worl|d'],
      statusBar: '-- NORMAL --',
    });

    newTest({
      title: 'Invalid range with zero line number',
      start: ['|hello world', 'goodbye world'],
      keysPressed: ':0,1g/hello/d\n',
      end: ['|goodbye world'],
      statusBar: '-- NORMAL --',
    });

    // Test malformed global command syntax
    newTest({
      title: 'Missing pattern delimiter',
      start: ['|hello world', 'goodbye world'],
      keysPressed: ':g/hello\n',
      end: ['|hello world', 'goodbye world'],
      statusBar: 'hello world',
    });

    newTest({
      title: 'Missing closing delimiter',
      start: ['|hello world', 'goodbye world'],
      keysPressed: ':g/hello/d/extra\n',
      end: ['|hello world', 'goodbye world'],
      statusBar: 'E488: Trailing characters: extra',
    });

    newTest({
      title: 'Empty global command',
      start: ['|hello world', 'goodbye world'],
      keysPressed: ':g\n',
      end: ['|hello world', 'goodbye world'],
      statusBar: 'E15: Invalid expression',
    });

    // Test pattern delimiter edge cases
    newTest({
      title: 'Pattern contains unescaped delimiter',
      start: ['|hello/world', 'goodbye/world'],
      keysPressed: ':g/hello/world/d\n',
      end: ['|hello/world', 'goodbye/world'],
      statusBar: 'E492: Not an editor command: world/d',
    });

    newTest({
      title: 'Alphanumeric delimiter should fail',
      start: ['|hello world', 'goodbye world'],
      keysPressed: ':gahelloa/d\n',
      end: ['|hello world', 'goodbye world'],
      statusBar: 'E492: Not an editor command: gahelloa/d',
    });
  });

  suite('VSCode integration tests', () => {
    // Test cursor positioning after global command (Requirements 8.2)
    newTest({
      title: 'Cursor positioned at last affected line',
      start: ['|hello world', 'goodbye world', 'hello there'],
      keysPressed: ':g/hello/s/hello/hi/\n',
      end: ['hi world', 'goodbye world', '|hi there'],
    });

    // Test multi-cursor clearing (Requirements 8.1)
    // Note: This is tested implicitly through the other tests as the global command
    // implementation clears multi-cursor selections before execution

    // Test with visual selection (Requirements 8.3, 8.4)
    newTest({
      title: 'Global command respects visual selection boundaries',
      start: ['|hello world', 'goodbye world', 'hello there', 'hello again'],
      keysPressed: 'Vjj:g/hello/d\n',
      end: ['goodbye world', 'hello agai|n'],
    });
  });
});
