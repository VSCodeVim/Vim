import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';
import { Configuration } from './../../configuration/configuration';
import { ModeName } from './../../mode/mode';
import { RegisterAction } from './../base';
import { BaseCommand } from './../commands/actions';
import { Position } from '../../common/motion/position';
import { IMovement, BaseMovement, createRepeatMovement } from '../motion';

@RegisterAction
class SneakForward extends BaseMovement {
  keys = [['s', '<character>', '<character>'], ['z', '<character>', '<character>']];
  isRepeat = false;

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const startingLetter = vimState.recordedState.operator === undefined ? 's' : 'z';

    return (
      super.couldActionApply(vimState, keysPressed) &&
      Configuration.sneak &&
      keysPressed[0] === startingLetter
    );
  }

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    if (!this.isRepeat) {
      VimState.lastSemicolonRepeatableMovement = createRepeatMovement(
        new SneakForward(),
        this.keysPressed
      );
      VimState.lastCommaRepeatableMovement = createRepeatMovement(
        new SneakBackward(),
        this.keysPressed
      );
    }

    const editor = vscode.window.activeTextEditor!;
    const document = editor.document;
    const lineCount = document.lineCount;
    const searchString = this.keysPressed[1] + this.keysPressed[2];

    for (let i = position.line; i < lineCount; ++i) {
      const lineText = document.lineAt(i).text;

      // Start searching after the current character so we don't find the same match twice
      const fromIndex = i === position.line ? position.character + 1 : 0;

      const matchIndex = lineText.indexOf(searchString, fromIndex);

      if (matchIndex >= 0) {
        return new Position(i, matchIndex);
      }
    }

    return position;
  }
}

@RegisterAction
class SneakBackward extends BaseMovement {
  keys = [['S', '<character>', '<character>'], ['Z', '<character>', '<character>']];
  isRepeat = false;

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const startingLetter = vimState.recordedState.operator === undefined ? 'S' : 'Z';

    return (
      super.couldActionApply(vimState, keysPressed) &&
      Configuration.sneak &&
      keysPressed[0] === startingLetter
    );
  }

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    if (!this.isRepeat) {
      VimState.lastSemicolonRepeatableMovement = createRepeatMovement(
        new SneakBackward(),
        this.keysPressed
      );
      VimState.lastCommaRepeatableMovement = createRepeatMovement(
        new SneakForward(),
        this.keysPressed
      );
    }

    const editor = vscode.window.activeTextEditor!;
    const document = editor.document;
    const searchString = this.keysPressed[1] + this.keysPressed[2];

    for (let i = position.line; i >= 0; --i) {
      const lineText = document.lineAt(i).text;

      // Start searching before the current character so we don't find the same match twice
      const fromIndex = i === position.line ? position.character - 1 : +Infinity;

      const matchIndex = lineText.lastIndexOf(searchString, fromIndex);

      if (matchIndex >= 0) {
        return new Position(i, matchIndex);
      }
    }

    return position;
  }
}
