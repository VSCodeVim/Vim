import * as vscode from 'vscode';
import { configuration } from '../../configuration/configuration';
import { Mode } from '../../mode/mode';
import { Register, RegisterMode } from '../../register/register';
import { VimState } from '../../state/vimState';
import { TextEditor } from '../../textEditor';
import { BaseOperator } from '../operator';
import { RegisterAction } from './../base';
import { StatusBar } from '../../statusBar';
import { VimError, ErrorCode } from '../../error';
import { Position, TextDocument } from 'vscode';

@RegisterAction
class ReplaceOperator extends BaseOperator {
  public keys = ['g', 'r'];
  public modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.replaceWithRegister && super.doesActionApply(vimState, keysPressed);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.replaceWithRegister && super.doesActionApply(vimState, keysPressed);
  }

  public async run(vimState: VimState, start: Position, end: Position): Promise<void> {
    const range =
      vimState.currentRegisterMode === RegisterMode.LineWise
        ? new vscode.Range(start.getLineBegin(), end.getLineEndIncludingEOL())
        : new vscode.Range(start, end.getRight());
    const register = await Register.get(vimState);
    if (register === undefined) {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.NothingInRegister));
      return;
    }

    const replaceWith = register.text as string;
    await TextEditor.replace(vimState.editor, range, replaceWith);
    await vimState.setCurrentMode(Mode.Normal);
    updateCursorPosition(vimState, range, replaceWith);
  }
}

const updateCursorPosition = (
  vimState: VimState,
  range: vscode.Range,
  replaceWith: string
): void => {
  const {
    recordedState: { actionKeys },
  } = vimState;
  const lines = replaceWith.split('\n');
  const wasRunAsLineAction = actionKeys.indexOf('r') === 0 && actionKeys.length === 1; // ie. grr
  const registerAndRangeAreSingleLines = lines.length === 1 && range.isSingleLine;
  const singleLineAction = registerAndRangeAreSingleLines && !wasRunAsLineAction;

  const cursorPosition = singleLineAction
    ? cursorAtEndOfReplacement(range, replaceWith)
    : cursorAtFirstNonBlankCharOfLine(vimState.document, range);

  vimState.cursorStopPosition = cursorPosition;
  vimState.cursorStartPosition = cursorPosition;
};

const cursorAtEndOfReplacement = (range: vscode.Range, replacement: string) =>
  new Position(range.start.line, Math.max(0, range.start.character + replacement.length - 1));

const cursorAtFirstNonBlankCharOfLine = (document: TextDocument, range: vscode.Range) =>
  TextEditor.getFirstNonWhitespaceCharOnLine(document, range.start.line);
