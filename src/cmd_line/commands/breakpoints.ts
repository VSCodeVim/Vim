import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { all, alt, optWhitespace, regexp, seqObj, string, whitespace } from 'parsimmon';
import { numberParser } from '../../vimscript/parserUtils';
import { LineRange } from '../../vimscript/lineRange';

type AddBreakpointExpr = { expr: string };
type AddBreakpointFunction = { line: number, function: string }
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
        ['line', optWhitespace.then(numberParser).fallback(1)],
        ['function', optWhitespace.then(regexp(/\S+/))],
      ),
      // expr
      seqObj<AddBreakpointExpr>(
        string('expr'),
        ['expr', optWhitespace.then(all)],
      ),
    )).map(a => new AddBreakpointCommand(a))
  }

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