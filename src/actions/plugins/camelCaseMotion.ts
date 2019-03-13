import { TextObjectMovement } from '../textobject';
import { RegisterAction } from '../base';
import { ModeName } from '../../mode/mode';
import { Position } from '../../common/motion/position';
import { VimState } from '../../state/vimState';
import { IMovement, BaseMovement } from '../motion';
import { TextEditor } from '../../textEditor';
import { configuration } from '../../configuration/configuration';
import { ChangeOperator } from '../operator';

class CamelCaseBaseMovement extends BaseMovement {
  public doesActionApply(vimState: VimState, keysPressed: string[]) {
    return configuration.camelCaseMotion.enable && super.doesActionApply(vimState, keysPressed);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]) {
    return configuration.camelCaseMotion.enable && super.couldActionApply(vimState, keysPressed);
  }
}

class CamelCaseTextObjectMovement extends TextObjectMovement {
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
      return position.getCurrentCamelCaseWordEnd().getRight();
    } else {
      return position.getCamelCaseWordRight();
    }
  }
}

// based off of `MoveWordEnd`
@RegisterAction
class MoveCamelCaseWordEnd extends CamelCaseBaseMovement {
  keys = ['<leader>', 'e'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getCurrentCamelCaseWordEnd();
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    let end = position.getCurrentCamelCaseWordEnd();

    return new Position(end.line, end.character + 1);
  }
}

// based off of `MoveBeginningWord`
@RegisterAction
class MoveBeginningCamelCaseWord extends CamelCaseBaseMovement {
  keys = ['<leader>', 'b'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getCamelCaseWordLeft();
  }
}

// based off of `SelectInnerWord`
@RegisterAction
export class SelectInnerCamelCaseWord extends CamelCaseTextObjectMovement {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = ['i', '<leader>', 'w'];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;
    const currentChar = TextEditor.getLineAt(position).text[position.character];

    if (/\s/.test(currentChar)) {
      start = position.getLastCamelCaseWordEnd().getRight();
      stop = position.getCamelCaseWordRight().getLeftThroughLineBreaks();
    } else {
      start = position.getCamelCaseWordLeft(true);
      stop = position.getCurrentCamelCaseWordEnd(true);
    }

    if (
      vimState.currentMode === ModeName.Visual &&
      !vimState.cursorStopPosition.isEqual(vimState.cursorStartPosition)
    ) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorStopPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting words in reverser order.
        if (/\s/.test(currentChar)) {
          stop = position.getLastCamelCaseWordEnd().getRight();
        } else {
          stop = position.getCamelCaseWordLeft(true);
        }
      }
    }

    return {
      start: start,
      stop: stop,
    };
  }
}
