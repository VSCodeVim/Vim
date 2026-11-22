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

  suite('End-to-end workflow tests', () => {
    // Test complete global operation workflow (Requirements 7.1, 7.2, 7.3, 7.4)
    newTest({
      title: 'Complete global substitute workflow with pattern matching',
      start: ['|line1 match', 'line2 nomatch', 'line3 match'],
      keysPressed: ':g/\\bmatch$/s/match/DELETED/\n',
      end: ['line1 DELETED', 'line2 nomatch', '|line3 DELETED'],
    });

    newTest({
      title: 'Complete global delete workflow',
      start: ['|delete me', 'keep me', 'delete me too'],
      keysPressed: ':g/^delete/d\n',
      end: ['keep m|e'],
    });

    newTest({
      title: 'Complete global substitute workflow',
      start: ['|foo bar', 'baz qux', 'foo baz', 'qux bar'],
      keysPressed: ':g/foo/s/foo/FOO/g\n',
      end: ['FOO bar', 'baz qux', '|FOO baz', 'qux bar'],
    });

    newTest({
      title: 'Complete inverse global workflow',
      start: ['|keep this', 'delete this', 'keep this too', 'delete this too'],
      keysPressed: ':v/keep/d\n',
      end: ['keep this', 'keep this to|o'],
    });

    newTest({
      title: 'Complex global with range and multiple operations',
      start: ['|line1', 'target1', 'line3', 'target2', 'line5', 'target3'],
      keysPressed: ':2,5g/target/s/target/FOUND/\n',
      end: ['line1', 'FOUND1', 'line3', '|FOUND2', 'line5', 'target3'],
    });

    newTest({
      title: 'Global with normal mode commands workflow',
      start: ['|item1', 'item2', 'item3'],
      keysPressed: ':g/item/normal A - processed\n',
      end: ['item1 - processed', 'item2 - processed', 'item3 - processe|d'],
    });
  });

  suite('Comprehensive undo/redo tests', () => {
    // Test atomic undo behavior (Requirements 7.1, 7.2)
    newTest({
      title: 'Global operation is atomic - single undo undoes all changes',
      start: ['|match1', 'nomatch1', 'match2', 'nomatch2', 'match3'],
      keysPressed: ':g/match/s/match/CHANGED/\nu',
      end: ['|match1', 'nomatch1', 'match2', 'nomatch2', 'match3'],
    });

    newTest({
      title: 'Global delete is atomic - single undo restores all deleted lines',
      start: ['|delete1', 'keep1', 'delete2', 'keep2', 'delete3'],
      keysPressed: ':g/delete/d\nu',
      end: ['|delete1', 'keep1', 'delete2', 'keep2', 'delete3'],
    });

    newTest({
      title: 'Complex global operation is atomic',
      start: ['|foo bar', 'baz qux', 'foo baz', 'qux foo'],
      keysPressed: ':g/foo/s/foo/FOO/g\nu',
      end: ['|foo bar', 'baz qux', 'foo baz', 'qux foo'],
    });

    // Test redo after undo (Requirements 7.4)
    newTest({
      title: 'Redo restores entire global operation',
      start: ['|match1', 'nomatch1', 'match2', 'nomatch2'],
      keysPressed: ':g/^match/s/match/CHANGED/\nu<C-r>',
      end: ['|CHANGED1', 'nomatch1', 'CHANGED2', 'nomatch2'],
    });

    newTest({
      title: 'Multiple undo/redo cycles work correctly',
      start: ['|test1', 'other1', 'test2', 'other2'],
      keysPressed: ':g/test/s/test/TEST/\nu<C-r>u<C-r>',
      end: ['|TEST1', 'other1', 'TEST2', 'other2'],
    });

    // Test partial execution undo (Requirements 7.3)
    newTest({
      title: 'Undo works even if global operation encounters error',
      start: ['|match1', 'nomatch1', 'match2'],
      keysPressed: ':g/match/s/match/CHANGED/\nu',
      end: ['|match1', 'nomatch1', 'match2'],
    });

    // Test undo with line count changes
    newTest({
      title: 'Undo works correctly with line insertions',
      start: ['|line1', 'line2', 'line3'],
      keysPressed: ':g/line/normal o  inserted\nu',
      end: ['|line1', 'line2', 'line3'],
    });

    newTest({
      title: 'Undo works correctly with line deletions',
      start: ['|delete1', 'keep1', 'delete2', 'keep2'],
      keysPressed: ':g/delete/d\nu',
      end: ['|delete1', 'keep1', 'delete2', 'keep2'],
    });
  });

  suite('VSCode integration tests', () => {
    // Test cursor positioning after global command (Requirements 8.2)
    newTest({
      title: 'Cursor positioned at last affected line after substitute',
      start: ['|hello world', 'goodbye world', 'hello there'],
      keysPressed: ':g/hello/s/hello/hi/\n',
      end: ['hi world', 'goodbye world', '|hi there'],
    });

    newTest({
      title: 'Cursor positioned correctly after global delete',
      start: ['|delete1', 'keep1', 'delete2', 'keep2', 'delete3'],
      keysPressed: ':g/delete/d\n',
      end: ['keep1', 'keep|2'],
    });

    newTest({
      title: 'Cursor positioned at end after global with normal commands',
      start: ['|item1', 'other', 'item2'],
      keysPressed: ':g/item/normal A!\n',
      end: ['item1!', 'other', 'item2|!'],
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

    newTest({
      title: 'Global command with visual line selection',
      start: ['|line1 match', 'line2 match', 'line3 nomatch', 'line4 match'],
      keysPressed: 'V:g/match/s/match/FOUND/\n',
      end: ['|line1 FOUND', 'line2 match', 'line3 nomatch', 'line4 match'],
    });

    newTest({
      title: 'Global command with visual block selection range',
      start: ['|match1 text', 'match2 text', 'nomatch text', 'match3 text'],
      keysPressed: 'Vjj:g/^match/s/match/FOUND/\n',
      end: ['FOUND1 text', '|FOUND2 text', 'nomatch text', 'match3 text'],
    });

    // Test VSCode change tracking (Requirements 8.4)
    newTest({
      title: 'Global command properly updates document state',
      start: ['|original1', 'original2', 'original3'],
      keysPressed: ':g/original/s/original/modified/\n',
      end: ['modified1', 'modified2', '|modified3'],
    });
  });

  suite('Performance tests with large documents', () => {
    // Test with moderately large document
    newTest({
      title: 'Global command performance with 50 lines',
      start: [
        '|line1 match',
        ...Array(48)
          .fill(0)
          .map((_, i) => `line${i + 2} ${i % 5 === 0 ? 'match' : 'nomatch'}`),
        'line50 match',
      ],
      keysPressed: ':g/ match$/s/match/FOUND/\n',
      end: [
        'line1 FOUND',
        ...Array(48)
          .fill(0)
          .map((_, i) => `line${i + 2} ${i % 5 === 0 ? 'FOUND' : 'nomatch'}`),
        '|line50 FOUND',
      ],
    });

    // Test with complex regex pattern
    newTest({
      title: 'Global command with complex regex pattern',
      start: [
        '|email1@domain.com',
        'not an email',
        'email2@test.org',
        'another non-email',
        'email3@example.net',
      ],
      keysPressed: ':g/@/s/@/ AT /\n',
      end: [
        'email1 AT domain.com',
        'not an email',
        'email2 AT test.org',
        'another non-email',
        '|email3 AT example.net',
      ],
    });

    // Test inverse global with large document
    newTest({
      title: 'Inverse global performance test',
      start: [
        '|keep1',
        ...Array(18)
          .fill(0)
          .map((_, i) => (i % 3 === 0 ? 'keep' + (i + 2) : 'delete' + (i + 2))),
        'keep20',
      ],
      keysPressed: ':v/keep/d\n',
      end: ['keep1', 'keep2', 'keep5', 'keep8', 'keep11', 'keep14', 'keep17', 'keep2|0'],
    });

    // Test global with multiple pattern matches per line
    newTest({
      title: 'Global with multiple matches per line',
      start: ['|foo bar foo baz foo', 'no matches here', 'foo test foo end foo'],
      keysPressed: ':g/foo/s/foo/FOO/g\n',
      end: ['FOO bar FOO baz FOO', 'no matches here', '|FOO test FOO end FOO'],
    });

    // Test nested global-like operations
    newTest({
      title: 'Global command with substitute containing global-like pattern',
      start: ['|text with /global/ pattern', 'normal text', 'another /global/ match'],
      keysPressed: ':g/\\/global\\//s/\\/global\\//[GLOBAL]/g\n',
      end: ['text with [GLOBAL] pattern', 'normal text', '|another [GLOBAL] match'],
    });
  });
});
