import { VimState } from '../../state/vimState';
import { configuration } from './../../configuration/configuration';
import { RegisterAction } from './../base';
import { BaseMovement, IMovement } from '../baseMotion';
import { Position } from 'vscode';

@RegisterAction
export class SneakForward extends BaseMovement {
  keys = [
    ['s', '<character>', '<character>'],
    ['z', '<character>', '<character>'],
  ];
  override isJump = true;

  public override couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const startingLetter = vimState.recordedState.operator === undefined ? 's' : 'z';

    return (
      configuration.sneak &&
      super.couldActionApply(vimState, keysPressed) &&
      keysPressed[0] === startingLetter
    );
  }

  public override async execAction(
    position: Position,
    vimState: VimState,
  ): Promise<Position | IMovement> {
    if (!this.isRepeat) {
      vimState.lastSemicolonRepeatableMovement = new SneakForward(this.keysPressed, true);
      vimState.lastCommaRepeatableMovement = new SneakBackward(this.keysPressed, true);
    }

    if (this.keysPressed[2] === '\n') {
      // Single key sneak
      this.keysPressed[2] = '';
    }

    const searchString = this.keysPressed[1] + this.keysPressed[2];

    const document = vimState.document;
    const lineCount = document.lineCount;
    for (let i = position.line; i < lineCount; ++i) {
      const lineText = document.lineAt(i).text;

      // Start searching after the current character so we don't find the same match twice
      const fromIndex = i === position.line ? position.character + 1 : 0;

      let matchIndex = -1;

      const ignorecase =
        configuration.sneakUseIgnorecaseAndSmartcase &&
        configuration.ignorecase &&
        !(configuration.smartcase && /[A-Z]/.test(searchString));

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
export class SneakBackward extends BaseMovement {
  keys = [
    ['S', '<character>', '<character>'],
    ['Z', '<character>', '<character>'],
  ];
  override isJump = true;

  public override couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const startingLetter = vimState.recordedState.operator === undefined ? 'S' : 'Z';

    return (
      configuration.sneak &&
      super.couldActionApply(vimState, keysPressed) &&
      keysPressed[0] === startingLetter
    );
  }

  public override async execAction(
    position: Position,
    vimState: VimState,
  ): Promise<Position | IMovement> {
    if (!this.isRepeat) {
      vimState.lastSemicolonRepeatableMovement = new SneakBackward(this.keysPressed, true);
      vimState.lastCommaRepeatableMovement = new SneakForward(this.keysPressed, true);
    }

    if (this.keysPressed[2] === '\n') {
      // Single key sneak
      this.keysPressed[2] = '';
    }

    const searchString = this.keysPressed[1] + this.keysPressed[2];

    const document = vimState.document;
    for (let i = position.line; i >= 0; --i) {
      const lineText = document.lineAt(i).text;

      // Start searching before the current character so we don't find the same match twice
      const fromIndex = i === position.line ? position.character - 1 : +Infinity;

      let matchIndex = -1;

      const ignorecase =
        configuration.sneakUseIgnorecaseAndSmartcase &&
        configuration.ignorecase &&
        !(configuration.smartcase && /[A-Z]/.test(searchString));

      // Check for matches
      if (ignorecase) {
        matchIndex = lineText
          .toLocaleLowerCase()
          .lastIndexOf(searchString.toLocaleLowerCase(), fromIndex);
      } else {
        matchIndex = lineText.lastIndexOf(searchString, fromIndex);
      }

      if (matchIndex >= 0) {
        return new Position(i, matchIndex);
      }
    }

    return position;
  }
}
