import * as vscode from 'vscode';
import { Position } from '../../common/motion/position';
import { configuration } from '../../configuration/configuration';
import { ModeName } from '../../mode/mode';
import { Register, RegisterMode } from '../../register/register';
import { VimState } from '../../state/vimState';
import { TextEditor } from '../../textEditor';
import { BaseOperator } from '../operator';
import { RegisterAction } from './../base';

@RegisterAction
export class ReplaceOperator extends BaseOperator {
  public keys = ['g', 'r'];
  public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.replaceWithRegister && super.doesActionApply(vimState, keysPressed);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.replaceWithRegister && super.doesActionApply(vimState, keysPressed);
  }

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    const range =
      vimState.currentRegisterMode === RegisterMode.LineWise
        ? new vscode.Range(start.getLineBegin(), end.getLineEndIncludingEOL())
        : new vscode.Range(start, end.getRight());
    const register = await Register.get(vimState);
    const replaceWith = register.text as string;

    await TextEditor.replace(range, replaceWith);
    await vimState.setCurrentMode(ModeName.Normal);
    return updateCursorPosition(vimState, range, replaceWith);
  }
}

const updateCursorPosition = (
  vimState: VimState,
  range: vscode.Range,
  replaceWith: string
): VimState => {
  const {
    recordedState: { actionKeys },
  } = vimState;
  const lines = replaceWith.split('\n');
  const wasRunAsLineAction = actionKeys.indexOf('r') === 0 && actionKeys.length === 1; // ie. grr
  const registerAndRangeAreSingleLines = lines.length === 1 && range.isSingleLine;
  const singleLineAction = registerAndRangeAreSingleLines && !wasRunAsLineAction;

  const cursorPosition = singleLineAction
    ? cursorAtEndOfReplacement(range, replaceWith)
    : cursorAtFirstNonBlankCharOfLine(range);

  return vimStateWithCursorPosition(vimState, cursorPosition);
};

const cursorAtEndOfReplacement = (range: vscode.Range, replacement: string) =>
  new Position(range.start.line, Math.max(0, range.start.character + replacement.length - 1));

const cursorAtFirstNonBlankCharOfLine = (range: vscode.Range) =>
  new Position(range.start.line, 0).getFirstLineNonBlankChar();

const vimStateWithCursorPosition = (vimState: VimState, cursorPosition: Position): VimState => {
  vimState.cursorStopPosition = cursorPosition;
  vimState.cursorStartPosition = cursorPosition;

  return vimState;
};
