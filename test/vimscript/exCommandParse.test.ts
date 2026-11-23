import { strict as assert } from 'assert';
import { AsciiCommand } from '../../src/cmd_line/commands/ascii';
import { BangCommand } from '../../src/cmd_line/commands/bang';
import {
  AddBreakpointCommand,
  DeleteBreakpointCommand,
  ListBreakpointsCommand,
} from '../../src/cmd_line/commands/breakpoints';
import { BufferDeleteCommand } from '../../src/cmd_line/commands/bufferDelete';
import { ChangeCommand } from '../../src/cmd_line/commands/change';
import { CloseCommand } from '../../src/cmd_line/commands/close';
import { CopyCommand } from '../../src/cmd_line/commands/copy';
import { DeleteCommand } from '../../src/cmd_line/commands/delete';
import { DigraphsCommand } from '../../src/cmd_line/commands/digraph';
import { EchoCommand } from '../../src/cmd_line/commands/echo';
import { EvalCommand } from '../../src/cmd_line/commands/eval';
import {
  ExFoldcloseCommand,
  ExFoldCommand,
  ExFolddoclosedCommand,
  ExFolddoopenCommand,
  ExFoldopenCommand,
} from '../../src/cmd_line/commands/exFold';
import { ExploreCommand } from '../../src/cmd_line/commands/explore';
import { FileCommand } from '../../src/cmd_line/commands/file';
import { FileInfoCommand } from '../../src/cmd_line/commands/fileInfo';
import { GotoCommand } from '../../src/cmd_line/commands/goto';
import { GotoLineCommand } from '../../src/cmd_line/commands/gotoLine';
import { GrepCommand } from '../../src/cmd_line/commands/grep';
import { HistoryCommand, HistoryCommandType } from '../../src/cmd_line/commands/history';
import { ClearJumpsCommand, JumpsCommand } from '../../src/cmd_line/commands/jumps';
import { LeftCommand, RightCommand } from '../../src/cmd_line/commands/leftRightCenter';
import { LetCommand, LetCommandArgs, LetCommandOperation } from '../../src/cmd_line/commands/let';
import { DeleteMarksCommand, MarkCommand, MarksCommand } from '../../src/cmd_line/commands/marks';
import { MoveCommand } from '../../src/cmd_line/commands/move';
import { NohlCommand } from '../../src/cmd_line/commands/nohl';
import { NormalCommand } from '../../src/cmd_line/commands/normal';
import { OnlyCommand } from '../../src/cmd_line/commands/only';
import { PrintCommand } from '../../src/cmd_line/commands/print';
import { PutExCommand } from '../../src/cmd_line/commands/put';
import { PwdCommand } from '../../src/cmd_line/commands/pwd';
import { QuitCommand } from '../../src/cmd_line/commands/quit';
import { ReadCommand } from '../../src/cmd_line/commands/read';
import { RedoCommand } from '../../src/cmd_line/commands/redo';
import { RegisterCommand } from '../../src/cmd_line/commands/register';
import { RetabCommand } from '../../src/cmd_line/commands/retab';
import { SetCommand } from '../../src/cmd_line/commands/set';
import { ShCommand } from '../../src/cmd_line/commands/sh';
import { ShiftCommand } from '../../src/cmd_line/commands/shift';
import { SmileCommand } from '../../src/cmd_line/commands/smile';
import { ISortCommandArguments, SortCommand } from '../../src/cmd_line/commands/sort';
import {
  ReplaceString,
  SubstituteCommand,
  SubstituteFlags,
} from '../../src/cmd_line/commands/substitute';
import { TabCommand, TabCommandType } from '../../src/cmd_line/commands/tab';
import { TerminalCommand } from '../../src/cmd_line/commands/terminal';
import { UndoCommand } from '../../src/cmd_line/commands/undo';
import { VsCodeCommand } from '../../src/cmd_line/commands/vscode';
import { WallCommand } from '../../src/cmd_line/commands/wall';
import { IWriteCommandArguments, WriteCommand } from '../../src/cmd_line/commands/write';
import { WriteQuitCommand } from '../../src/cmd_line/commands/writequit';
import { WriteQuitAllCommand } from '../../src/cmd_line/commands/writequitall';
import { YankCommand } from '../../src/cmd_line/commands/yank';
import { VimError } from '../../src/error';
import { ExCommand } from '../../src/vimscript/exCommand';
import { exCommandParser, NoOpCommand } from '../../src/vimscript/exCommandParser';
import {
  add,
  dictionary,
  funcCall,
  int,
  list,
  listExpr,
  str,
  toExpr,
  variable,
} from '../../src/vimscript/expression/build';
import { Expression } from '../../src/vimscript/expression/types';
import { Address, LineRange } from '../../src/vimscript/lineRange';
import { Pattern, SearchDirection } from '../../src/vimscript/pattern';

function exParseTest(input: string, parsed: ExCommand, lineRange?: LineRange) {
  test(input, () => {
    const result = exCommandParser.tryParse(input);
    assert.deepStrictEqual(result.command, parsed);
    assert.deepStrictEqual(result.lineRange, lineRange);
  });
}

