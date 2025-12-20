import * as vscode from 'vscode';

import { Position } from 'vscode';
import { Cursor } from '../../common/motion/cursor';
import { VimError } from '../../error';
import { globalState } from '../../state/globalState';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { Clipboard } from '../../util/clipboard';
import { SpecialKeys } from '../../util/specialKeys';
import { reportSearch } from '../../util/statusBarTextUtils';
import { getCursorsAfterSync } from '../../util/util';
import { SearchDirection } from '../../vimscript/pattern';
import { shouldWrapKey } from '../wrapping';
import { ExCommandLine, SearchCommandLine } from './../../cmd_line/commandLine';
import { PositionDiff, earlierOf, laterOf, sorted } from './../../common/motion/position';
import { configuration } from './../../configuration/configuration';
import {
  Mode,
  visualBlockGetBottomRightPosition,
  visualBlockGetTopLeftPosition,
} from './../../mode/mode';
import { Register, RegisterMode } from './../../register/register';
import { TextEditor } from './../../textEditor';
import { BaseCommand, RegisterAction } from './../base';
import * as operator from './../operator';

@RegisterAction
class DisableExtension extends BaseCommand {
  modes = [
    Mode.Normal,
    Mode.Insert,
    Mode.Visual,
    Mode.VisualBlock,
    Mode.VisualLine,
    Mode.SearchInProgressMode,
    Mode.CommandlineInProgress,
    Mode.Replace,
    Mode.EasyMotionMode,
    Mode.EasyMotionInputMode,
    Mode.SurroundInputMode,
  ];
  keys = [SpecialKeys.ExtensionDisable];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Disabled);
  }
}

@RegisterAction
class EnableExtension extends BaseCommand {
  modes = [Mode.Disabled];
  keys = [SpecialKeys.ExtensionEnable];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
export class CommandNumber extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['<number>'];
  override name = 'cmd_num';
  override isCompleteAction = false;
  override actionType = 'number' as const;
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const num = parseInt(this.keysPressed[0], 10);
    const operatorCount = vimState.recordedState.operatorCount;

    if (operatorCount > 0) {
      const lastAction =
        vimState.recordedState.actionsRun[vimState.recordedState.actionsRun.length - 2];
      if (!(lastAction instanceof CommandNumber)) {
        // We have set an operatorCount !== 0 after an operator, but now we got another count
        // number so we need to multiply them.
        vimState.recordedState.count = operatorCount * num;
      } else {
        // We are now getting another digit which means we need to multiply by 10 and add
        // the new digit multiplied by operatorCount.
        //
        // Example: user presses '2d31w':
        // - After '2' the number 2 is stored in 'count'
        // - After 'd' the count (2) is stored in 'operatorCount'
        // - After '3' the number 3 multiplied by 'operatorCount' (3 x 2 = 6) is stored in 'count'
        // - After '1' the count is multiplied by 10 and added by number 1 multiplied by 'operatorCount'
        //   (6 * 10 + 1 * 2 = 62)
        // The final result will be the deletion of 62 words.
        vimState.recordedState.count = vimState.recordedState.count * 10 + num * operatorCount;
      }
    } else {
      vimState.recordedState.count = vimState.recordedState.count * 10 + num;
    }
  }

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const isZero = keysPressed[0] === '0';

    return (
      super.doesActionApply(vimState, keysPressed) &&
      ((isZero && vimState.recordedState.count > 0) || !isZero)
    );
  }

  public override couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const isZero = keysPressed[0] === '0';

    return (
      super.couldActionApply(vimState, keysPressed) &&
      ((isZero && vimState.recordedState.count > 0) || !isZero)
    );
  }
}

@RegisterAction
export class CommandRegister extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['"', '<register>'];
  override name = 'cmd_register';
  override isCompleteAction = false;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const register = this.keysPressed[1];

    if (Register.isValidRegister(register)) {
      vimState.recordedState.registerName = register;
    } else {
      // TODO: Changing isCompleteAction here is maybe a bit janky - should it be a function?
      this.isCompleteAction = true;
    }
  }
}

@RegisterAction
class CommandEsc extends BaseCommand {
  modes = [
    Mode.Visual,
    Mode.VisualLine,
    Mode.VisualBlock,
    Mode.Normal,
    Mode.SurroundInputMode,
    Mode.EasyMotionMode,
    Mode.EasyMotionInputMode,
  ];
  keys = [['<Esc>'], ['<C-c>'], ['<C-[>']];

