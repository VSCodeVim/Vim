import * as vscode from 'vscode';
import * as path from 'path';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import {
  all,
  alt,
  eof,
  optWhitespace,
  regexp,
  seqObj,
  string,
  succeed,
  whitespace,
} from 'parsimmon';
import { fileNameParser, numberParser } from '../../vimscript/parserUtils';

function isSourceBreakpoint(b: vscode.Breakpoint): b is vscode.SourceBreakpoint {
  return (b as vscode.SourceBreakpoint).location !== undefined;
}
function isFunctionBreakpoint(b: vscode.Breakpoint): b is vscode.FunctionBreakpoint {
  return (b as vscode.FunctionBreakpoint).functionName !== undefined;
}

/**
 * Add Breakpoint Command
 */
type AddBreakpointHere = { type: 'here' };
type AddBreakpointFile = { type: 'file'; line: number; file: string };
type AddBreakpointFunction = { type: 'func'; function: string };
type AddBreakpointExpr = { type: 'expr'; expr: string };
type AddBreakpoint =
  | AddBreakpointHere
  | AddBreakpointFile
  | AddBreakpointFunction
  | AddBreakpointExpr;

class AddBreakpointCommand extends ExCommand {
  public override isRepeatableWithDot: boolean = false;
  private readonly addBreakpoint: AddBreakpoint;

  constructor(addBreakpoint: AddBreakpoint) {
    super();
    this.addBreakpoint = addBreakpoint;
  }

  async execute(vimState: VimState): Promise<void> {
    if (this.addBreakpoint.type === 'here') {
      const location = new vscode.Location(vimState.document.uri, vimState.cursorStartPosition);
      return vscode.debug.addBreakpoints([new vscode.SourceBreakpoint(location)]);
    } else if (this.addBreakpoint.type === 'file') {
      let file: vscode.Uri;
      if (this.addBreakpoint.file === '') {
        file = vimState.document.uri;
      } else {
        const workspaceFolder =
          vscode.workspace.getWorkspaceFolder(vimState.document.uri)?.uri ?? vscode.Uri.file('./');
        file = vscode.Uri.joinPath(workspaceFolder, this.addBreakpoint.file);
      }
      const location = new vscode.Location(
        file,
        new vscode.Position(this.addBreakpoint.line - 1, 0),
      );
      return vscode.debug.addBreakpoints([new vscode.SourceBreakpoint(location)]);
    } else if (this.addBreakpoint.type === 'func') {
      return vscode.debug.addBreakpoints([
        new vscode.FunctionBreakpoint(this.addBreakpoint.function),
      ]);
    } else if (this.addBreakpoint.type === 'expr') {
      const location = new vscode.Location(vimState.document.uri, vimState.cursorStartPosition);
      return vscode.debug.addBreakpoints([
        new vscode.SourceBreakpoint(location, undefined, this.addBreakpoint.expr),
      ]);
    }
  }
}

/**
 * Delete Breakpoint Command
 */
type DelBreakpointById = { type: 'byId'; id: number };
type DelAllBreakpoints = { type: 'all' };
type DelBreakpointFunction = { type: 'func'; function: string };
type DelBreakpointFile = { type: 'file'; line: number; file: string };
type DelBreakpointHere = { type: 'here' };
type DelBreakpoint =
  | DelBreakpointById
  | DelAllBreakpoints
  | DelBreakpointFunction
  | DelBreakpointFile
  | DelBreakpointHere;

class DeleteBreakpointCommand extends ExCommand {
  public override isRepeatableWithDot: boolean = false;
  private readonly delBreakpoint: DelBreakpoint;

  constructor(delBreakpoint: DelBreakpoint) {
    super();
    this.delBreakpoint = delBreakpoint;
  }