function exParseFails(input: string, error: VimError) {
  test(input, () => {
    assert.throws(() => exCommandParser.tryParse(input), error);
  });
}

const line = (num: number) => new Address({ type: 'number', num });
const currentLine = (offset?: number) => new Address({ type: 'current_line' }, offset);
const forwardPattern = Pattern.parser({ direction: SearchDirection.Forward, delimiter: '/' });

const sort = (args: Partial<ISortCommandArguments> = {}) =>
  new SortCommand({ reverse: false, ignoreCase: false, unique: false, numeric: false, ...args });

/** `pattern` includes its closing delimiter; a string `replace` is a literal replacement. */
const substitute = (
  pattern: string,
  replace: string | ReplaceString,
  flags: SubstituteFlags = {},
  count?: number,
) =>
  new SubstituteCommand({
    pattern: forwardPattern.tryParse(pattern),
    replace:
      typeof replace === 'string'
        ? new ReplaceString([{ type: 'string', value: replace }])
        : replace,
    flags,
    count,
  });

suite('Ex command parsing', () => {
  suite('Unknown command', () => {
    exParseFails(':fakecmd', VimError.NotAnEditorCommand('fakecmd'));
    exParseFails(':^', VimError.NotAnEditorCommand('^'));
  });

  suite(':[range]', () => {
    exParseTest(':', new GotoLineCommand());
    exParseTest(':5', new GotoLineCommand(), new LineRange(line(5)));
    exParseTest(':%', new GotoLineCommand(), new LineRange(new Address({ type: 'entire_file' })));
    exParseTest(':.+5', new GotoLineCommand(), new LineRange(currentLine(5)));
    exParseTest(
      ':.+,.+-+3',
      new GotoLineCommand(),
      new LineRange(currentLine(1), ',', currentLine(3)),
    );
    exParseTest(':,5', new GotoLineCommand(), new LineRange(currentLine(), ',', line(5)));
    exParseTest(':,', new GotoLineCommand(), new LineRange(currentLine(), ',', undefined));
    exParseTest(':3;+2', new GotoLineCommand(), new LineRange(line(3), ';', currentLine(2)));
    exParseTest(': : 5', new GotoLineCommand(), new LineRange(line(5)));
  });

  suite(':[range]{command}', () => {
    exParseTest(
      ':1,3d',
      new DeleteCommand({ register: undefined, count: undefined }),
      new LineRange(line(1), ',', line(3)),
    );
    exParseTest(
      ':1,3 d a 5',
      new DeleteCommand({ register: 'a', count: 5 }),
      new LineRange(line(1), ',', line(3)),
    );
    exParseTest(
      ':%y',
      new YankCommand({ register: undefined, count: undefined }),
      new LineRange(new Address({ type: 'entire_file' })),
    );
    exParseTest(
      ":'<,'>sort",
      sort(),
      new LineRange(
        new Address({ type: 'mark', mark: '<' }),
        ',',
        new Address({ type: 'mark', mark: '>' }),
      ),
    );
    exParseTest(
      ':$copy 0',
      new CopyCommand(line(0)),
      new LineRange(new Address({ type: 'last_line' })),
    );
    exParseTest(
      ':.,.+2>',
      new ShiftCommand({ dir: '>', depth: 1, numLines: undefined }),
      new LineRange(currentLine(), ',', currentLine(2)),
    );
    exParseTest(
      ':/foo/,$s/a/b/g',
      substitute('a/', 'b', { replaceAll: true }),
      new LineRange(
        new Address({ type: 'pattern_next', pattern: forwardPattern.tryParse('foo/') }),
        ',',
        new Address({ type: 'last_line' }),
      ),
    );
  });

  suite(':"', () => {
    exParseTest(':"', new NoOpCommand());
    exParseTest(':"I am a comment', new NoOpCommand());
  });

  suite(':!', () => {
    exParseTest(':!', new BangCommand({ command: '' }));
    exParseTest(':!ls', new BangCommand({ command: 'ls' }));
    exParseTest(':!ls -la | wc', new BangCommand({ command: 'ls -la | wc' }));
    exParseTest(
      ':.,.+2!sort',
      new BangCommand({ command: 'sort' }),
      new LineRange(currentLine(), ',', currentLine(2)),
    );
  });

  suite(':#!', () => {
    exParseTest(':#!', new NoOpCommand());
    exParseTest(':#!123 abc! | s/one/two', new NoOpCommand());
  });

  for (const dir of ['>', '<'] as const) {
    suite(`:${dir}`, () => {
      const shift = (depth: number, numLines?: number) =>
        new ShiftCommand({ dir, depth, numLines });
      exParseTest(`:${dir}`, shift(1));
      exParseTest(`:${dir}${dir}`, shift(2));
      exParseTest(`:${dir}  ${dir}`, shift(2));
      exParseTest(`:${dir}${dir}5`, shift(2, 5));
      exParseTest(`:${dir} ${dir}   5`, shift(2, 5));
    });
  }

  suite(':bd[elete]', () => {
    for (const bang of [false, true]) {
      const bd = bang ? ':bd!' : ':bd';
      const bufferDelete = (buffers: Array<string | number>) =>
        new BufferDeleteCommand({ bang, buffers });
      exParseTest(bd, bufferDelete([]));
      exParseTest(`${bd} 2 5 3`, bufferDelete([2, 5, 3]));
      exParseTest(`${bd} abc.txt`, bufferDelete(['abc.txt']));
      exParseTest(`${bd} abc.txt 5 blah.cc`, bufferDelete(['abc.txt', 5, 'blah.cc']));
    }
  });

  suite(':bn[ext]', () => {
    for (const bang of [false, true]) {
      const bn = bang ? ':bn!' : ':bn';
      const bufferNext = (count?: number, cmdLine?: number) =>
        new TabCommand({
          type: TabCommandType.Next,
          bang,
          cmd: cmdLine === undefined ? undefined : { type: 'line_number', line: cmdLine },
          count,
        });
      exParseTest(bn, bufferNext());
      exParseTest(`${bn} 5`, bufferNext(5));
      exParseTest(`${bn} +20 5`, bufferNext(5, 20));
    }
  });

  suite(':b[uffer]', () => {
    const buffer = (buf: string | number, cmdLine?: number) =>
      new TabCommand({
        type: TabCommandType.Edit,
        cmd: cmdLine === undefined ? undefined : { type: 'line_number', line: cmdLine },
        buf,
      });
    exParseTest(':b', buffer(0));
    exParseTest(':b 5', buffer(5));
    exParseTest(':b5', buffer(5));
    exParseTest(':b +20 5', buffer(5, 20));
    exParseTest(':b bufname', buffer('bufname'));
    exParseTest(':b +20 bufname', buffer('bufname', 20));
    exParseTest(':buffer', buffer(0));
    exParseTest(':buffer 5', buffer(5));
    exParseTest(':buffer bufname', buffer('bufname'));
    exParseTest(':buffer +20 bufname', buffer('bufname', 20));
  });

  suite(':breaka[dd]', () => {
    exParseTest(':breakadd', new AddBreakpointCommand({ type: 'here' }));
    exParseTest(':breaka here', new AddBreakpointCommand({ type: 'here' }));
    exParseTest(':breakadd file', new AddBreakpointCommand({ type: 'file', line: 1, file: '' }));
    exParseTest(
      ':breakadd file 10 foo.ts',
      new AddBreakpointCommand({ type: 'file', line: 10, file: 'foo.ts' }),
    );
    exParseTest(
      ':breakadd func myFunc',
      new AddBreakpointCommand({ type: 'func', function: 'myFunc' }),
    );
    exParseTest(
      ':breakadd func 5 myFunc',
      new AddBreakpointCommand({ type: 'func', function: 'myFunc' }),
    );
    exParseTest(':breakadd expr x > 5', new AddBreakpointCommand({ type: 'expr', expr: 'x > 5' }));

    exParseFails(':breakadd foo', VimError.InvalidArgument474());
  });

  suite(':breakd[el]', () => {
    exParseTest(':breakdel', new DeleteBreakpointCommand({ type: 'here' }));
    exParseTest(':breakd here', new DeleteBreakpointCommand({ type: 'here' }));
    exParseTest(':breakdel *', new DeleteBreakpointCommand({ type: 'all' }));
    exParseTest(':breakdel 3', new DeleteBreakpointCommand({ type: 'byId', id: 3 }));
    exParseTest(
      ':breakdel file 10 foo.ts',
      new DeleteBreakpointCommand({ type: 'file', line: 10, file: 'foo.ts' }),
    );
    exParseTest(
      ':breakdel func myFunc',
      new DeleteBreakpointCommand({ type: 'func', function: 'myFunc' }),
    );
  });

  suite(':breakl[ist]', () => {
    exParseTest(':breakl', new ListBreakpointsCommand());
    exParseTest(':breaklist', new ListBreakpointsCommand());
  });

  suite(':c[hange]', () => {
    exParseTest(':c', new ChangeCommand({ register: undefined, count: undefined }));
    exParseTest(':change a', new ChangeCommand({ register: 'a', count: undefined }));
    exParseTest(':c 5', new ChangeCommand({ register: undefined, count: 5 }));
    exParseTest(':c a 5', new ChangeCommand({ register: 'a', count: 5 }));
  });

  suite(':clo[se]', () => {
    exParseTest(':clo', new CloseCommand(false));
    exParseTest(':clo!', new CloseCommand(true));
    exParseTest(':close', new CloseCommand(false));
    exParseTest(':close!', new CloseCommand(true));
  });

  suite(':co[py]', () => {
    exParseTest(':copy', new CopyCommand());
    exParseTest(':copy 0', new CopyCommand(new Address({ type: 'number', num: 0 })));
    exParseTest(':copy 1', new CopyCommand(new Address({ type: 'number', num: 1 })));
    exParseTest(':copy 56', new CopyCommand(new Address({ type: 'number', num: 56 })));
    exParseTest(':copy .', new CopyCommand(new Address({ type: 'current_line' })));
    exParseTest(':copy .+2', new CopyCommand(new Address({ type: 'current_line' }, 2)));
  });

  suite(':d[elete]', () => {
    exParseTest(':d', new DeleteCommand({ register: undefined, count: undefined }));
    exParseTest(':d a', new DeleteCommand({ register: 'a', count: undefined }));
    exParseTest(':d 5', new DeleteCommand({ register: undefined, count: 5 }));
    exParseTest(':d a 5', new DeleteCommand({ register: 'a', count: 5 }));
  });

  suite(':delm[arks]', () => {
    exParseTest(':delm!', new DeleteMarksCommand('!'));

    exParseTest(':delm a', new DeleteMarksCommand(['a']));
    exParseTest(':delm aA1 ^k', new DeleteMarksCommand(['a', 'A', '1', '^', 'k']));
    exParseTest(':delm a-z', new DeleteMarksCommand([{ start: 'a', end: 'z' }]));
    exParseTest(':delm A-Z', new DeleteMarksCommand([{ start: 'A', end: 'Z' }]));
    exParseTest(':delm 1-9', new DeleteMarksCommand([{ start: '1', end: '9' }]));
    exParseTest(':delm 24-9', new DeleteMarksCommand(['2', { start: '4', end: '9' }]));
    exParseTest(
      ':delm A-K2-4',
      new DeleteMarksCommand([
        { start: 'A', end: 'K' },
        { start: '2', end: '4' },
      ]),
    );

    exParseFails(':delm', VimError.ArgumentRequired());

    exParseFails(':delm -', VimError.TrailingCharacters('-')); // TODO: Should throw `E475: Invalid argument: -`
    exParseFails(':delm a-', VimError.TrailingCharacters('-')); // TODO: Should throw `E475: Invalid argument: a-`
    exParseFails(':delm -z', VimError.TrailingCharacters('-z')); // TODO: Should throw `E475: Invalid argument: -z`
    exParseFails(':delm a-Z', VimError.TrailingCharacters('-Z')); // TODO: Should throw `E475: Invalid argument: a-Z`

    exParseFails(':delm! a', VimError.TrailingCharacters('a')); // TODO: Should throw `E474: Invalid argument`
  });

  suite(':dig[raphs]', () => {
    exParseTest(':dig', new DigraphsCommand({ bang: false, newDigraph: undefined }));
    exParseTest(':dig!', new DigraphsCommand({ bang: true, newDigraph: undefined }));
    exParseTest(':dig e: 235', new DigraphsCommand({ bang: false, newDigraph: ['e', ':', [235]] }));
    exParseTest(
      ':dig R! 55357 56960',
      new DigraphsCommand({
        bang: false,
        newDigraph: ['R', '!', [55357, 56960]],
      }),
    );

    exParseFails(':dig e:', VimError.TrailingCharacters('e:')); // TODO: Should throw `E39: Number expected`
  });

  suite(':ec[ho]', () => {
    const echo = (exprs: Expression[]) => new EchoCommand({ sep: ' ', error: false }, exprs);
    exParseTest(':echo', echo([]));
    exParseTest(':echo []{}', echo([listExpr([]), toExpr(dictionary(new Map()))]));
    exParseTest(':echo 5 + 5', echo([add(int(5), int(5))]));
    exParseTest(':echo 5 + 5 5', echo([add(int(5), int(5)), int(5)]));

    exParseFails(':echo 5 (', VimError.InvalidExpression('('));
    // TODO: exParseFails(':echo 5 6abc', VimError.InvalidExpression('6abc'));
  });

  suite(':e[dit]', () => {
    for (const bang of [false, true]) {
      const e = bang ? ':edit!' : ':edit';
      const edit = (file?: string) =>
        new FileCommand({ name: 'edit', bang, opt: [], cmd: undefined, file });
      exParseTest(e, edit());
      exParseTest(`${e} abc.txt`, edit('abc.txt'));
      exParseTest(`${e} abc\\ 1.txt`, edit('abc 1.txt'));
    }

    // TODO: Test with [++opt]
    // TODO: Test with [+cmd]
    // TODO: Test with #[count]
  });

  suite(':ene[w]', () => {
    exParseTest(':enew', new FileCommand({ name: 'enew', bang: false }));
    exParseTest(':enew!', new FileCommand({ name: 'enew', bang: true }));
  });

  suite(':eval', () => {
    exParseTest(':eval 2 + 2', new EvalCommand(add(int(2), int(2))));

    exParseFails(':eval', VimError.InvalidExpression(''));
    // TODO: exParseFails(':eval 6abc', VimError.InvalidExpression('6abc'));
    exParseFails(':eval 1 1', VimError.TrailingCharacters('1'));
  });

  suite(':f[ile]', () => {
    exParseTest(':f', new FileInfoCommand({ bang: false, fileName: '' }));
    exParseTest(':file!', new FileInfoCommand({ bang: true, fileName: '' }));
    exParseTest(':file foo.txt', new FileInfoCommand({ bang: false, fileName: 'foo.txt' }));
  });

  suite(':go[to]', () => {
    exParseTest(':goto', new GotoCommand());
    exParseTest(':goto 123', new GotoCommand(123));
  });

  suite(':his[tory]', () => {
    exParseTest(':his', new HistoryCommand({ type: HistoryCommandType.Cmd }));

    exParseTest(':his c', new HistoryCommand({ type: HistoryCommandType.Cmd }));
    exParseTest(':his cmd', new HistoryCommand({ type: HistoryCommandType.Cmd }));
    exParseTest(':his :', new HistoryCommand({ type: HistoryCommandType.Cmd }));

    exParseTest(':his s', new HistoryCommand({ type: HistoryCommandType.Search }));
    exParseTest(':his search', new HistoryCommand({ type: HistoryCommandType.Search }));
    exParseTest(':his /', new HistoryCommand({ type: HistoryCommandType.Search }));

    exParseTest(':his e', new HistoryCommand({ type: HistoryCommandType.Expr }));
    exParseTest(':his expr', new HistoryCommand({ type: HistoryCommandType.Expr }));
    exParseTest(':his =', new HistoryCommand({ type: HistoryCommandType.Expr }));

    exParseTest(':his i', new HistoryCommand({ type: HistoryCommandType.Input }));
    exParseTest(':his input', new HistoryCommand({ type: HistoryCommandType.Input }));
    exParseTest(':his @', new HistoryCommand({ type: HistoryCommandType.Input }));

    exParseTest(':his d', new HistoryCommand({ type: HistoryCommandType.Debug }));
    exParseTest(':his debug', new HistoryCommand({ type: HistoryCommandType.Debug }));
    exParseTest(':his >', new HistoryCommand({ type: HistoryCommandType.Debug }));

    exParseTest(':his a', new HistoryCommand({ type: HistoryCommandType.All }));
    exParseTest(':his all', new HistoryCommand({ type: HistoryCommandType.All }));

    // TODO parse indices
  });

  suite(':le[ft]', () => {
    exParseTest(':left', new LeftCommand({ indent: 0 }));
    exParseTest(':left4', new LeftCommand({ indent: 4 }));
    exParseTest(':left 8', new LeftCommand({ indent: 8 }));
  });

  suite(':let', () => {
    exParseTest(':let', new LetCommand({ operation: 'print', variables: [] }));
    exParseTest(
      ':let foo bar',
      new LetCommand({ operation: 'print', variables: [variable('foo'), variable('bar')] }),
    );

    const assign = (
      operation: LetCommandOperation,
      target: Extract<LetCommandArgs, { lock: boolean }>['variable'],
      expression: Expression,
      lock = false,
    ) => new LetCommand({ operation, variable: target, expression, lock });

    exParseTest(':let foo = 5', assign('=', variable('foo'), int(5)));
    exParseTest(':let foo += 5', assign('+=', variable('foo'), int(5)));
    exParseTest(':let foo -= 5', assign('-=', variable('foo'), int(5)));
    exParseTest(":let foo .= 'bar'", assign('.=', variable('foo'), str('bar')));

    exParseTest(
      ':let [a, b, c] = [1, 2, 3]',
      assign(
        '=',
        { type: 'unpack', names: ['a', 'b', 'c'] },
        toExpr(list([int(1), int(2), int(3)])),
      ),
    );

    exParseTest(
      ':let x[7] = "foo"',
      assign('=', { type: 'index', variable: variable('x'), index: int(7) }, str('foo')),
    );

    exParseTest(
      ':let s:arr[start:end] = [1, 2, 3]',
      assign(
        '=',
        {
          type: 'slice',
          variable: variable('arr', 's'),
          start: variable('start'),
          end: variable('end'),
        },
        toExpr(list([int(1), int(2), int(3)])),
      ),
    );

    exParseTest(':const foo = 5', assign('=', variable('foo'), int(5), true));

    // TODO

    exParseFails(':let x = ', VimError.InvalidExpression(''));
    // TODO: exParseFails(':let x = 6abc', VimError.InvalidExpression('6abc'));
    exParseFails(':let x = 6 abc', VimError.TrailingCharacters('abc'));
  });

  suite(':marks', () => {
    exParseTest(':marks', new MarksCommand([]));
    exParseTest(':marks aB', new MarksCommand(['a', 'B']));
    exParseTest(':marks 0 1', new MarksCommand(['0', '1']));
  });

  suite(':mark', () => {
    exParseTest(':mark a', new MarkCommand('a'));
    exParseTest(':mark `', new MarkCommand('`'));

    exParseFails(':mark', VimError.ArgumentRequired());
  });

  suite(':m[ove]', () => {
    exParseTest(':m', new MoveCommand());
    exParseTest(':m 0', new MoveCommand(line(0)));
    exParseTest(':move0', new MoveCommand(line(0)));
    exParseTest(':m $', new MoveCommand(new Address({ type: 'last_line' })));
    exParseTest(':m +2', new MoveCommand(currentLine(2)));
    exParseTest(":m 'a", new MoveCommand(new Address({ type: 'mark', mark: 'a' })));
  });

  suite(':norm[al]', () => {
    exParseTest(':norm dd', new NormalCommand('dd'));
    exParseTest(':normal   ihello world', new NormalCommand('ihello world'));
    exParseTest(
      ':%norm A;',
      new NormalCommand('A;'),
      new LineRange(new Address({ type: 'entire_file' })),
    );

    exParseFails(':normal', VimError.ArgumentRequired());
    exParseFails(':normal! dd', VimError.InvalidArgument474()); // TODO: Support `:normal!`
  });

  suite(':p[rint] and friends', () => {
    const print = (printNumbers: boolean, printText: boolean) =>
      new PrintCommand({ printNumbers, printText });
    exParseTest(':p', print(false, true));
    exParseTest(':print', print(false, true));
    exParseTest(':l', print(false, true));
    exParseTest(':list', print(false, true));
    exParseTest(':nu', print(true, true));
    exParseTest(':number', print(true, true));
    exParseTest(':#', print(true, true));
    exParseTest(':=', print(true, false));
  });

  suite(':pu[t]', () => {
    exParseTest(':put', new PutExCommand({ bang: false, register: undefined }));
    exParseTest(':put!', new PutExCommand({ bang: true, register: undefined }));
    exParseTest(':put x', new PutExCommand({ bang: false, register: 'x' }));
    exParseTest(':put! x', new PutExCommand({ bang: true, register: 'x' }));

    // No space, non-alpha register
    exParseTest(':put"', new PutExCommand({ bang: false, register: '"' }));
    exParseTest(':put!"', new PutExCommand({ bang: true, register: '"' }));

    // No space, alpha register
    exParseFails(':putx', VimError.NotAnEditorCommand('putx'));
    exParseTest(':put!x', new PutExCommand({ bang: true, register: 'x' }));

    // Expression register
    exParseTest(':put=', new PutExCommand({ bang: false, register: '=' }));
    exParseTest(':put=5+2', new PutExCommand({ bang: false, fromExpression: add(int(5), int(2)) }));
    exParseTest(
      ':put = range(4)',
      new PutExCommand({ bang: false, fromExpression: funcCall('range', [int(4)]) }),
    );
    exParseTest(
      ':put!=[1,2,3]',
      new PutExCommand({ bang: true, fromExpression: toExpr(list([int(1), int(2), int(3)])) }),
    );
    exParseFails(':put=)', VimError.InvalidExpression(')'));
    // TODO: exParseFails(':put=1+', VimError.InvalidExpression('1+'));
    exParseFails(':put=1 1', VimError.TrailingCharacters('1'));
  });

  suite(':q[uit] and :qa[ll]', () => {
    exParseTest(':q', new QuitCommand({ bang: false, quitAll: false }));
    exParseTest(':q!', new QuitCommand({ bang: true, quitAll: false }));
    exParseTest(':qa', new QuitCommand({ bang: false, quitAll: true }));
    exParseTest(':qa!', new QuitCommand({ bang: true, quitAll: true }));
  });

  suite(':r[ead]', () => {
    exParseTest(':r', new ReadCommand({ opt: [] }));
    exParseTest(':r abc.txt', new ReadCommand({ opt: [], file: 'abc.txt' }));
    exParseTest(':r !ls', new ReadCommand({ opt: [], cmd: 'ls' }));
    exParseTest(
      ':r ++enc=foo abc.txt',
      new ReadCommand({ opt: [['enc', 'foo']], file: 'abc.txt' }),
    );
    exParseTest(':r ++enc=foo !ls', new ReadCommand({ opt: [['enc', 'foo']], cmd: 'ls' }));
  });

  suite(':red[o]', () => {
    exParseTest(':red', new RedoCommand());
    exParseTest(':redo 3', new RedoCommand(3));
  });

  suite(':reg[isters]', () => {
    exParseTest(':reg', new RegisterCommand([]));
    exParseTest(':reg b1"2a', new RegisterCommand(['b', '1', '"', '2', 'a']));
    exParseTest(':reg b 1 " 2 a', new RegisterCommand(['b', '1', '"', '2', 'a']));
  });

  suite(':ret[ab]', () => {
    exParseTest(':retab', new RetabCommand({ replaceSpaces: false, newTabstop: undefined }));
    exParseTest(':retab 8', new RetabCommand({ replaceSpaces: false, newTabstop: 8 }));
    exParseTest(':ret4', new RetabCommand({ replaceSpaces: false, newTabstop: 4 }));
    exParseTest(':retab!', new RetabCommand({ replaceSpaces: true, newTabstop: undefined }));
    exParseTest(':ret! 8', new RetabCommand({ replaceSpaces: true, newTabstop: 8 }));
    exParseTest(':retab!4', new RetabCommand({ replaceSpaces: true, newTabstop: 4 }));
  });

  suite(':ri[ght]', () => {
    exParseTest(':right', new RightCommand({ width: 80 })); // Defaults to 'textwidth'
    exParseTest(':right40', new RightCommand({ width: 40 }));
    exParseTest(':right 20', new RightCommand({ width: 20 }));
  });

  suite(':se[t]', () => {
    exParseTest(':set', new SetCommand({ type: 'show_or_set', option: undefined }));
    exParseTest(':set all', new SetCommand({ type: 'show_or_set', option: 'all' }));
    exParseTest(':set all&', new SetCommand({ type: 'default', option: 'all', source: '' }));

    for (const option of ['ws', 'wrapscan']) {
      exParseTest(`:set ${option}`, new SetCommand({ type: 'show_or_set', option }));
      exParseTest(`:set ${option}?`, new SetCommand({ type: 'show', option }));
      exParseTest(`:set no${option}`, new SetCommand({ type: 'unset', option }));
      exParseTest(`:set inv${option}`, new SetCommand({ type: 'invert', option }));
      exParseTest(`:set ${option}!`, new SetCommand({ type: 'invert', option }));
      exParseTest(`:set ${option}&`, new SetCommand({ type: 'default', option, source: '' }));
      exParseTest(`:set ${option}&vi`, new SetCommand({ type: 'default', option, source: 'vi' }));
      exParseTest(`:set ${option}&vim`, new SetCommand({ type: 'default', option, source: 'vim' }));
      // TODO: :set {option}<
    }

    for (const option of ['sw', 'shiftwidth']) {
      exParseTest(`:set ${option}=4`, new SetCommand({ type: 'equal', option, value: '4' }));
      exParseTest(`:set ${option}:4`, new SetCommand({ type: 'equal', option, value: '4' }));
      exParseTest(`:set ${option}+=4`, new SetCommand({ type: 'add', option, value: '4' }));
      exParseTest(`:set ${option}^=4`, new SetCommand({ type: 'multiply', option, value: '4' }));
      exParseTest(`:set ${option}-=4`, new SetCommand({ type: 'subtract', option, value: '4' }));
    }
  });

  suite(':sor[t]', () => {
    for (const reverse of [false, true]) {
      const s = reverse ? ':sort!' : ':sort';
      exParseTest(s, sort({ reverse }));
      exParseTest(`${s} i`, sort({ reverse, ignoreCase: true }));
      exParseTest(`${s} u`, sort({ reverse, unique: true }));
      exParseTest(`${s} iu`, sort({ reverse, ignoreCase: true, unique: true }));
      exParseTest(`${s} ui`, sort({ reverse, ignoreCase: true, unique: true }));
      exParseTest(`${s} n`, sort({ reverse, numeric: true }));
      exParseTest(`${s} nu`, sort({ reverse, unique: true, numeric: true }));
    }

    // TODO
  });

  suite(':s[ubstitute]', () => {
    exParseTest(':s/a/b/g', substitute('a/', 'b', { replaceAll: true }));
    exParseTest(':s/a/b/g 3', substitute('a/', 'b', { replaceAll: true }, 3));
    exParseTest(':s/a/b/g3', substitute('a/', 'b', { replaceAll: true }, 3));
    exParseTest(':s/a/b/3', substitute('a/', 'b', {}, 3));
    // Can use weird delimiter
    exParseTest(':s#a#b#g', substitute('a/', 'b', { replaceAll: true }));
    // Can escape delimiter
    exParseTest(':s/\\/\\/a/b', substitute('\\/\\/a/', 'b'));
    // Can use pattern escapes
    exParseTest(':s/\\ba/b', substitute('\\ba/', 'b'));
    // Can escape replacement
    exParseTest(':s/a/\\b', substitute('a/', '\b'));

    exParseTest(
      ':s/a/\\=x+1',
      substitute(
        'a/',
        new ReplaceString([{ type: 'expression', expression: add(variable('x'), int(1)) }]),
      ),
    );
    // TODO
  });

  suite(':tabm[ove]', () => {
    const tabMove = (count?: number, direction?: 'left' | 'right') =>
      new TabCommand({ type: TabCommandType.Move, count, direction });
    exParseTest(':tabm', tabMove());
    exParseTest(':tabm 0', tabMove(0));
    exParseTest(':tabm 10', tabMove(10));
    exParseTest(':tabm +', tabMove(undefined, 'right'));
    exParseTest(':tabm +10', tabMove(10, 'right'));
    exParseTest(':tabm -', tabMove(undefined, 'left'));
    exParseTest(':tabm -10', tabMove(10, 'left'));

    for (const arg of ['+0', '-0', '++', '--', '1+', '1-', 'x', '1x', 'x1']) {
      exParseFails(`:tabm ${arg}`, VimError.InvalidArgument475(arg));
    }
  });

  suite(':tabo[nly]', () => {
    for (const bang of [false, true]) {
      const tabo = bang ? ':tabonly!' : ':tabonly';
      const tabOnly = (count?: number) =>
        new TabCommand({ type: TabCommandType.Only, bang, count });
      exParseTest(tabo, tabOnly());
      exParseTest(`${tabo}5`, tabOnly(5));
      exParseTest(`${tabo} 5`, tabOnly(5));
    }
  });

  suite(':u[ndo]', () => {
    exParseTest(':u', new UndoCommand());
    exParseTest(':undo', new UndoCommand());
    exParseTest(':u 3', new UndoCommand(3));
    exParseTest(':u3', new UndoCommand(3));
  });

  suite(':vim[grep]', () => {
    exParseTest(
      ':vimgrep t*st foo.txt',
      new GrepCommand({
        // It expects pattern.closed to be false (check Pattern.parser), so unless there's a delimiter in the pattern, it will fail the test
        pattern: Pattern.parser({ direction: SearchDirection.Backward, delimiter: ' ' }).tryParse(
          't*st ',
        ),
        files: ['foo.txt'],
      }),
    );
    exParseTest(
      ':vimgrep t*st foo.txt bar.txt baz.txt',
      new GrepCommand({
        pattern: Pattern.parser({ direction: SearchDirection.Backward, delimiter: ' ' }).tryParse(
          't*st ',
        ),
        files: ['foo.txt', 'bar.txt', 'baz.txt'],
      }),
    );
  });

  suite(':vscode', () => {
    exParseTest(
      ':vscode editor.action.commentLine',
      new VsCodeCommand('editor.action.commentLine'),
    );
    exParseFails(':vscode', VimError.ArgumentRequired());
  });

  suite(':fold', () => {
    exParseTest(':fold', new ExFoldCommand());
    exParseTest(':fo', new ExFoldCommand());

    exParseTest(':foldclose', new ExFoldcloseCommand());
    exParseTest(':foldc', new ExFoldcloseCommand());

    exParseTest(':foldopen', new ExFoldopenCommand());
    exParseTest(':foldo', new ExFoldopenCommand());
  });

  suite(':folddo[open|closed]', () => {
    exParseTest(':folddoopen s/foo/bar/g', new ExFolddoopenCommand('s/foo/bar/g'));
    exParseTest(':foldd s/foo/bar/g', new ExFolddoopenCommand('s/foo/bar/g'));

    exParseTest(':folddoclosed s/foo/bar/g', new ExFolddoclosedCommand('s/foo/bar/g'));
    exParseTest(':folddoc s/foo/bar/g', new ExFolddoclosedCommand('s/foo/bar/g'));
  });

  suite(':y[ank]', () => {
    exParseTest(':y', new YankCommand({ register: undefined, count: undefined }));
    exParseTest(':y a', new YankCommand({ register: 'a', count: undefined }));
    exParseTest(':y 5', new YankCommand({ register: undefined, count: 5 }));
    exParseTest(':y a 5', new YankCommand({ register: 'a', count: 5 }));
  });

  suite(':w[rite]', () => {
    const write = (args: Partial<IWriteCommandArguments> = {}) =>
      new WriteCommand({ bang: false, opt: [], bgWrite: true, ...args });
    exParseTest(':w', write());
    exParseTest(':w!', write({ bang: true }));

    exParseTest(':w ++bin', write({ opt: [['bin', undefined]] }));
    exParseTest(':w ++enc=foo', write({ opt: [['enc', 'foo']] }));
    exParseTest(
      ':w ++bin ++enc=foo',
      write({
        opt: [
          ['bin', undefined],
          ['enc', 'foo'],
        ],
      }),
    );

    exParseTest(':w ++enc=foo blah.txt', write({ opt: [['enc', 'foo']], file: 'blah.txt' }));

    exParseTest(':w !foo', write({ cmd: 'foo' }));
    exParseTest(':w !', write({ cmd: '' }));

    // TODO
  });

  suite(':wa[ll]', () => {
    exParseTest(':wa', new WallCommand(false));
    exParseTest(':wall!', new WallCommand(true));
  });

  suite(':wq, :x[it], and :exi[t]', () => {
    for (const cmd of [':wq', ':x', ':xit', ':exit']) {
      exParseTest(cmd, new WriteQuitCommand({ bang: false, opt: [] }));
      exParseTest(`${cmd}!`, new WriteQuitCommand({ bang: true, opt: [] }));
    }
    exParseTest(':wq foo.txt', new WriteQuitCommand({ bang: false, opt: [], file: 'foo.txt' }));
    exParseTest(
      ':wq! ++enc=foo foo.txt',
      new WriteQuitCommand({ bang: true, opt: [['enc', 'foo']], file: 'foo.txt' }),
    );
  });

  suite(':wqa[ll] and :xa[ll]', () => {
    for (const cmd of [':wqa', ':wqall', ':xa', ':xall']) {
      exParseTest(cmd, new WriteQuitAllCommand({ bang: false, fileOpt: [] }));
      exParseTest(`${cmd}!`, new WriteQuitAllCommand({ bang: true, fileOpt: [] }));
    }
    exParseTest(
      ':wqa ++enc=foo',
      new WriteQuitAllCommand({ bang: false, fileOpt: [['enc', 'foo']] }),
    );
  });

  suite('Commands without arguments', () => {
    const commands: Array<[string[], () => ExCommand]> = [
      [[':as', ':ascii'], () => new AsciiCommand()],
      [[':cle', ':clearjumps'], () => new ClearJumpsCommand()],
      [[':Ex', ':Explore'], () => new ExploreCommand()],
      [[':ju', ':jumps'], () => new JumpsCommand()],
      [[':noh', ':nohlsearch'], () => new NohlCommand()],
      [[':on', ':only'], () => new OnlyCommand()],
      [[':pw', ':pwd'], () => new PwdCommand()],
      [[':sh', ':shell'], () => new ShCommand()],
      [[':smile'], () => new SmileCommand()],
      [[':te', ':terminal'], () => new TerminalCommand()], // TODO: Vim accepts `:terminal {cmd}`
    ];
    for (const [names, command] of commands) {
      for (const name of names) {
        exParseTest(name, command());
      }
      exParseFails(`${names.at(-1)} x`, VimError.TrailingCharacters('x'));
    }
  });
});
