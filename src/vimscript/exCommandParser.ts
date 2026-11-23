import {
  all,
  optWhitespace,
  Parser,
  seq,
  // eslint-disable-next-line id-denylist
  string,
  succeed,
} from 'parsimmon';
import { AsciiCommand } from '../cmd_line/commands/ascii';
import { BangCommand } from '../cmd_line/commands/bang';
import { Breakpoints } from '../cmd_line/commands/breakpoints';
import { BufferDeleteCommand } from '../cmd_line/commands/bufferDelete';
import { ChangeCommand } from '../cmd_line/commands/change';
import { CloseCommand } from '../cmd_line/commands/close';
import { CopyCommand } from '../cmd_line/commands/copy';
import { DeleteCommand } from '../cmd_line/commands/delete';
import { DigraphsCommand } from '../cmd_line/commands/digraph';
import { EchoCommand } from '../cmd_line/commands/echo';
import { CallCommand, EvalCommand } from '../cmd_line/commands/eval';
import {
  ExFoldcloseCommand,
  ExFoldCommand,
  ExFolddoclosedCommand,
  ExFolddoopenCommand,
  ExFoldopenCommand,
} from '../cmd_line/commands/exFold';
import { ExploreCommand } from '../cmd_line/commands/explore';
import { FileCommand } from '../cmd_line/commands/file';
import { FileInfoCommand } from '../cmd_line/commands/fileInfo';
import { GotoCommand } from '../cmd_line/commands/goto';
import { GotoLineCommand } from '../cmd_line/commands/gotoLine';
import { GrepCommand } from '../cmd_line/commands/grep';
import { HistoryCommand } from '../cmd_line/commands/history';
import { ClearJumpsCommand, JumpsCommand } from '../cmd_line/commands/jumps';
import { CenterCommand, LeftCommand, RightCommand } from '../cmd_line/commands/leftRightCenter';
import { LetCommand, UnletCommand } from '../cmd_line/commands/let';
import { DeleteMarksCommand, MarkCommand, MarksCommand } from '../cmd_line/commands/marks';
import { MoveCommand } from '../cmd_line/commands/move';
import { NohlCommand } from '../cmd_line/commands/nohl';
import { NormalCommand } from '../cmd_line/commands/normal';
import { OnlyCommand } from '../cmd_line/commands/only';
import { PrintCommand } from '../cmd_line/commands/print';
import { PutExCommand } from '../cmd_line/commands/put';
import { PwdCommand } from '../cmd_line/commands/pwd';
import { QuitCommand } from '../cmd_line/commands/quit';
import { ReadCommand } from '../cmd_line/commands/read';
import { RedoCommand } from '../cmd_line/commands/redo';
import { RegisterCommand } from '../cmd_line/commands/register';
import { RetabCommand } from '../cmd_line/commands/retab';
import { SetCommand } from '../cmd_line/commands/set';
import { ShCommand } from '../cmd_line/commands/sh';
import { ShiftCommand } from '../cmd_line/commands/shift';
import { SmileCommand } from '../cmd_line/commands/smile';
import { SortCommand } from '../cmd_line/commands/sort';
import { SubstituteCommand } from '../cmd_line/commands/substitute';
import { TabCommand } from '../cmd_line/commands/tab';
import { TerminalCommand } from '../cmd_line/commands/terminal';
import { UndoCommand } from '../cmd_line/commands/undo';
import { VsCodeCommand } from '../cmd_line/commands/vscode';
import { WallCommand } from '../cmd_line/commands/wall';
import { WriteCommand } from '../cmd_line/commands/write';
import { WriteQuitCommand } from '../cmd_line/commands/writequit';
import { WriteQuitAllCommand } from '../cmd_line/commands/writequitall';
import { YankCommand } from '../cmd_line/commands/yank';
import { VimError } from '../error';
import { VimState } from '../state/vimState';
import { StatusBar } from '../statusBar';
import { ExCommand } from './exCommand';
import { ExCommandName, exCommandNameParser, fullCommandName } from './exCommandNames';
import { LineRange } from './lineRange';

type ArgParser = Parser<ExCommand>;

/**
 * The argument parsers of the builtin Ex commands that are implemented. Commands in
 * `builtinExCommandNames` without an entry are yet to be implemented (PRs are welcome!)
 */
