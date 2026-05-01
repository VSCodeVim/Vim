import * as vscode from 'vscode';
// eslint-disable-next-line id-denylist
import { Parser, alt, any, optWhitespace, seq, whitespace } from 'parsimmon';
import { Position } from 'vscode';
import { Mode } from '../../mode/mode';
import { Register, RegisterMode } from '../../register/register';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';
import { numberParser } from '../../vimscript/parserUtils';

export interface IChangeCommandArguments {
  register?: string;
  count?: number;
}

export class ChangeCommand extends ExCommand {
  public static readonly argParser: Parser<ChangeCommand> = optWhitespace.then(
    alt(
      numberParser.map((count) => {
        return { register: undefined, count };
      }),
      // eslint-disable-next-line id-denylist
      seq(any.fallback(undefined), whitespace.then(numberParser).fallback(undefined)).map(
        ([register, count]) => {
          return { register, count };
        },
      ),
    ).map(
      ({ register, count }) =>
        new ChangeCommand({
          register,
          count,
        }),
    ),
  );

  private readonly arguments: IChangeCommandArguments;
  constructor(args: IChangeCommandArguments) {
    super();
    this.arguments = args;
  }

  public override neovimCapable(): boolean {
    return true;
  }

  /**
   * Deletes text between `startLine` and `endLine`, inclusive.
   * Puts the cursor at the start of the line where the deleted range was
   * Then enters insert mode
   */
  private changeRange(startLine: number, endLine: number, vimState: VimState): void {
    const start = new Position(startLine, 0);
    const end = new Position(endLine + 1, 0);

    const range = new vscode.Range(start, end);
    const text = vimState.document.getText(range);

    vimState.recordedState.transformer.addTransformation({
      type: 'replaceText',
      text: '\n',
      range,
      manuallySetCursorPositions: true,
    });
    vimState.cursorStopPosition = start;

    if (this.arguments.register) {
      vimState.recordedState.registerName = this.arguments.register;
    }
    vimState.currentRegisterMode = RegisterMode.LineWise;
    Register.put(vimState, text, 0, true);
  }

  async execute(vimState: VimState): Promise<void> {
    const linesToRemove = this.arguments.count ?? 1;
    // :c[hange][cnt] changes [cnt] lines
    const startLine = vimState.cursorStartPosition.line;
    const endLine = startLine + (linesToRemove - 1);
    this.changeRange(startLine, endLine, vimState);

    // Enter insert mode
    await vimState.setCurrentMode(Mode.Insert);
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    /**
     * If a [cnt] and [range] is specified (e.g. :.+2c3), :change
     * the end of the [range].
     * Ex. if two lines are VisualLine hightlighted, :<,>c3 will :c3
     * from the end of the selected lines
     */
    const { start, end } = range.resolve(vimState);
    if (this.arguments.count) {
      vimState.cursorStartPosition = new Position(end, 0);
      await this.execute(vimState);
      return;
    }
    this.changeRange(start, end, vimState);
    // Enter insert mode
    await vimState.setCurrentMode(Mode.Insert);
  }
}
