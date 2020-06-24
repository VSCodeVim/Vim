import { TextObjectMovement } from '../textobject';
import { RegisterAction, BasePluginAction, RegisterPluginAction } from '../base';
import { Mode } from '../../mode/mode';
import { Position } from '../../common/motion/position';
import { VimState } from '../../state/vimState';
import { IMovement, BaseMovement } from '../baseMotion';
import { TextEditor } from '../../textEditor';
import { configuration } from '../../configuration/configuration';
import { ChangeOperator } from '../operator';

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
@RegisterPluginAction
class MoveCamelCaseWordBegin extends CamelCaseBaseMovement {
  pluginActionDefaultKeys = ['<leader>', 'w'];
  keys = ['<CamelCaseMotion_w>'];

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
@RegisterPluginAction
class MoveCamelCaseWordEnd extends CamelCaseBaseMovement {
  pluginActionDefaultKeys = ['<leader>', 'e'];
  keys = ['<CamelCaseMotion_e>'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getCurrentCamelCaseWordEnd();
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    let end = position.getCurrentCamelCaseWordEnd();

    return new Position(end.line, end.character + 1);
  }
}

// based off of `MoveBeginningWord`
@RegisterPluginAction
class MoveBeginningCamelCaseWord extends CamelCaseBaseMovement {
  pluginActionDefaultKeys = ['<leader>', 'b'];
  keys = ['<CamelCaseMotion_b>'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getCamelCaseWordLeft();
  }
}

// based off of `SelectInnerWord`
@RegisterPluginAction
class SelectInnerCamelCaseWord extends CamelCaseTextObjectMovement {
  modes = [Mode.OperatorPendingMode, Mode.Visual];
  pluginActionDefaultKeys = ['i', '<leader>', 'w'];
  keys = ['<CamelCaseMotion_iw>'];

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
      vimState.currentMode === Mode.Visual &&
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