const argParsers: Partial<Record<ExCommandName, ArgParser>> = {
  '': succeed(new GotoLineCommand()),
  '"': all.map((_) => new NoOpCommand()),
  '!': BangCommand.argParser,
  '#': PrintCommand.argParser({ printNumbers: true, printText: true }),
  '#!': all.map((_) => new NoOpCommand()),
  '<': ShiftCommand.argParser('<'),
  '=': PrintCommand.argParser({ printNumbers: true, printText: false }),
  '>': ShiftCommand.argParser('>'),
  ascii: succeed(new AsciiCommand()),
  buffer: TabCommand.argParsers.buffer,
  bNext: TabCommand.argParsers.bprev,
  bdelete: BufferDeleteCommand.argParser,
  bfirst: TabCommand.argParsers.bfirst,
  blast: TabCommand.argParsers.blast,
  bnext: TabCommand.argParsers.bnext,
  bprevious: TabCommand.argParsers.bprev,
  brewind: TabCommand.argParsers.bfirst,
  breakadd: Breakpoints.argParsers.add,
  breakdel: Breakpoints.argParsers.del,
  breaklist: Breakpoints.argParsers.list,
  change: ChangeCommand.argParser,
  call: CallCommand.argParser,
  cclose: succeed(new VsCodeCommand('workbench.action.closePanel')),
  center: CenterCommand.argParser,
  clearjumps: succeed(new ClearJumpsCommand()),
  close: CloseCommand.argParser,
  cnext: succeed(new VsCodeCommand('editor.action.marker.nextInFiles')),
  cnfile: succeed(new VsCodeCommand('editor.action.marker.nextInFiles')),
  copy: CopyCommand.argParser,
  const: LetCommand.argParser(true),
  copen: succeed(new VsCodeCommand('workbench.panel.markers.view.focus')),
  cprevious: succeed(new VsCodeCommand('editor.action.marker.prevInFiles')),
  cpfile: succeed(new VsCodeCommand('editor.action.marker.prevInFiles')),
  cwindow: succeed(new VsCodeCommand('workbench.panel.markers.view.focus')),
  delete: DeleteCommand.argParser,
  delmarks: DeleteMarksCommand.argParser,
  display: RegisterCommand.argParser,
  digraphs: DigraphsCommand.argParser,
  edit: FileCommand.argParsers.edit,
  echo: EchoCommand.argParser({ sep: ' ', error: false }),
  echoerr: EchoCommand.argParser({ sep: ' ', error: true }),
  echon: EchoCommand.argParser({ sep: '', error: false }),
  enew: FileCommand.argParsers.enew,
  eval: EvalCommand.argParser,
  ex: FileCommand.argParsers.edit,
  exit: WriteQuitCommand.argParser,
  Explore: succeed(new ExploreCommand()),
  file: FileInfoCommand.argParser,
  fold: succeed(new ExFoldCommand()),
  foldclose: succeed(new ExFoldcloseCommand()),
  folddoopen: ExFolddoopenCommand.argParser,
  folddoclosed: ExFolddoclosedCommand.argParser,
  foldopen: succeed(new ExFoldopenCommand()),
  goto: GotoCommand.argParser,
  grep: GrepCommand.argParser,
  history: HistoryCommand.argParser,
  jumps: succeed(new JumpsCommand()),
  list: PrintCommand.argParser({ printNumbers: false, printText: true }),
  lclose: succeed(new VsCodeCommand('workbench.action.closePanel')),
  left: LeftCommand.argParser,
  let: LetCommand.argParser(false),
  lnext: succeed(new VsCodeCommand('editor.action.nextCommentThreadAction')),
  lopen: succeed(new VsCodeCommand('workbench.action.focusCommentsPanel')),
  lprevious: succeed(new VsCodeCommand('editor.action.previousCommentThreadAction')),
  ls: succeed(new VsCodeCommand('workbench.action.quickOpenLeastRecentlyUsedEditorInGroup')),
  lwindow: succeed(new VsCodeCommand('workbench.action.focusCommentsPanel')),
  move: MoveCommand.argParser,
  mark: MarkCommand.argParser,
  marks: MarksCommand.argParser,
  new: FileCommand.argParsers.new,
  nohlsearch: succeed(new NohlCommand()),
  normal: NormalCommand.argParser,
  // eslint-disable-next-line id-denylist
  number: PrintCommand.argParser({ printNumbers: true, printText: true }),
  only: succeed(new OnlyCommand()),
  print: PrintCommand.argParser({ printNumbers: false, printText: true }),
  put: PutExCommand.argParser,
  pwd: succeed(new PwdCommand()),
  quit: QuitCommand.argParser(false),
  qall: QuitCommand.argParser(true),
  quitall: QuitCommand.argParser(true),
  read: ReadCommand.argParser,
  redo: RedoCommand.argParser,
  registers: RegisterCommand.argParser,
  retab: RetabCommand.argParser,
  right: RightCommand.argParser,
  substitute: SubstituteCommand.argParser,
  set: SetCommand.argParser,
  shell: succeed(new ShCommand()),
  smile: succeed(new SmileCommand()),
  sort: SortCommand.argParser,
  split: FileCommand.argParsers.split,
  t: CopyCommand.argParser,
  tabNext: TabCommand.argParsers.bprev,
  tabclose: TabCommand.argParsers.tabclose,
  tabedit: TabCommand.argParsers.tabnew,
  tabfirst: TabCommand.argParsers.bfirst,
  tablast: TabCommand.argParsers.blast,
  tabmove: TabCommand.argParsers.tabmove,
  tabnext: TabCommand.argParsers.bnext,
  tabnew: TabCommand.argParsers.tabnew,
  tabonly: TabCommand.argParsers.tabonly,
  tabprevious: TabCommand.argParsers.bprev,
  tabrewind: TabCommand.argParsers.bfirst,
  terminal: TerminalCommand.argParser,
  undo: UndoCommand.argParser,
  unlet: UnletCommand.argParser,
  update: WriteCommand.argParser,
  vimgrep: GrepCommand.argParser,
  vnew: FileCommand.argParsers.vnew,
  vsplit: FileCommand.argParsers.vsplit,
  vscode: VsCodeCommand.argParser,
  write: WriteCommand.argParser,
  wall: WallCommand.argParser,
  wq: WriteQuitCommand.argParser,
  wqall: WriteQuitAllCommand.argParser,
  xit: WriteQuitCommand.argParser,
  xall: WriteQuitAllCommand.argParser,
  yank: YankCommand.argParser,
};