  override runsOnceForEveryCursor() {
    return false;
  }

  override preservesDesiredColumn = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (vimState.currentMode === Mode.Normal) {
      vimState.surround = undefined;

      if (vimState.isMultiCursor) {
        vimState.cursors = [vimState.cursor];
      } else {
        // If there's nothing to do on the vim side, we might as well call some
        // of vscode's default "close notification" actions. I think we should
        // just add to this list as needed.
        await Promise.allSettled([
          vscode.commands.executeCommand('closeReferenceSearchEditor'),
          vscode.commands.executeCommand('closeMarkersNavigation'),
          // TODO: closeDirtyDiff renamed to closeQuickDiff (see microsoft/vscode#235601)
          vscode.commands.executeCommand('closeDirtyDiff'),
          vscode.commands.executeCommand('closeQuickDiff'),
          vscode.commands.executeCommand('editor.action.inlineSuggest.hide'),
        ]);
      }
    } else {
      if (vimState.currentMode === Mode.EasyMotionMode) {
        vimState.easyMotion.clearDecorations(vimState.editor);
      } else if (vimState.currentMode === Mode.SurroundInputMode) {
        vimState.surround = undefined;
      }

      await vimState.setCurrentMode(Mode.Normal);
    }
  }
}

/**
 * Our Vim implementation selects up to but not including the final character
 * of a visual selection, instead opting to render a block cursor on the final
 * character. This works for everything except VSCode's native copy command,
 * which loses the final character because it's not selected. We override that
 * copy command here by default to include the final character.
 */
@RegisterAction
class CommandOverrideCopy extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine, Mode.VisualBlock, Mode.Insert, Mode.Normal];
  keys = ['<copy>']; // A special key - see ModeHandler

  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    let text = '';

    if (vimState.currentMode === Mode.Visual) {
      text = vimState.cursors
        .map((range) => {
          const [start, stop] = sorted(range.start, range.stop);
          return vimState.document.getText(new vscode.Range(start, stop.getRight()));
        })
        .join('\n');
    } else if (vimState.currentMode === Mode.VisualLine) {
      text = vimState.cursors
        .map((range) => {
          return vimState.document.getText(
            new vscode.Range(
              earlierOf(range.start.getLineBegin(), range.stop.getLineBegin()),
              laterOf(range.start.getLineEnd(), range.stop.getLineEnd()),
            ),
          );
        })
        .join('\n');
    } else if (vimState.currentMode === Mode.VisualBlock) {
      for (const { line } of TextEditor.iterateLinesInBlock(vimState)) {
        text += line + '\n';
      }
    } else if (vimState.currentMode === Mode.Insert || vimState.currentMode === Mode.Normal) {
      text = vimState.editor.selections
        .map((selection) => {
          return vimState.document.getText(new vscode.Range(selection.start, selection.end));
        })
        .join('\n');
    }

    const editorSelection = vimState.editor.selection;
    const hasSelectedText = !editorSelection.active.isEqual(editorSelection.anchor);

    if (hasSelectedText) {
      await Clipboard.Copy(text);
    }

    // all vim yank operations return to normal mode.
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class CommandCmdA extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['<D-a>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.cursorStartPosition = new Position(0, vimState.desiredColumn);
    vimState.cursorStopPosition = new Position(
      vimState.document.lineCount - 1,
      vimState.desiredColumn,
    );
    await vimState.setCurrentMode(Mode.VisualLine);
  }
}

@RegisterAction
class MarkCommand extends BaseCommand {
  keys = ['m', '<register>'];
  modes = [Mode.Normal];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const markName = this.keysPressed[1];

    vimState.historyTracker.addMark(vimState.document, position, markName);
  }
}

@RegisterAction
class ShowCommandLine extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = [':'];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    let commandLineText: string;
    if (vimState.currentMode === Mode.Normal) {
      if (vimState.recordedState.count) {
        commandLineText = `.,.+${vimState.recordedState.count - 1}`;
      } else {
        commandLineText = '';
      }
    } else {
      commandLineText = "'<,'>";
    }

    const previousMode = vimState.currentMode;
    await vimState.setCurrentMode(Mode.CommandlineInProgress);
    // TODO: Change or supplement `setCurrentMode` API so this isn't necessary
    if (vimState.modeData.mode === Mode.CommandlineInProgress) {
      vimState.modeData.commandLine = new ExCommandLine(commandLineText, previousMode);
    }
  }
}

