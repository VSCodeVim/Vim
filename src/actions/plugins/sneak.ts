import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';
import { configuration } from './../../configuration/configuration';
import { RegisterAction, RegisterPluginAction } from './../base';
import { Position } from '../../common/motion/position';
import { BaseMovement, IMovement, isIMovement } from '../baseMotion';
import { Mode } from '../../mode/mode';

class SneakForward extends BaseMovement {
  isJump = true;

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.sneak && super.doesActionApply(vimState, keysPressed);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.sneak && super.couldActionApply(vimState, keysPressed);
  }

  setRepeatMovements(vimState: VimState) {
    vimState.lastSemicolonRepeatableMovement = new SneakForward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new SneakBackward(this.keysPressed, true);
  }

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    if (!this.isRepeat) {
      this.setRepeatMovements(vimState);
    }

    const editor = vscode.window.activeTextEditor!;
    const document = editor.document;
    const lineCount = document.lineCount;

    if (this.keysPressed[2] === '\n') {
      // Single key sneak
      this.keysPressed[2] = '';
    }

    const searchString = this.keysPressed[1] + this.keysPressed[2];

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

class SneakBackward extends BaseMovement {
  isJump = true;

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.sneak && super.doesActionApply(vimState, keysPressed);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.sneak && super.couldActionApply(vimState, keysPressed);
  }

  setRepeatMovements(vimState: VimState) {
    vimState.lastSemicolonRepeatableMovement = new SneakBackward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new SneakForward(this.keysPressed, true);
  }

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    if (!this.isRepeat) {
      this.setRepeatMovements(vimState);
    }

    const editor = vscode.window.activeTextEditor!;
    const document = editor.document;

    if (this.keysPressed[2] === '\n') {
      // Single key sneak
      this.keysPressed[2] = '';
    }

    const searchString = this.keysPressed[1] + this.keysPressed[2];

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

@RegisterPluginAction('sneak')
class SneakForwardNormalAndVisualMode extends SneakForward {
  keys = ['<Plug>Sneak_s', '<character>', '<character>'];
  pluginActionDefaultKeys = ['s'];
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
}

@RegisterPluginAction('sneak')
class SneakForwardOperatorPendingMode extends SneakForward {
  keys = ['<Plug>Sneak_s', '<character>', '<character>'];
  pluginActionDefaultKeys = ['z'];
  modes = [Mode.OperatorPendingMode];
}

@RegisterPluginAction('sneak')
class SneakBackwardNormalAndVisualMode extends SneakBackward {
  keys = ['<Plug>Sneak_S', '<character>', '<character>'];
  pluginActionDefaultKeys = ['S'];
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
}

@RegisterPluginAction('sneak')
class SneakBackwardOperatorPendingMode extends SneakBackward {
  keys = ['<Plug>Sneak_S', '<character>', '<character>'];
  pluginActionDefaultKeys = ['Z'];
  modes = [Mode.OperatorPendingMode];
}

@RegisterPluginAction('sneak')
class SneakFForward extends SneakForward {
  keys = ['<Plug>Sneak_f', '<character>'];
  pluginActionDefaultKeys = [];

  setRepeatMovements(vimState: VimState) {
    vimState.lastSemicolonRepeatableMovement = new SneakFForward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new SneakFBackward(this.keysPressed, true);
  }

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    this.keysPressed.push('');
    const pos = await super.execAction(position, vimState);
    if (vimState.recordedState.operator && !isIMovement(pos)) {
      // if ran with an operator move right to include the searched character
      return pos.getRight();
    }

    return pos;
  }
}

@RegisterPluginAction('sneak')
class SneakFBackward extends SneakBackward {
  keys = ['<Plug>Sneak_F', '<character>'];
  pluginActionDefaultKeys = [];

  setRepeatMovements(vimState: VimState) {
    vimState.lastSemicolonRepeatableMovement = new SneakFBackward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new SneakFForward(this.keysPressed, true);
  }

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    this.keysPressed.push('');
    return super.execAction(position, vimState);
  }
}

@RegisterPluginAction('sneak')
class SneakTForward extends SneakForward {
  keys = ['<Plug>Sneak_t', '<character>'];
  pluginActionDefaultKeys = [];

  setRepeatMovements(vimState: VimState) {
    vimState.lastSemicolonRepeatableMovement = new SneakTForward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new SneakTBackward(this.keysPressed, true);
  }

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    this.keysPressed.push('');

    if (this.isRepeat) {
      position = position.getRightThroughLineBreaks(false);
    }
    const pos = await super.execAction(position, vimState);

    if (!isIMovement(pos) && !vimState.recordedState.operator) {
      // if not a failed movement and not an operator, go left of found character
      return pos.getLeftThroughLineBreaks(false);
    }

    return pos;
  }
}

@RegisterPluginAction('sneak')
class SneakTBackward extends SneakBackward {
  keys = ['<Plug>Sneak_T', '<character>'];
  pluginActionDefaultKeys = [];

  setRepeatMovements(vimState: VimState) {
    vimState.lastSemicolonRepeatableMovement = new SneakTBackward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new SneakTForward(this.keysPressed, true);
  }

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    this.keysPressed.push('');
    if (this.isRepeat) {
      position = position.getLeftThroughLineBreaks(false);
    }
    const pos = await super.execAction(position, vimState);
    if (!isIMovement(pos)) {
      // if not a failed movement, go right of found character
      return pos.getRightThroughLineBreaks(false);
    }

    return pos;
  }
}
