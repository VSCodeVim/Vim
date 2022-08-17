import * as vscode from 'vscode';

import { configuration } from '../../configuration/configuration';
import { Mode } from '../../mode/mode';
import { Notation } from '../..//configuration/notation';
import { VimState } from '../../state/vimState';
import { Position } from 'vscode';
import { RegisterAction } from '../base';
import { BaseMovement, IMovement, failedMovement } from '../baseMotion';
import { findHelper, MoveRepeat, MoveRepeatReversed } from '../motion';

/**
 * State of Clever-f
 */
let posF = [-1, -1];
let beforeCleverFAction: string;
let previousMode: Mode;

/**
 * CleverF f command
 */
@RegisterAction
class ActionCleverForwardCommand extends BaseMovement {
  override modes = [Mode.Normal, Mode.Visual];
  keys = ['f'];

  // This command is Not Enabled when vim.clever-F is false.
  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.cleverF && super.doesActionApply(vimState, keysPressed);
  }

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    count ||= 1;
    // The first if-clause states that the current operator is f and also the last operator is f.
    // Next else-if-clause states that the current operator is f-command and the last operator is F.
    // The final else-clause states that the current operator is the initial f.
    if (arrayEqual(posF, [position.line, position.character]) && beforeCleverFAction === 'f') {
      const action = new MoveRepeat([';'], true);
      return action.execActionWithCount(position, vimState, count);
    } else if (
      arrayEqual(posF, [position.line, position.character]) &&
      beforeCleverFAction === 'F'
    ) {
      const action = new MoveRepeatReversed([','], true);
      beforeCleverFAction = 'f';
      return action.execActionWithCount(position, vimState, count);
    } else {
      previousMode = vimState.currentMode;
      await vimState.setCurrentMode(Mode.CleverFForwardMode);
      beforeCleverFAction = 'f';
      return position;
    }
  }
}

/**
 * CleverF F command
 */
@RegisterAction
class ActionCleverFBackwardCommand extends BaseMovement {
  override modes = [Mode.Normal, Mode.Visual];
  keys = ['F'];

  // This command is Not Enabled when vim.clever-F is false.
  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.cleverF && super.doesActionApply(vimState, keysPressed);
  }

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    count ||= 1;
    // The first if-clause states that the current operator is F and also the last operator is F.
    // Next else-if-clause states that the current operator is f-command and the last operator is F.
    // The final else-clause states that the current operator is the initial F.
    if (arrayEqual(posF, [position.line, position.character]) && beforeCleverFAction === 'F') {
      const action = new MoveRepeat([';'], true);
      return action.execActionWithCount(position, vimState, count);
    } else if (
      arrayEqual(posF, [position.line, position.character]) &&
      beforeCleverFAction === 'f'
    ) {
      const action = new MoveRepeatReversed([','], true);
      beforeCleverFAction = 'F';
      return action.execActionWithCount(position, vimState, count);
    } else {
      previousMode = vimState.currentMode;
      await vimState.setCurrentMode(Mode.CleverFBackwardMode);
      beforeCleverFAction = 'F';
      return position;
    }
  }
}

/**
 * Compare Array Elements is Equal
 */