@RegisterAction
export class ShowCommandHistory extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['q', ':'];

  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const cmd = await vscode.window.showQuickPick(ExCommandLine.history.get().slice().reverse(), {
      placeHolder: 'Vim command history',
      ignoreFocusOut: false,
    });
    if (cmd && cmd.length !== 0) {
      await new ExCommandLine(cmd, vimState.currentMode).run(vimState);
    }

    await vimState.setCurrentMode(Mode.Normal);
  }
}

ExCommandLine.onSearch = async (vimState: VimState) => {
  void new ShowCommandHistory().exec(vimState.cursorStopPosition, vimState);
};

@RegisterAction
export class ShowSearchHistory extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = [
    ['q', '/'],
    ['q', '?'],
  ];

  private direction = SearchDirection.Forward;

  override runsOnceForEveryCursor() {
    return false;
  }

  public constructor(direction = SearchDirection.Forward) {
    super();
    this.direction = direction;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (this.keysPressed.includes('?')) {
      this.direction = SearchDirection.Backward;
    }

    const searchState = await SearchCommandLine.showSearchHistory();
    if (searchState) {
      globalState.searchState = searchState;
      globalState.hl = true;

      const nextMatch = searchState.getNextSearchMatchPosition(
        vimState,
        vimState.cursorStartPosition,
        this.direction,
      );

      if (!nextMatch) {
        throw this.direction === SearchDirection.Forward
          ? VimError.SearchHitBottom(searchState.searchString)
          : VimError.SearchHitTop(searchState.searchString);
      }

      vimState.cursorStopPosition = nextMatch.pos;
      reportSearch(nextMatch.index, searchState.getMatchRanges(vimState).length, vimState);
    }

    await vimState.setCurrentMode(Mode.Normal);
  }
}

// Register the command to execute on CtrlF.
SearchCommandLine.onSearch = async (vimState: VimState, direction: SearchDirection) => {
  return new ShowSearchHistory(direction).exec(vimState.cursorStopPosition, vimState);
};

@RegisterAction
class DotRepeat extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['.'];
  override createsUndoPoint = true;

  public override async execCount(position: Position, vimState: VimState): Promise<void> {
    if (globalState.previousFullAction) {
      const count = vimState.recordedState.count || 1;

      vimState.recordedState.transformer.addTransformation({
        type: 'replayRecordedState',
        count,
        recordedState: globalState.previousFullAction,
      });
    } else {
      // No previous action to repeat, so mark this as non-repeatable
      vimState.lastCommandDotRepeatable = false;
    }
  }
}

@RegisterAction
class RepeatSubstitution extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['&'];
  override createsUndoPoint = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    // Parsing the command from a string, while not ideal, is currently
    // necessary to make this work with and without neovim integration
    await ExCommandLine.parser.tryParse('s').command.execute(vimState);
  }
}

@RegisterAction
class GoToOtherEndOfHighlightedText extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['o'];
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    [vimState.cursorStartPosition, vimState.cursorStopPosition] = [
      vimState.cursorStopPosition,
      vimState.cursorStartPosition,
    ];
  }
}

@RegisterAction
class GoToOtherSideOfHighlightedText extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['O'];
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (vimState.currentMode === Mode.VisualBlock) {
      [vimState.cursorStartPosition, vimState.cursorStopPosition] = [
        new Position(vimState.cursorStartPosition.line, vimState.cursorStopPosition.character),
        new Position(vimState.cursorStopPosition.line, vimState.cursorStartPosition.character),
      ];
    } else {
      return new GoToOtherEndOfHighlightedText().exec(position, vimState);
    }
  }
}

@RegisterAction
class DeleteToLineEnd extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['D'];
  override createsUndoPoint = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (position.isLineEnd(vimState.document)) {
      return;
    }

    const linesDown = (vimState.recordedState.count || 1) - 1;
    const start = position;
    const end = position.getDown(linesDown).getLineEnd().getLeftThroughLineBreaks();

    await new operator.DeleteOperator(this.multicursorIndex).run(vimState, start, end);
  }
}