  async execute(vimState: VimState): Promise<void> {
    if (this.delBreakpoint.type === 'byId') {
      return vscode.debug.removeBreakpoints(
        vscode.debug.breakpoints.slice(this.delBreakpoint.id - 1, 1),
      );
    } else if (this.delBreakpoint.type === 'all') {
      return vscode.debug.removeBreakpoints(vscode.debug.breakpoints);
    } else if (this.delBreakpoint.type === 'file') {
      let reqUri: vscode.Uri;
      if (this.delBreakpoint.file === '') {
        reqUri = vimState.document.uri;
      } else {
        const workspaceFolder =
          vscode.workspace.getWorkspaceFolder(vimState.document.uri)?.uri ?? vscode.Uri.file('./');
        reqUri = vscode.Uri.joinPath(workspaceFolder, this.delBreakpoint.file);
      }
      const reqLine = this.delBreakpoint.line - 1;
      const breakpoint = vscode.debug.breakpoints
        .filter(isSourceBreakpoint)
        .find(
          (b) =>
            b.location.uri.toString() === reqUri.toString() &&
            b.location.range.start.line === reqLine,
        );
      if (breakpoint) return vscode.debug.removeBreakpoints([breakpoint]);
    } else if (this.delBreakpoint.type === 'func') {
      const functionName = this.delBreakpoint.function;
      const breakpoint = vscode.debug.breakpoints
        .filter(isFunctionBreakpoint)
        .filter((b) => b.functionName === functionName);
      if (breakpoint) return vscode.debug.removeBreakpoints(breakpoint);
    } else if (this.delBreakpoint.type === 'here') {
      const location = new vscode.Location(vimState.document.uri, vimState.cursorStartPosition);
      const distFromLocationCharacter = (b: vscode.SourceBreakpoint) =>
        Math.abs(b.location.range.start.character - location.range.start.character);

      const breakpoint = vscode.debug.breakpoints
        .filter(isSourceBreakpoint)
        .filter(
          (b) =>
            b.location.uri.toString() === location.uri.toString() &&
            b.location.range.start.line === location.range.start.line,
        )
        .sort((a, b) => distFromLocationCharacter(a) - distFromLocationCharacter(b))[0];
      if (breakpoint) return vscode.debug.removeBreakpoints([breakpoint]);
    }
  }
}

/**
 * List Breakpoints Command
 */
class ListBreakpointsCommand extends ExCommand {
  public override isRepeatableWithDot: boolean = false;

  async execute(vimState: VimState): Promise<void> {
    const breakpoints = vscode.debug.breakpoints;
    type BreakpointQuickPick = { breakpointId: string } & vscode.QuickPickItem;
    const lines = breakpoints.map((b, i): BreakpointQuickPick => {
      const { id, enabled, condition } = b;
      let label = '';
      label += `#${i + 1}\t`;
      label += enabled ? '$(circle-filled)\t' : '$(circle-outline)\t';
      label += condition ? '$(debug-breakpoint-conditional)\t' : '\t';
      if (isSourceBreakpoint(b))
        label += `${path.basename(b.location.uri.fsPath)}:${b.location.range.start.line + 1}`;
      if (isFunctionBreakpoint(b)) label += `$(debug-breakpoint-function)${b.functionName}`;
      return {
        label,
        breakpointId: id,
      };
    });
    await vscode.window.showQuickPick(lines).then(async (selected) => {
      if (selected) {
        const id = selected.breakpointId;
        const breakpoint = breakpoints.find((b) => b.id === id);
        if (breakpoint && isSourceBreakpoint(breakpoint)) {
          await vscode.window.showTextDocument(breakpoint.location.uri).then(() => {
            vimState.cursorStopPosition = breakpoint.location.range.start;
          });
        }
      }
    });
  }
}

export class Breakpoints {
  public static readonly argParsers = {
    add: whitespace
      .then(
        alt(
          // here
          seqObj<AddBreakpointHere>(['type', string('here')], optWhitespace),
          // file
          seqObj<AddBreakpointFile>(
            ['type', string('file')],
            ['line', optWhitespace.then(numberParser).fallback(1)],
            ['file', optWhitespace.then(fileNameParser).fallback('')],
          ),
          // func
          seqObj<AddBreakpointFunction>(
            ['type', string('func')],
            optWhitespace.then(numberParser).fallback(1), // we don't support line numbers in function names, but Vim does, so we'll allow it.
            ['function', optWhitespace.then(regexp(/\S+/))],
          ),
          // expr
          seqObj<AddBreakpointExpr>(['type', string('expr')], ['expr', optWhitespace.then(all)]),
        ),
      )
      .or(
        // without arg
        eof.result<DelBreakpointHere>({ type: 'here' }),
      )
      .map((a) => new AddBreakpointCommand(a)),

    del: whitespace
      .then(
        alt(
          // here
          seqObj<DelBreakpointHere>(['type', string('here')], optWhitespace),
          // file
          seqObj<DelBreakpointFile>(
            ['type', string('file')],
            ['line', optWhitespace.then(numberParser).fallback(1)],
            ['file', optWhitespace.then(fileNameParser).fallback('')],
          ),
          // func
          seqObj<DelBreakpointFunction>(
            ['type', string('func')],
            optWhitespace.then(numberParser).fallback(1), // we don't support line numbers in function names, but Vim does, so we'll allow it.
            ['function', optWhitespace.then(regexp(/\S+/))],
          ),
          // all
          string('*').then(optWhitespace).result<DelAllBreakpoints>({ type: 'all' }),
          // by number
          numberParser.map((n) => ({ type: 'byId', id: n })),
        ),
      )
      .or(
        // without arg
        eof.result<DelBreakpointHere>({ type: 'here' }),
      )
      .map((a) => new DeleteBreakpointCommand(a)),

    list: succeed(new ListBreakpointsCommand()),
  };
}
