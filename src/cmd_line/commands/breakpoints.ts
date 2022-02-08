import * as vscode from 'vscode';
import * as path from 'path';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { all, alt, eof, optWhitespace, regexp, seqObj, string, succeed, whitespace } from 'parsimmon';
import { numberParser } from '../../vimscript/parserUtils';

function isSourceBreakpoint(b: any): b is vscode.SourceBreakpoint {
  return (b as vscode.SourceBreakpoint).location !== undefined;
}
function isFunctionBreakpoint(b: any): b is vscode.FunctionBreakpoint {
  return (b as vscode.FunctionBreakpoint).functionName !== undefined;
}

/**
 * Add Breakpoint Command
 */
type AddBreakpointExpr = { expr: string };
type AddBreakpointFunction = { function: string };
type AddBreakpointFile = { line: number; file: string };
type AddBreakpointHere = 'here';
type AddBreakpoint =
  | AddBreakpointHere
  | AddBreakpointFile
  | AddBreakpointFunction
  | AddBreakpointExpr;

function isAddBreakpointHere(arg: any): arg is AddBreakpointHere {
  return arg === 'here';
}
function isAddBreakpointFile(arg: any): arg is AddBreakpointFile {
  return arg.file !== undefined && arg.line !== undefined;
}
function isAddBreakpointFunction(arg: any): arg is AddBreakpointFunction {
  return arg.function !== undefined;
}
function isExprBreakpoint(arg: any): arg is AddBreakpointExpr {
  return arg.expr !== undefined;
}

class AddBreakpointCommand extends ExCommand {
  public override isRepeatableWithDot: boolean = false;
  private readonly addBreakpoint: AddBreakpoint;

  constructor(addBreakpoint: AddBreakpoint) {
    super();
    this.addBreakpoint = addBreakpoint;
  }

