import { Position } from 'vscode';
import { PositionDiff } from '../../common/motion/position';
import { Range } from '../../common/motion/range';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { RegisterAction, BaseCommand } from '../base';

@RegisterAction
class ExitReplaceMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = [['<Esc>'], ['<C-c>'], ['<C-[>']];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const timesToRepeat = vimState.replaceState!.timesToRepeat;
    let textToAdd = '';

    for (let i = 1; i < timesToRepeat; i++) {
      textToAdd += vimState.replaceState!.newChars.join('');
    }

    vimState.recordedState.transformer.addTransformation({
      type: 'insertText',
      text: textToAdd,
      position,
      diff: new PositionDiff({ character: -1 }),
    });

    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class ReplaceModeToInsertMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = ['<Insert>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
  }
}

@RegisterAction
class BackspaceInReplaceMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = [['<BS>'], ['<C-h>']];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const replaceState = vimState.replaceState!;
    if (position.isBeforeOrEqual(replaceState.replaceCursorStartPosition)) {
      // If you backspace before the beginning of where you started to replace, just move the cursor back.

      vimState.cursorStopPosition = position.getLeft();
      vimState.cursorStartPosition = position.getLeft();
    } else if (
      position.line > replaceState.replaceCursorStartPosition.line ||
      position.character > replaceState.originalChars.length
    ) {
      vimState.recordedState.transformer.addTransformation({
        type: 'deleteText',
        position,
      });
    } else {
      vimState.recordedState.transformer.addTransformation({
        type: 'replaceText',
        text: replaceState.originalChars[position.character - 1],
        range: new Range(position.getLeft(), position),
        diff: new PositionDiff({ character: -1 }),
      });
    }

    replaceState.newChars.pop();
  }
}

@RegisterAction
class ReplaceInReplaceMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = ['<character>'];
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const char = this.keysPressed[0];
    const replaceState = vimState.replaceState!;

    if (!position.isLineEnd() && char !== '\n') {
      vimState.recordedState.transformer.addTransformation({
        type: 'replaceText',
        text: char,
        range: new Range(position, position.getRight()),
        diff: new PositionDiff({ character: 1 }),
      });
    } else {
      vimState.recordedState.transformer.addTransformation({
        type: 'insertText',
        text: char,
        position,
      });
    }

    replaceState.newChars.push(char);
  }
}