@RegisterAction
class YankLine extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['Y'];
  override name = 'yank_full_line';

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const linesDown = (vimState.recordedState.count || 1) - 1;
    const start = position.getLineBegin();
    const end = position.getDown(linesDown).getLeft();

    vimState.currentRegisterMode = RegisterMode.LineWise;

    await new operator.YankOperator(this.multicursorIndex).run(vimState, start, end);
  }
}

@RegisterAction
class ChangeToLineEnd extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['C'];
  override runsOnceForEachCountPrefix = false;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const count = vimState.recordedState.count || 1;

    await new operator.ChangeOperator(this.multicursorIndex).run(
      vimState,
      position,
      position
        .getDown(Math.max(0, count - 1))
        .getLineEnd()
        .getLeft(),
    );
  }
}

@RegisterAction
class ChangeLine extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['S'];
  override runsOnceForEachCountPrefix = false;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await new operator.ChangeOperator(this.multicursorIndex).runRepeat(
      vimState,
      position,
      vimState.recordedState.count || 1,
    );
  }

  // Don't clash with sneak
  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.doesActionApply(vimState, keysPressed) && !configuration.sneak;
  }

  public override couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.couldActionApply(vimState, keysPressed) && !configuration.sneak;
  }
}

@RegisterAction
class ActionDeleteChar extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['x'];
  override name = 'delete_char';
  override createsUndoPoint = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    // If line is empty, do nothing
    if (vimState.document.lineAt(position).text.length === 0) {
      return;
    }

    const timesToRepeat = vimState.recordedState.count || 1;

    await new operator.DeleteOperator(this.multicursorIndex).run(
      vimState,
      position,
      position.getRight(timesToRepeat - 1).getLeftIfEOL(),
    );

    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class ActionDeleteCharWithDeleteKey extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['<Del>'];
  override name = 'delete_char_with_del';
  override runsOnceForEachCountPrefix = true;
  override createsUndoPoint = true;

  public override async execCount(position: Position, vimState: VimState): Promise<void> {
    // If <del> has a count in front of it, then <del> deletes a character
    // off the count. Therefore, 100<del>x, would apply 'x' 10 times.
    // http://vimdoc.sourceforge.net/htmldoc/change.html#<Del>
    if (vimState.recordedState.count !== 0) {
      vimState.recordedState.count = Math.floor(vimState.recordedState.count / 10);

      // Change actionsRunPressedKeys so that showCmd updates correctly
      vimState.recordedState.actionsRunPressedKeys =
        vimState.recordedState.count > 0 ? vimState.recordedState.count.toString().split('') : [];
      this.isCompleteAction = false;
    } else {
      await new ActionDeleteChar().execCount(position, vimState);
    }
  }
}

@RegisterAction
class ActionDeleteLastChar extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['X'];
  override name = 'delete_last_char';
  override createsUndoPoint = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (position.character === 0) {
      return;
    }

    const timesToRepeat = vimState.recordedState.count || 1;

    await new operator.DeleteOperator(this.multicursorIndex).run(
      vimState,
      position.getLeft(timesToRepeat),
      position.getLeft(),
    );
  }
}

@RegisterAction
class VisualBlockDelete extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = [['d'], ['x'], ['X']];
  override createsUndoPoint = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const lines: string[] = [];

    for (const { line, start, end } of TextEditor.iterateLinesInBlock(vimState)) {
      lines.push(line);
      vimState.recordedState.transformer.addTransformation({
        type: 'deleteRange',
        range: new vscode.Range(start, end),
        manuallySetCursorPositions: true,
      });
    }

    const text = lines.length === 1 ? lines[0] : lines.join('\n');
    vimState.currentRegisterMode = RegisterMode.BlockWise;
    Register.put(vimState, text, this.multicursorIndex, true);

    vimState.cursors = [
      Cursor.atPosition(
        visualBlockGetTopLeftPosition(vimState.cursorStopPosition, vimState.cursorStartPosition),
      ),
    ];
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class VisualBlockDeleteToLineEnd extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = ['D'];
  override createsUndoPoint = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const lines: string[] = [];
    for (const { start } of TextEditor.iterateLinesInBlock(vimState)) {
      const range = new vscode.Range(start, start.getLineEnd());
      lines.push(vimState.editor.document.getText(range));
      vimState.recordedState.transformer.addTransformation({
        type: 'deleteRange',
        range,
        manuallySetCursorPositions: true,
      });
    }

    const topLeft = visualBlockGetTopLeftPosition(
      vimState.cursorStopPosition,
      vimState.cursorStartPosition,
    );

    const text = lines.length === 1 ? lines[0] : lines.join('\n');
    Register.put(vimState, text, this.multicursorIndex, true);

    vimState.cursors = [Cursor.atPosition(topLeft)];
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class VisualBlockInsert extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = ['I'];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const cursors: Cursor[] = [];
    for (const cursor of vimState.cursors) {
      for (const { line, start } of TextEditor.iterateLinesInBlock(vimState, cursor)) {
        if (line === '' && start.character !== 0) {
          continue;
        }
        cursors.push(Cursor.atPosition(start));
      }
    }
    vimState.cursors = cursors;

    await vimState.setCurrentMode(Mode.Insert);
    vimState.isFakeMultiCursor = true;
  }
}

