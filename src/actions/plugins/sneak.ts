import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';
import { configuration } from './../../configuration/configuration';
import { ModeName } from './../../mode/mode';
import { RegisterAction } from './../base';
import { BaseCommand } from './../commands/actions';
import { Position } from '../../common/motion/position';
import { IMovement, BaseMovement } from '../motion';

@RegisterAction
class SneakForward extends BaseMovement {
  keys = [['s', '<character>', '<character>'], ['z', '<character>', '<character>']];

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const startingLetter = vimState.recordedState.operator === undefined ? 's' : 'z';

    return (
      configuration.sneak &&
      super.couldActionApply(vimState, keysPressed) &&
      keysPressed[0] === startingLetter
    );
  }

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    if (!this.isRepeat) {
      VimState.lastSemicolonRepeatableMovement = new SneakForward(this.keysPressed, true);
      VimState.lastCommaRepeatableMovement = new SneakBackward(this.keysPressed, true);
    }

    const editor = vscode.window.activeTextEditor!;
    const document = editor.document;
    const lineCount = document.lineCount;
    const searchString = this.keysPressed[1] + this.keysPressed[2];

    for (let i = position.line; i < lineCount; ++i) {
      const lineText = document.lineAt(i).text;

      // Start searching after the current character so we don't find the same match twice
      const fromIndex = i === position.line ? position.character + 1 : 0;

      let matchIndex = -1;

      const ignorecase =
        configuration.sneakUseIgnorecaseAndSmartcase &&
        (configuration.ignorecase && !(configuration.smartcase && /[A-Z]/.test(searchString)));

      // Check for matches
      if (ignorecase) {
        matchIndex = lineText
          .toLocaleLowerCase()
          .indexOf(searchString.toLocaleLowerCase(), fromIndex);
      } else {
        matchIndex = lineText.indexOf(searchString, fromIndex);
      }

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

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const startingLetter = vimState.recordedState.operator === undefined ? 'S' : 'Z';

    return (
      configuration.sneak &&
      super.couldActionApply(vimState, keysPressed) &&
      keysPressed[0] === startingLetter
    );
  }

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    if (!this.isRepeat) {
      VimState.lastSemicolonRepeatableMovement = new SneakBackward(this.keysPressed, true);
      VimState.lastCommaRepeatableMovement = new SneakForward(this.keysPressed, true);
    }

    const editor = vscode.window.activeTextEditor!;
    const document = editor.document;
    const searchString = this.keysPressed[1] + this.keysPressed[2];

    for (let i = position.line; i >= 0; --i) {
      const lineText = document.lineAt(i).text;

      // Start searching before the current character so we don't find the same match twice
      const fromIndex = i === position.line ? position.character - 1 : +Infinity;

      let matchIndex = -1;

      const ignorecase =
        configuration.sneakUseIgnorecaseAndSmartcase &&
        (configuration.ignorecase && !(configuration.smartcase && /[A-Z]/.test(searchString)));

      // Check for matches
      if (ignorecase) {
        matchIndex = lineText
          .toLocaleLowerCase()
          .indexOf(searchString.toLocaleLowerCase(), fromIndex);
      } else {
        matchIndex = lineText.indexOf(searchString, fromIndex);
      }

      if (matchIndex >= 0) {
        return new Position(i, matchIndex);
      }
    }

    return position;
  }
}
