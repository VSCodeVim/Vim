import { TextObjectMovement } from '../../textobject/textobject';
import { RegisterAction } from '../base';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { IMovement, BaseMovement } from '../baseMotion';
import { TextEditor } from '../../textEditor';
import { configuration } from '../../configuration/configuration';
import { ChangeOperator } from '../operator';
import {
  getCurrentWordEnd,
  getLastWordEnd,
  getWordLeft,
  getWordRight,
  WordType,
} from '../../textobject/word';
import { Position } from 'vscode';

abstract class CamelCaseBaseMovement extends BaseMovement {
  public doesActionApply(vimState: VimState, keysPressed: string[]) {
    return configuration.camelCaseMotion.enable && super.doesActionApply(vimState, keysPressed);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]) {
    return configuration.camelCaseMotion.enable && super.couldActionApply(vimState, keysPressed);
  }
}

abstract class CamelCaseTextObjectMovement extends TextObjectMovement {
  public doesActionApply(vimState: VimState, keysPressed: string[]) {
    return configuration.camelCaseMotion.enable && super.doesActionApply(vimState, keysPressed);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]) {
    return configuration.camelCaseMotion.enable && super.couldActionApply(vimState, keysPressed);
  }
}

// based off of `MoveWordBegin`
@RegisterAction
class MoveCamelCaseWordBegin extends CamelCaseBaseMovement {
  keys = ['<leader>', 'w'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    if (
      !configuration.changeWordIncludesWhitespace &&
      vimState.recordedState.operator instanceof ChangeOperator
    ) {
      // TODO use execForOperator? Or maybe dont?

      // See note for w
      return getCurrentWordEnd(position, WordType.CamelCase).getRight();
    } else {
      return getWordRight(position, WordType.CamelCase);
    }
  }
}

// based off of `MoveWordEnd`
@RegisterAction
class MoveCamelCaseWordEnd extends CamelCaseBaseMovement {
  keys = ['<leader>', 'e'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return getCurrentWordEnd(position, WordType.CamelCase);
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    let end = getCurrentWordEnd(position, WordType.CamelCase);

    return new Position(end.line, end.character + 1);
  }
}

// based off of `MoveBeginningWord`
@RegisterAction
class MoveBeginningCamelCaseWord extends CamelCaseBaseMovement {
  keys = ['<leader>', 'b'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return getWordLeft(position, WordType.CamelCase);
  }
}

// based off of `SelectInnerWord`
@RegisterAction
class SelectInnerCamelCaseWord extends CamelCaseTextObjectMovement {
  modes = [Mode.Normal, Mode.Visual];
  keys = ['i', '<leader>', 'w'];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;
    const currentChar = vimState.document.lineAt(position).text[position.character];

    if (/\s/.test(currentChar)) {
      start = getLastWordEnd(position, WordType.CamelCase).getRight();
      stop = getWordRight(position, WordType.CamelCase).getLeftThroughLineBreaks();
    } else {
      start = getWordLeft(position, WordType.CamelCase, true);
      stop = getCurrentWordEnd(position, WordType.CamelCase, true);
    }

    if (
      vimState.currentMode === Mode.Visual &&
      !vimState.cursorStopPosition.isEqual(vimState.cursorStartPosition)
    ) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorStopPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting words in reverser order.
        if (/\s/.test(currentChar)) {
          stop = getLastWordEnd(position, WordType.CamelCase).getRight();
        } else {
          stop = getWordLeft(position, WordType.CamelCase, true);
        }
      }
    }

    return {
      start: start,
      stop: stop,
    };
  }
}