@RegisterAction
class VisualBlockChange extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = [['c'], ['s']];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const cursors: Cursor[] = [];
    const lines: string[] = [];
    for (const cursor of vimState.cursors) {
      const width =
        1 +
        visualBlockGetBottomRightPosition(cursor.start, cursor.stop).character -
        visualBlockGetTopLeftPosition(cursor.start, cursor.stop).character;
      for (const { line, start, end } of TextEditor.iterateLinesInBlock(vimState, cursor)) {
        // TODO: is this behavior consistent with similar actions like VisualBlock `d`?
        lines.push(line.padEnd(width, ' '));
        if (line) {
          vimState.recordedState.transformer.addTransformation({
            type: 'deleteRange',
            range: new vscode.Range(start, end),
            manuallySetCursorPositions: true,
          });
          cursors.push(Cursor.atPosition(start));
        }
      }
    }
    vimState.cursors = cursors;

    const text = lines.length === 1 ? lines[0] : lines.join('\n');
    Register.put(vimState, text, this.multicursorIndex, true);

    await vimState.setCurrentMode(Mode.Insert);
    vimState.isFakeMultiCursor = true;
  }
}

@RegisterAction
class ActionChangeToEOLInVisualBlockMode extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = ['C'];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const cursors: Cursor[] = [];
    for (const cursor of vimState.cursors) {
      for (const { start, end } of TextEditor.iterateLinesInBlock(vimState, cursor)) {
        vimState.recordedState.transformer.delete(new vscode.Range(start, start.getLineEnd()));
        cursors.push(Cursor.atPosition(end));
      }
    }
    vimState.cursors = cursors;

    await vimState.setCurrentMode(Mode.Insert);
    vimState.isFakeMultiCursor = true;
  }
}

abstract class ActionGoToInsertVisualLineModeCommand extends BaseCommand {
  override runsOnceForEveryCursor() {
    return false;
  }

  abstract getCursorRangeForLine(
    line: vscode.TextLine,
    selectionStart: Position,
    selectionEnd: Position,
  ): Cursor;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
    vimState.isFakeMultiCursor = true;

    const resultingCursors: Cursor[] = [];
    const cursorsOnBlankLines: Cursor[] = [];
    for (const selection of vimState.editor.selections) {
      const { start, end } = selection;

      for (let i = start.line; i <= end.line; i++) {
        const line = vimState.document.lineAt(i);

        const cursorRange = this.getCursorRangeForLine(line, start, end);
        if (!line.isEmptyOrWhitespace) {
          resultingCursors.push(cursorRange);
        } else {
          cursorsOnBlankLines.push(cursorRange);
        }
      }
    }

    if (resultingCursors.length > 0) {
      vimState.cursors = resultingCursors;
    } else {
      vimState.cursors = cursorsOnBlankLines;
    }
  }
}

@RegisterAction
class VisualLineInsert extends ActionGoToInsertVisualLineModeCommand {
  modes = [Mode.VisualLine];
  keys = ['I'];

  getCursorRangeForLine(line: vscode.TextLine): Cursor {
    return Cursor.atPosition(new Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex));
  }
}

@RegisterAction
class VisualLineAppend extends ActionGoToInsertVisualLineModeCommand {
  modes = [Mode.VisualLine];
  keys = ['A'];