  async execute(vimState: VimState): Promise<void> {
    if (isAddBreakpointHere(this.addBreakpoint)) {
      const location = new vscode.Location(vimState.document.uri, vimState.cursorStartPosition);
      return vscode.debug.addBreakpoints([new vscode.SourceBreakpoint(location)]);
    } else if (isAddBreakpointFile(this.addBreakpoint)) {
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
        new vscode.Position(this.addBreakpoint.line - 1, 0)
      );
      return vscode.debug.addBreakpoints([new vscode.SourceBreakpoint(location)]);
    } else if (isAddBreakpointFunction(this.addBreakpoint)) {
      return vscode.debug.addBreakpoints([
        new vscode.FunctionBreakpoint(this.addBreakpoint.function),
      ]);
    } else if (isExprBreakpoint(this.addBreakpoint)) {
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
type DelBreakpointById = { id: number };
type DelAllBreakpoints = 'all';
type DelBreakpointFunction = { function: string };
type DelBreakpointFile = { line: number; file: string };
type DelBreakpointHere = 'here';
type DelBreakpoint =
  | DelBreakpointById
  | DelAllBreakpoints
  | DelBreakpointFunction
  | DelBreakpointFile
  | DelBreakpointHere;

function isDelBreakpointById(arg: any): arg is DelBreakpointById {
  return arg.id !== undefined;
}
function isDelAllBreakpoints(arg: any): arg is DelAllBreakpoints {
  return arg === 'all';
}
function isDelBreakpointFunction(arg: any): arg is DelBreakpointFunction {
  return arg.function !== undefined;
}
function isDelBreakpointFile(arg: any): arg is DelBreakpointFile {
  return arg.file !== undefined && arg.line !== undefined;
}
function isDelBreakpointHere(arg: any): arg is DelBreakpointHere {
  return arg === 'here';
}

class DeleteBreakpointCommand extends ExCommand {
  public override isRepeatableWithDot: boolean = false;
  private readonly delBreakpoint: DelBreakpoint;

  constructor(delBreakpoint: DelBreakpoint) {
    super();
    this.delBreakpoint = delBreakpoint;
  }

  async execute(vimState: VimState): Promise<void> {
    if (isDelBreakpointById(this.delBreakpoint)) {
      return vscode.debug.removeBreakpoints(
        vscode.debug.breakpoints.splice(this.delBreakpoint.id - 1, 1)
      );
    } else if (isDelAllBreakpoints(this.delBreakpoint)) {
      return vscode.debug.removeBreakpoints(vscode.debug.breakpoints);
    } else if (isDelBreakpointFile(this.delBreakpoint)) {
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
            b.location.range.start.line === reqLine
        );
      if (breakpoint) return vscode.debug.removeBreakpoints([breakpoint]);
    } else if (isDelBreakpointFunction(this.delBreakpoint)) {
      const functionName = this.delBreakpoint.function;
      const breakpoint = vscode.debug.breakpoints
        .filter(isFunctionBreakpoint)
        .filter((b) => b.functionName === functionName);
      if (breakpoint) return vscode.debug.removeBreakpoints(breakpoint);
    } else if (isDelBreakpointHere(this.delBreakpoint)) {
      const location = new vscode.Location(vimState.document.uri, vimState.cursorStartPosition);
      const distFromLocationCharacter = (b: vscode.SourceBreakpoint) => Math.abs(b.location.range.start.character - location.range.start.character);

      const breakpoint = vscode.debug.breakpoints
        .filter(isSourceBreakpoint)
        .filter(
          (b) =>
            b.location.uri.toString() === location.uri.toString() &&
            b.location.range.start.line === location.range.start.line
        ).sort((a, b) => distFromLocationCharacter(a) - distFromLocationCharacter(b))[0];
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
    type AnyBreakpoint = vscode.Breakpoint & vscode.SourceBreakpoint & vscode.FunctionBreakpoint;
    const breakpoints = vscode.debug.breakpoints;
    const lines = breakpoints.map((b, i) => {
      const {
        enabled,
        condition,
        location,
        functionName,
      } = b as AnyBreakpoint;
      let line = '';
      line += `#${i + 1}\t`;
      line += enabled ? '$(circle-filled)\t' : '$(circle-outline)\t';
      line += condition ? '$(debug-breakpoint-conditional)\t' : '\t';
      line += location ? `${path.basename(location.uri.fsPath)}:${location.range.start.line}` : '';
      line += functionName ? `$(debug-breakpoint-function)${functionName}` : '';
      return line;
    });
    return vscode.window.showQuickPick(lines).then((selected) => {
      if (selected) {
        const [idWithHashtag] = selected.split('\t');
        const id = parseInt(idWithHashtag.replace('#', ''), 10) - 1;
        const breakpoint = breakpoints[id] as AnyBreakpoint;
        if (breakpoint && breakpoint.location !== undefined) {
          return vscode.window.showTextDocument(breakpoint.location.uri).then(
            () => {
              vimState.cursorStartPosition = breakpoint.location.range.start;
            },
          );
        } else {
          return;
        }
      } else {
        return;
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
          string('here').then(optWhitespace).result<DelBreakpointHere>('here'),
          // file
          seqObj<AddBreakpointFile>(
            string('file'),
            ['line', optWhitespace.then(numberParser).fallback(1)],
            ['file', optWhitespace.then(regexp(/\S+/)).fallback('')]
          ),
          // func
          seqObj<AddBreakpointFunction>(
            string('func'),
            optWhitespace.then(numberParser).fallback(1), // we don't support line numbers in function names, but Vim does, so we'll allow it.
            ['function', optWhitespace.then(regexp(/\S+/))]
          ),
          // expr
          seqObj<AddBreakpointExpr>(string('expr'), ['expr', optWhitespace.then(all)]),
        )
      ).or(
        // without arg
        eof.result<DelBreakpointHere>('here')
      )
      .map((a) => new AddBreakpointCommand(a)),

    del: whitespace
      .then(
        alt(
          // here
          string('here').then(optWhitespace).result<DelBreakpointHere>('here'),
          // file
          seqObj<DelBreakpointFile>(
            string('file'),
            ['line', optWhitespace.then(numberParser).fallback(1)],
            ['file', optWhitespace.then(regexp(/\S+/)).fallback('')]
          ),
          // func
          seqObj<DelBreakpointFunction>(
            string('func'),
            optWhitespace.then(numberParser).fallback(1), // we don't support line numbers in function names, but Vim does, so we'll allow it.
            ['function', optWhitespace.then(regexp(/\S+/))]
          ),
          // all
          string('*').then(optWhitespace).result<DelAllBreakpoints>('all'),
          // by number
          numberParser.map((n) => ({ id: n })),
        )
      ).or(
        // without arg
        eof.result<DelBreakpointHere>('here')
      )
      .map((a) => new DeleteBreakpointCommand(a)),

    list: succeed(new ListBreakpointsCommand()),
  };
}
