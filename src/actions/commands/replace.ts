import { Position, Range } from 'vscode';
import { PositionDiff } from '../../common/motion/position';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { BaseCommand, RegisterAction } from '../base';

@RegisterAction
class ExitReplaceMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = [['<Esc>'], ['<C-c>'], ['<C-[>']];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (vimState.modeData.mode !== Mode.Replace) {
      throw new Error(`Unexpected mode ${vimState.modeData.mode} in ExitReplaceMode`);
    }

    const timesToRepeat = vimState.modeData.replaceState.timesToRepeat;

    const cursorIdx = this.multicursorIndex ?? 0;
    const changes = vimState.modeData.replaceState.getChanges(cursorIdx);

    // `3Rabc` results in 'abc' replacing the next characters 2 more times
    if (changes && timesToRepeat > 1) {
      const newText = changes
        .map((change) => change.after)
        .join('')
        .repeat(timesToRepeat - 1);
      vimState.recordedState.transformer.replace(
        new Range(position, position.getRight(newText.length)),
        newText,
      );
    } else {
      vimState.cursorStopPosition = vimState.cursorStopPosition.getLeft();
    }

    if (this.multicursorIndex === vimState.cursors.length - 1) {
      await vimState.setCurrentMode(Mode.Normal);
    }
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
    if (vimState.modeData.mode !== Mode.Replace) {
      throw new Error(`Unexpected mode ${vimState.modeData.mode} in BackspaceInReplaceMode`);
    }

    const cursorIdx = this.multicursorIndex ?? 0;
    const changes = vimState.modeData.replaceState.getChanges(cursorIdx);

    if (changes.length === 0) {
      // If you backspace before the beginning of where you started to replace, just move the cursor back.
      const newPosition = position.getLeftThroughLineBreaks();

      vimState.modeData.replaceState.resetChanges(cursorIdx);

      vimState.cursorStopPosition = newPosition;
      vimState.cursorStartPosition = newPosition;
    } else {
      const { before } = changes.pop()!;
      if (before === '') {
        // We've gone beyond the originally existing text; just backspace.
        // TODO: should this use a 'deleteLeft' transformation?
        vimState.recordedState.transformer.addTransformation({
          type: 'deleteRange',
          range: new Range(position.getLeftThroughLineBreaks(), position),
        });
      } else {
        vimState.recordedState.transformer.addTransformation({
          type: 'replaceText',
          text: before,
          range: new Range(position.getLeft(), position),
          diff: PositionDiff.offset({ character: -1 }),
        });
      }
    }
  }
}

@RegisterAction
class DeleteInReplaceMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = ['<Del>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.recordedState.transformer.vscodeCommand('deleteRight');
  }
}

@RegisterAction
class ReplaceInReplaceMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = ['<character>'];
  override createsUndoPoint = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (vimState.modeData.mode !== Mode.Replace) {
      throw new Error(`Unexpected mode ${vimState.modeData.mode} in ReplaceInReplaceMode`);
    }

    const char = this.keysPressed[0];
    const isNewLineOrTab = char === '\n' || char === '<tab>';

    const replaceRange = new Range(position, position.getRight());

    let before = vimState.document.getText(replaceRange);
    if (!position.isLineEnd() && !isNewLineOrTab) {
      vimState.recordedState.transformer.addTransformation({
        type: 'replaceText',
        text: char,
        range: replaceRange,
        diff: PositionDiff.offset({ character: 1 }),
      });
    } else if (char === '<tab>') {
      vimState.recordedState.transformer.delete(replaceRange);
      vimState.recordedState.transformer.vscodeCommand('tab');
    } else {
      vimState.recordedState.transformer.insert(position, char);
      before = '';
    }

    vimState.modeData.replaceState.getChanges(this.multicursorIndex ?? 0).push({
      before,
      after: char,
    });
  }
}

@RegisterAction
class CreateUndoPoint extends BaseCommand {
  modes = [Mode.Replace];
  keys = ['<C-g>', 'u'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.historyTracker.addChange(true);
    vimState.historyTracker.finishCurrentStep();
  }
}
