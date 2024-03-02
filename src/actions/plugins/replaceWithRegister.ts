import { configuration } from '../../configuration/configuration';
import { Mode } from '../../mode/mode';
import { Register, RegisterMode } from '../../register/register';
import { VimState } from '../../state/vimState';
import { BaseOperator } from '../operator';
import { RegisterAction } from './../base';
import { StatusBar } from '../../statusBar';
import { VimError, ErrorCode } from '../../error';
import { Position, Range } from 'vscode';
import { PositionDiff } from '../../common/motion/position';

@RegisterAction
class ReplaceOperator extends BaseOperator {
  public keys = ['g', 'r'];
  public modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.replaceWithRegister && super.doesActionApply(vimState, keysPressed);
  }

  public override couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.replaceWithRegister && super.doesActionApply(vimState, keysPressed);
  }

  public async run(vimState: VimState, start: Position, end: Position): Promise<void> {
    const range =
      vimState.currentRegisterMode === RegisterMode.LineWise
        ? new Range(start.getLineBegin(), end.getLineEndIncludingEOL())
        : new Range(start, end.getRight());

    const register = await Register.get(vimState.recordedState.registerName, this.multicursorIndex);
    if (register === undefined) {
      StatusBar.displayError(
        vimState,
        VimError.fromCode(ErrorCode.NothingInRegister, vimState.recordedState.registerName),
      );
      return;
    }

    const replaceWith = register.text as string;

    vimState.recordedState.transformer.addTransformation({
      type: 'replaceText',
      range,
      text: replaceWith,
      diff: PositionDiff.exactPosition(getCursorPosition(vimState, range, replaceWith)),
    });

    await vimState.setCurrentMode(Mode.Normal);
  }
}

const getCursorPosition = (vimState: VimState, range: Range, replaceWith: string): Position => {
  const {
    recordedState: { actionKeys },
  } = vimState;
  const lines = replaceWith.split('\n');
  const wasRunAsLineAction = actionKeys.indexOf('r') === 0 && actionKeys.length === 1; // ie. grr
  const registerAndRangeAreSingleLines = lines.length === 1 && range.isSingleLine;
  const singleLineAction = registerAndRangeAreSingleLines && !wasRunAsLineAction;

  return singleLineAction
    ? cursorAtEndOfReplacement(range, replaceWith)
    : cursorAtFirstNonBlankCharOfLine(range.start.line, lines[0]);
};

const cursorAtEndOfReplacement = (range: Range, replacement: string) =>
  new Position(range.start.line, Math.max(0, range.start.character + replacement.length - 1));

const cursorAtFirstNonBlankCharOfLine = (line: number, text: string) =>
  new Position(line, text.match(/\S/)?.index ?? 0);