  getCursorRangeForLine(line: vscode.TextLine): Cursor {
    return Cursor.atPosition(new Position(line.lineNumber, line.range.end.character));
  }
}

@RegisterAction
class VisualInsert extends ActionGoToInsertVisualLineModeCommand {
  modes = [Mode.Visual];
  keys = ['I'];

  getCursorRangeForLine(
    line: vscode.TextLine,
    selectionStart: Position,
    selectionEnd: Position,
  ): Cursor {
    return Cursor.atPosition(
      line.lineNumber === selectionStart.line
        ? selectionStart
        : new Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex),
    );
  }
}

@RegisterAction
class VisualAppend extends ActionGoToInsertVisualLineModeCommand {
  modes = [Mode.Visual];
  keys = ['A'];

  getCursorRangeForLine(
    line: vscode.TextLine,
    selectionStart: Position,
    selectionEnd: Position,
  ): Cursor {
    return Cursor.atPosition(
      line.lineNumber === selectionEnd.line
        ? selectionEnd
        : new Position(line.lineNumber, line.range.end.character),
    );
  }
}

@RegisterAction
class VisualBlockAppend extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = ['A'];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const newCursors: Cursor[] = [];
    for (const cursor of vimState.cursors) {
      const [start, end] = sorted(cursor.start, cursor.stop);
      for (let lineNum = start.line; lineNum <= end.line; lineNum++) {
        const line = vimState.document.lineAt(lineNum);
        const insertionColumn =
          vimState.desiredColumn === Number.POSITIVE_INFINITY
            ? line.text.length
            : Math.max(cursor.start.character, cursor.stop.character) + 1;
        if (line.text.length < insertionColumn) {
          await TextEditor.insert(
            vimState.editor,
            ' '.repeat(insertionColumn - line.text.length),
            line.range.end,
            false,
          );
        }
        newCursors.push(Cursor.atPosition(new Position(lineNum, insertionColumn)));
      }
    }

    vimState.cursors = newCursors;
    await vimState.setCurrentMode(Mode.Insert);
    vimState.isFakeMultiCursor = true;
  }
}

@RegisterAction
class VisualLineDeleteChar extends BaseCommand {
  modes = [Mode.VisualLine];
  keys = ['x'];
  override name = 'delete_char_visual_line_mode';

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const [start, end] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);
    await new operator.DeleteOperator(this.multicursorIndex).run(
      vimState,
      start.getLineBegin(),
      end.getLineEnd(),
    );
  }
}

@RegisterAction
class VisualDeleteLine extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  keys = ['X'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const [start, end] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);
    await new operator.DeleteOperator(this.multicursorIndex).run(
      vimState,
      start.getLineBegin(),
      end.getLineEnd(),
    );
  }
}

@RegisterAction
class VisualChangeLine extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  keys = [['C'], ['R']];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const [start, end] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);
    await new operator.ChangeOperator(this.multicursorIndex).run(
      vimState,
      start.getLineBegin(),
      end.getLineEnd().getLeftIfEOL(),
    );
  }
}

@RegisterAction
class VisualChangeLine_2 extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  keys = ['S'];

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return !configuration.surround && super.doesActionApply(vimState, keysPressed);
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await new VisualChangeLine().exec(position, vimState);
  }
}

@RegisterAction
class VisualBlockChangeLine extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = [['R'], ['S']];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    return new VisualChangeLine().exec(position, vimState);
  }
}

@RegisterAction
class ChangeChar extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['s'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await new operator.ChangeOperator(this.multicursorIndex).run(
      vimState,
      position,
      position.getRight((vimState.recordedState.count || 1) - 1),
    );
  }

  // Don't clash with surround or sneak modes!
  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return (
      super.doesActionApply(vimState, keysPressed) &&
      !configuration.sneak &&
      !vimState.recordedState.operator
    );
  }

  public override couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return (
      super.couldActionApply(vimState, keysPressed) &&
      !configuration.sneak &&
      !vimState.recordedState.operator
    );
  }
}