const arrayEqual = (a: number[], b: number[]): boolean => {
  if (!Array.isArray(a)) return false;
  if (!Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0, n = a.length; i < n; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

/**
 *  When change cleverFForwardMode by "f" command, this class is called
 */
@RegisterAction
class MoveCleverFFindForward extends BaseMovement {
  override modes = [Mode.CleverFForwardMode];
  keys = ['<character>'];
  public override async execActionWithCount(
    position: vscode.Position,
    vimState: VimState,
    count: number
  ): Promise<vscode.Position | IMovement> {
    // Reset Mode
    await vimState.setCurrentMode(previousMode);
    if (previousMode === Mode.Visual && !arrayEqual(posF, [position.line, position.character])) {
      if (vimState.lastVisualSelection) {
        vimState.cleverF.startVisualPosition = [
          vimState.lastVisualSelection?.start?.line,
          vimState.lastVisualSelection?.start?.character,
        ];
      } else {
        vimState.cleverF.startVisualPosition = [position.line, position.character];
      }
      vimState.cleverF.isStartVisualForward = true;
    }

    const cleverF = new CleverF();
    cleverF.updateDecorations(position, vimState.editor, this.keysPressed[0]);

    count ||= 1;
    const toFind = Notation.ToControlCharacter(this.keysPressed[0]);
    const result = findHelper(vimState, position, toFind, count, 'forward');

    // To repeat this command
    vimState.lastSemicolonRepeatableMovement = new MoveCleverFFindForward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new MoveCleverFFindBackward(this.keysPressed, true);

    if (!result) {
      return failedMovement(vimState);
    }
    // Mark a position to repeat this command
    posF = [result.line, result.character];
    return result;
  }
}

/**
 *  When change cleverFBackwardMode by "F" command, this class is called
 */
@RegisterAction
class MoveCleverFFindBackward extends BaseMovement {
  override modes = [Mode.CleverFBackwardMode];
  keys = ['<character>'];
  public override async execActionWithCount(
    position: vscode.Position,
    vimState: VimState,
    count: number
  ): Promise<vscode.Position | IMovement> {
    // Reset Mode
    await vimState.setCurrentMode(previousMode);
    if (previousMode === Mode.Visual && !arrayEqual(posF, [position.line, position.character])) {
      if (vimState.lastVisualSelection) {
        vimState.cleverF.startVisualPosition = [
          vimState.lastVisualSelection?.start?.line,
          vimState.lastVisualSelection?.start?.character,
        ];
      } else {
        vimState.cleverF.startVisualPosition = [position.line, position.character];
      }
      vimState.cleverF.isStartVisualBackward = true;
    }

    const cleverF = new CleverF();
    cleverF.updateDecorations(position, vimState.editor, this.keysPressed[0]);

    count ||= 1;
    const toFind = Notation.ToControlCharacter(this.keysPressed[0]);
    const result = findHelper(vimState, position, toFind, count, 'backward');

    // To repeat this command
    vimState.lastSemicolonRepeatableMovement = new MoveCleverFFindBackward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new MoveCleverFFindForward(this.keysPressed, true);

    if (!result) {
      return failedMovement(vimState);
    }
    // Mark a position to repeat this command
    posF = [result.line, result.character];

    return result;
  }
}

export interface ICleverF {
  updateDecorations(position: Position, editor: vscode.TextEditor, character: string): void;
  clearDecorations(editor: vscode.TextEditor): void;
  startVisualPosition: number[];
  isStartVisualForward: boolean;
  isStartVisualBackward: boolean;
}

export class CleverF implements ICleverF {
  private decorations: vscode.DecorationOptions[] = [];
  public startVisualPosition: number[] = [-1, -1];
  public isStartVisualForward: boolean = false;
  public isStartVisualBackward: boolean = false;
  private static readonly decorationType = vscode.window.createTextEditorDecorationType({
    color: 'red',
  });

  constructor() {
    this.decorations = [];
  }
  public updateDecorations(position: Position, editor: vscode.TextEditor, character: string) {
    this.decorations = [];
    const sourceCode = editor.document.getText();
    if (character === '') {
      return;
    }
    const regex = '(' + character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')';
    const sourceCodeArr = sourceCode.split('\n');
    const strArr = sourceCodeArr[position.line].split('');
    for (let chr = 0; chr < strArr.length; chr++) {
      const match = strArr[chr].match(regex);
      if (match !== null && match.index !== undefined) {
        const range = new vscode.Range(
          new vscode.Position(position.line, chr),
          new vscode.Position(position.line, chr + 1)
        );
        const decoration = { range };
        this.decorations.push(decoration);
      }
    }
    editor.setDecorations(CleverF.decorationType, this.decorations);
  }

  public clearDecorations(editor: vscode.TextEditor) {
    editor.setDecorations(CleverF.decorationType, []);
  }
}
