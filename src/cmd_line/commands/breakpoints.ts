import * as vscode from 'vscode';
import * as path from 'path';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { all, alt, optWhitespace, regexp, seqObj, string, succeed, whitespace } from 'parsimmon';
import { numberParser } from '../../vimscript/parserUtils';
import { LineRange } from '../../vimscript/lineRange';

/**
 * Add Breakpoint Command
 */
type AddBreakpointExpr = { expr: string };
type AddBreakpointFunction = { function: string }
type AddBreakpointFile = { line: number, file: string }
type AddBreakpoint = 'here' | AddBreakpointFile | AddBreakpointFunction | AddBreakpointExpr;

function isFileBreakpoint(arg: any): arg is AddBreakpointFile {
  return arg.file !== undefined && arg.line !== undefined;
}
function isFunctionBreakpoint(arg: any): arg is AddBreakpointFunction {
  return arg.function !== undefined && arg.line !== undefined;
}
function isExprBreakpoint(arg: any): arg is AddBreakpointExpr {
  return arg.expr !== undefined;
}

class AddBreakpointCommand implements ExCommand {
  constructor(private readonly addBreakpoint: AddBreakpoint) { }

  public neovimCapable(): boolean {
    throw new Error('Method not implemented.');
  }

  public isRepeatableWithDot: boolean = false;

  async execute(vimState: VimState): Promise<void> {
    if (this.addBreakpoint === 'here') {
      const location = new vscode.Location(vimState.document.uri, vimState.cursorStartPosition)
      return vscode.debug.addBreakpoints([new vscode.SourceBreakpoint(location)]);

    } else if (isFileBreakpoint(this.addBreakpoint)) {
      let file: vscode.Uri;
      if (this.addBreakpoint.file === '') {
        file = vimState.document.uri
      } else {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vimState.document.uri)?.uri ?? vscode.Uri.file("./");
        file = vscode.Uri.joinPath(workspaceFolder, this.addBreakpoint.file);
      }
      const location = new vscode.Location(file, new vscode.Position(this.addBreakpoint.line - 1, 0));
      return vscode.debug.addBreakpoints([new vscode.SourceBreakpoint(location)]);

    } else if (isFunctionBreakpoint(this.addBreakpoint)) {
      return vscode.debug.addBreakpoints([new vscode.FunctionBreakpoint(this.addBreakpoint.function)]);

    } else if (isExprBreakpoint(this.addBreakpoint)) {
      const location = new vscode.Location(vimState.document.uri, vimState.cursorStartPosition)
      return vscode.debug.addBreakpoints([new vscode.SourceBreakpoint(location, undefined, this.addBreakpoint.expr)]);
    }

    // breakadd file 1 src/extension.ts
    // breakadd func 1 activate
    // breakadd expr i == 1
  }

  executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

/**
 * Delete Breakpoint Command
 */
type DelBreakpointById = { id: number };
type DelAllBreakpoints = 'all';
type DelBreakpointFunction = { function: string };
type DelBreakpointFile = { line: number, file: string };
type DelBreakpointHere = 'here';
type DelBreakpoint = DelBreakpointById | DelAllBreakpoints | DelBreakpointFunction | DelBreakpointFile | DelBreakpointHere;

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

class DeleteBreakpointCommand implements ExCommand {
  constructor(private readonly delBreakpoint: DelBreakpoint) { }
  public neovimCapable(): boolean {
    throw new Error('Method not implemented.');
  }
  public isRepeatableWithDot: boolean = false;
  async execute(vimState: VimState): Promise<void> {
    if (isDelBreakpointById(this.delBreakpoint)) {
      return vscode.debug.removeBreakpoints(vscode.debug.breakpoints.splice(this.delBreakpoint.id - 1, 1));
    }
  }
  executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    throw new Error('Method not implemented.');
  }

}


/**
 * List Breakpoints Command
 */
class ListBreakpointsCommand implements ExCommand {
  constructor() { }
  public neovimCapable(): boolean {
    throw new Error('Method not implemented.');
  }
  public isRepeatableWithDot: boolean = false;

  async execute(vimState: VimState): Promise<void> {
    type AnyBreakpoint = vscode.Breakpoint & vscode.SourceBreakpoint & vscode.FunctionBreakpoint;
    const breakpoints = vscode.debug.breakpoints;
    const lines = breakpoints.map((b, i) => {
      const { enabled, condition, location = undefined, functionName = undefined
      } = b as AnyBreakpoint;
      let line = "";
      line += `#${i + 1}\t`;
      line += enabled ? "$(circle-filled)\t" : "$(circle-outline)\t";
      line += condition ? "$(debug-breakpoint-conditional)\t" : "\t";
      line += location ? `${path.basename(location.uri.fsPath)}:${location.range.start.line}` : "";
      line += functionName ? `$(debug-breakpoint-function)${functionName}` : "";
      return line;
    });
    return vscode.window.showQuickPick(lines).then((selected) => {
      if (selected) {
        const [idWithHashtag] = selected.split('\t');
        const id = parseInt(idWithHashtag.replace('#', '')) - 1;
        const breakpoint = breakpoints[id] as AnyBreakpoint;
        if (breakpoint && breakpoint.location !== undefined) {
          return vscode.window.showTextDocument(breakpoint.location.uri, {
            selection: new vscode.Range(breakpoint.location.range.start, breakpoint.location.range.end),
          }).then();

        } else {
          return;
        }
      } else {
        return;
      }
    }
    );

  }
  executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    throw new Error('Method not implemented.');
  }

}

export class Breakpoints {

  public static readonly argParsers = {
    add: whitespace.then(alt(
      // here
      string('here').then(optWhitespace).result<'here'>('here'),
      // file
      seqObj<AddBreakpointFile>(
        string('file'),
        ['line', optWhitespace.then(numberParser).fallback(1)],
        ['file', optWhitespace.then(regexp(/\S+/)).fallback("")],
      ),
      // func
      seqObj<AddBreakpointFunction>(
        string('func'),
        optWhitespace.then(numberParser).fallback(1),  // we don't support line numbers in function names, but Vim does, so we'll allow it.
        ['function', optWhitespace.then(regexp(/\S+/))],
      ),
      // expr
      seqObj<AddBreakpointExpr>(
        string('expr'),
        ['expr', optWhitespace.then(all)],
      ),
    )).map(a => new AddBreakpointCommand(a)),

    del: whitespace.then(alt(
      // here
      string('here').then(optWhitespace).result<'here'>('here'),
      // file
      seqObj<DelBreakpointFile>(
        string('file'),
        ['line', optWhitespace.then(numberParser).fallback(1)],
        ['file', optWhitespace.then(regexp(/\S+/)).fallback("")],
      ),
      // func
      seqObj<DelBreakpointFunction>(
        string('func'),
        optWhitespace.then(numberParser).fallback(1),  // we don't support line numbers in function names, but Vim does, so we'll allow it.
        ['function', optWhitespace.then(regexp(/\S+/))],
      ),
      // all
      string('*').then(optWhitespace).result<'all'>('all'),
      // by number
      numberParser.map(n => ({ id: n }))
    )).map(a => new DeleteBreakpointCommand(a)),

    list: succeed(new ListBreakpointsCommand()),
  }

}