@RegisterAction
class ToggleCaseAndMoveForward extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['~'];
  override createsUndoPoint = true;

  private toggleCase(text: string): string {
    let newText = '';
    for (const char of text) {
      let toggled = char.toLocaleLowerCase();
      if (toggled === char) {
        toggled = char.toLocaleUpperCase();
      }
      newText += toggled;
    }
    return newText;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const count = vimState.recordedState.count || 1;
    const range = new vscode.Range(
      position,
      shouldWrapKey(vimState.currentMode, '~')
        ? position.getOffsetThroughLineBreaks(count)
        : position.getRight(count),
    );

    vimState.recordedState.transformer.addTransformation({
      type: 'replaceText',
      range,
      text: this.toggleCase(vimState.document.getText(range)),
      diff: PositionDiff.exactPosition(range.end),
    });
  }
}

@RegisterAction
export class CommandUnicodeName extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['g', 'a'];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const char = vimState.document.getText(new vscode.Range(position, position.getRight()));
    const charCode = char.charCodeAt(0);
    // TODO: Handle charCode > 127 by also including <M-x>
    StatusBar.setText(
      vimState,
      `<${char}>  ${charCode},  Hex ${charCode.toString(16)},  Octal ${charCode.toString(8)}`,
    );
  }
}

@RegisterAction
class ShowHover extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['g', 'h'];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vscode.commands.executeCommand('editor.action.showHover');
  }
}

/**
 * Multi-Cursor Command Overrides
 *
 * We currently have to override the VSCode key commands that get us into multi-cursor mode.
 *
 * Normally, we'd just listen for another cursor to be added in order to go into multi-cursor
 * mode rather than rewriting each keybinding one-by-one. We can't currently do that because
 * Visual Block Mode also creates additional cursors, but will get confused if you're in
 * multi-cursor mode.
 */

@RegisterAction
export class ActionOverrideCmdD extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual];
  keys = [['<D-d>'], ['g', 'b']];
  override runsOnceForEveryCursor() {
    return false;
  }
  override runsOnceForEachCountPrefix = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vscode.commands.executeCommand('editor.action.addSelectionToNextFindMatch');
    vimState.cursors = getCursorsAfterSync(vimState.editor);

    // If this is the first cursor, select 1 character less
    // so that only the word is selected, no extra character
    vimState.cursors = vimState.cursors.map((x) => x.withNewStop(x.stop.getLeft()));

    await vimState.setCurrentMode(Mode.Visual);
  }
}

@RegisterAction
class ActionOverrideCmdDInsert extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<D-d>'];
  override runsOnceForEveryCursor() {
    return false;
  }
  override runsOnceForEachCountPrefix = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    // Since editor.action.addSelectionToNextFindMatch uses the selection to
    // determine where to add a word, we need to do a hack and manually set the
    // selections to the word boundaries before we make the api call.
    vimState.editor.selections = vimState.editor.selections.map((x, idx) => {
      const curPos = x.active;
      if (idx === 0) {
        return new vscode.Selection(
          curPos.prevWordStart(vimState.document),
          curPos.getLeft().nextWordEnd(vimState.document, { inclusive: true }).getRight(),
        );
      } else {
        // Since we're adding the selections ourselves, we need to make sure
        // that our selection is actually over what our original word is
        const matchWordPos = vimState.editor.selections[0].active;
        const matchWordLength =
          matchWordPos.getLeft().nextWordEnd(vimState.document, { inclusive: true }).getRight()
            .character - matchWordPos.prevWordStart(vimState.document).character;
        const wordBegin = curPos.getLeft(matchWordLength);
        return new vscode.Selection(wordBegin, curPos);
      }
    });
    vimState.recordedState.transformer.vscodeCommand('editor.action.addSelectionToNextFindMatch');
  }
}

@RegisterAction
class InsertCursorBelow extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual];
  keys = [
    ['<D-alt+down>'], // OSX
    ['<C-alt+down>'], // Windows
  ];
  override runsOnceForEveryCursor() {
    return false;
  }
  override runsOnceForEachCountPrefix = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.recordedState.transformer.vscodeCommand('editor.action.insertCursorBelow');
  }
}

@RegisterAction
class InsertCursorAbove extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual];
  keys = [
    ['<D-alt+up>'], // OSX
    ['<C-alt+up>'], // Windows
  ];
  override runsOnceForEveryCursor() {
    return false;
  }
  override runsOnceForEachCountPrefix = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.recordedState.transformer.vscodeCommand('editor.action.insertCursorAbove');
  }
}

@RegisterAction
class ShowFileOutline extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['g', 'O'];

  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vscode.commands.executeCommand('outline.focus');
  }
}