class UnimplementedCommand extends ExCommand {
  name: string;

  public override neovimCapable(): boolean {
    // If the user has neovim integration enabled, don't stop them from using these commands
    return true;
  }

  constructor(name: string) {
    super();
    this.name = name;
  }

  async execute(vimState: VimState): Promise<void> {
    StatusBar.setText(
      vimState,
      `Command :${this.name} is not yet implemented (PRs are welcome!)`,
      true,
    );
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    await this.execute(vimState);
  }
}

export class NoOpCommand extends ExCommand {
  async execute(vimState: VimState): Promise<void> {
    // nothing
  }
}

export const exCommandParser: Parser<{
  name: string;
  lineRange: LineRange | undefined;
  command: ExCommand;
}> = optWhitespace
  .then(string(':').skip(optWhitespace).many())
  .then(
    seq(
      LineRange.parser.fallback(undefined),
      optWhitespace,
      exCommandNameParser.fallback(undefined),
      all,
    ),
  )
  .map(([lineRange, whitespace, nameEntry, args]) => {
    if (nameEntry === undefined) {
      throw VimError.NotAnEditorCommand(`${lineRange?.toString() ?? ''}${whitespace}${args}`);
    }
    const name = fullCommandName(nameEntry);
    const [abbrev, rest] = nameEntry;
    const argParser = (
      argParsers[name] ?? all.result(new UnimplementedCommand(rest ? `${abbrev}[${rest}]` : abbrev))
    ).skip(optWhitespace);
    if (name === '' && lineRange === undefined && args !== '') {
      // HACK: Handle edge cases like `:^`, which will be incorrectly parsed as a GotoLineCommand
      throw VimError.NotAnEditorCommand(`${whitespace}${args}`);
    }
    const result = seq(argParser, optWhitespace.then(all)).parse(args);
    if (result.status === false) {
      if (result.index.offset === args.length) {
        throw VimError.ArgumentRequired();
      }
      throw VimError.InvalidArgument474();
    }
    const [command, trailing] = result.value;
    if (trailing) {
      // TODO: Implement `:help :bar`
      throw VimError.TrailingCharacters(trailing);
    }
    return { name, lineRange, command };
  });
