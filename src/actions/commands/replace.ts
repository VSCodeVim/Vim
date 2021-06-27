import { Position, Range } from 'vscode';
import { PositionDiff } from '../../common/motion/position';
import { Mode } from '../../mode/mode';
import { ReplaceState } from '../../state/replaceState';
import { VimState } from '../../state/vimState';
import { RegisterAction, BaseCommand } from '../base';

@RegisterAction
class ExitReplaceMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = [['<Esc>'], ['<C-c>'], ['<C-[>']];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const replaceState = vimState.replaceState!;

    // `3Rabc` results in 'abc' replacing the next characters 2 more times
    if (replaceState.timesToRepeat > 1) {
      const newText = replaceState.newChars.join('').repeat(replaceState.timesToRepeat - 1);
      vimState.recordedState.transformer.replace(
        new Range(position, position.getRight(newText.length)),
        newText
      );
    } else {
      vimState.cursorStopPosition = vimState.cursorStopPosition.getLeft();
    }

    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class ReplaceModeToInsertMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = ['<Insert>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
  }
}

@RegisterAction
class BackspaceInReplaceMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = [['<BS>'], ['<S-BS>'], ['<C-BS>'], ['<C-h>']];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const replaceState = vimState.replaceState!;
    if (position.isBeforeOrEqual(replaceState.replaceCursorStartPosition)) {
      // If you backspace before the beginning of where you started to replace, just move the cursor back.
      const newPosition = position.getLeftThroughLineBreaks();

      if (newPosition.line < replaceState.replaceCursorStartPosition.line) {
        vimState.replaceState = new ReplaceState(vimState, newPosition);
      } else {
        replaceState.replaceCursorStartPosition = newPosition;
      }

      vimState.cursorStopPosition = newPosition;
      vimState.cursorStartPosition = newPosition;
    } else if (
      position.line > replaceState.replaceCursorStartPosition.line ||
      position.character > replaceState.originalChars.length
    ) {
      // We've gone beyond the originally existing text; just backspace.
      vimState.recordedState.transformer.addTransformation({
        type: 'deleteText',
        position,
      });
      replaceState.newChars.pop();
    } else {
      vimState.recordedState.transformer.addTransformation({
        type: 'replaceText',
        text: replaceState.originalChars[position.character - 1],
        range: new Range(position.getLeft(), position),
        diff: PositionDiff.offset({ character: -1 }),
      });
      replaceState.newChars.pop();
    }
  }
}

@RegisterAction
class ReplaceInReplaceMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = ['<character>'];
  override canBeRepeatedWithDot = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const char = this.keysPressed[0];
    const replaceState = vimState.replaceState!;

    if (!position.isLineEnd() && char !== '\n') {
      vimState.recordedState.transformer.addTransformation({
        type: 'replaceText',
        text: char,
        range: new Range(position, position.getRight()),
        diff: PositionDiff.offset({ character: 1 }),
      });
    } else {
      vimState.recordedState.transformer.insert(position, char);
    }

    replaceState.newChars.push(char);
  }
}
