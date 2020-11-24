import * as vscode from 'vscode';
import { ModeHandler } from '../mode/modeHandler';
import { Logger } from '../util/logger';
import {
  isTextTransformation,
  TextTransformations,
  Transformation,
  isMultiCursorTextTransformation,
  InsertTextVSCodeTransformation,
  areAllSameTransformation,
  areAnyTransformationsOverlapping,
} from './transformations';
import { commandLine } from '../cmd_line/commandLine';
import { PairMatcher } from '../common/matching/matcher';
import { PositionDiff } from '../common/motion/position';
import { VimError, ErrorCode } from '../error';
import { Mode } from '../mode/mode';
import { Register } from '../register/register';
import { globalState } from '../state/globalState';
import { RecordedState } from '../state/recordedState';
import { TextEditor } from '../textEditor';
import { reportSearch } from '../util/statusBarTextUtils';
import { Range } from '../common/motion/range';
import { Position } from 'vscode';

export class Transformer {
  public readonly transformations: Transformation[] = [];

  private logger = Logger.get('Transformer');

  public addTransformation(transformation: Transformation) {
    this.logger.debug(`Adding Transformation ${JSON.stringify(transformation)}`);
    this.transformations.push(transformation);
  }

  public async execute(modeHandler: ModeHandler) {
    if (this.transformations.length === 0) {
      return;
    }

    const vimState = modeHandler.vimState;

    const textTransformations: TextTransformations[] = this.transformations.filter((x) =>
      isTextTransformation(x)
    ) as any;
    const multicursorTextTransformations: InsertTextVSCodeTransformation[] = this.transformations.filter(
      (x) => isMultiCursorTextTransformation(x)
    ) as any;

    const otherTransformations = this.transformations.filter(
      (x) => !isTextTransformation(x) && !isMultiCursorTextTransformation(x)
    );

    let accumulatedPositionDifferences: { [key: number]: PositionDiff[] } = {};

    const doTextEditorEdit = (command: TextTransformations, edit: vscode.TextEditorEdit) => {
      switch (command.type) {
        case 'insertText':
          edit.insert(command.position, command.text);
          break;
        case 'replaceText':
          edit.replace(new vscode.Selection(command.range.start, command.range.stop), command.text);
          break;
        case 'deleteText':
          const matchRange = PairMatcher.immediateMatchingBracket(vimState, command.position);
          if (matchRange) {
            edit.delete(matchRange);
          }
          edit.delete(
            new vscode.Range(command.position, command.position.getLeftThroughLineBreaks())
          );
          break;
        case 'deleteRange':
          edit.delete(new vscode.Selection(command.range.start, command.range.stop));
          break;
        case 'moveCursor':
          break;
        default:
          this.logger.warn(`Unhandled text transformation type: ${command.type}.`);
          break;
      }

      if (command.cursorIndex === undefined) {
        throw new Error('No cursor index - this should never ever happen!');
      }

      if (command.diff) {
        if (!accumulatedPositionDifferences[command.cursorIndex]) {
          accumulatedPositionDifferences[command.cursorIndex] = [];
        }

        accumulatedPositionDifferences[command.cursorIndex].push(command.diff);
      }
    };

    if (textTransformations.length > 0) {
      if (areAnyTransformationsOverlapping(textTransformations)) {
        this.logger.debug(
          `Text transformations are overlapping. Falling back to serial
           transformations. This is generally a very bad sign. Try to make
           your text transformations operate on non-overlapping ranges.`
        );

        // TODO: Select one transformation for every cursor and run them all
        // in parallel. Repeat till there are no more transformations.
        for (const transformation of textTransformations) {
          await vimState.editor.edit((edit) => doTextEditorEdit(transformation, edit));
        }
      } else {
        // This is the common case!

        /**
         * batch all text operations together as a single operation
         * (this is primarily necessary for multi-cursor mode, since most
         * actions will trigger at most one text operation).
         */
        await vimState.editor.edit((edit) => {
          for (const command of textTransformations) {
            doTextEditorEdit(command, edit);
          }
        });
      }
    }

    if (multicursorTextTransformations.length > 0) {
      if (areAllSameTransformation(multicursorTextTransformations)) {
        /**
         * Apply the transformation only once instead of to each cursor
         * if they are all the same.
         *
         * This lets VSCode do multicursor snippets, auto braces and
         * all the usual jazz VSCode does on text insertion.
         */
        const { text } = multicursorTextTransformations[0];

        // await vscode.commands.executeCommand('default:type', { text });
        await TextEditor.insert(vimState.editor, text);
      } else {
        this.logger.warn(
          `Unhandled multicursor transformations. Not all transformations are the same!`
        );
      }
    }

    for (const transformation of otherTransformations) {
      switch (transformation.type) {
        case 'insertTextVSCode':
          await TextEditor.insert(vimState.editor, transformation.text);
          vimState.cursors[0] = Range.FromVSCodeSelection(vimState.editor.selection);
          break;

        case 'showCommandHistory':
          let cmd = await commandLine.showHistory(vimState.currentCommandlineText);
          if (cmd && cmd.length !== 0) {
            await commandLine.Run(cmd, vimState);
            modeHandler.updateView();
          }
          break;

        case 'showSearchHistory':
          const searchState = await globalState.showSearchHistory();
          if (searchState) {
            globalState.searchState = searchState;
            const nextMatch = searchState.getNextSearchMatchPosition(
              vimState.editor,
              vimState.cursorStartPosition,
              transformation.direction
            );

            if (!nextMatch) {
              throw VimError.fromCode(
                transformation.direction > 0 ? ErrorCode.SearchHitBottom : ErrorCode.SearchHitTop,
                searchState.searchString
              );
            }

            vimState.cursorStopPosition = nextMatch.pos;
            modeHandler.updateView();
            reportSearch(
              nextMatch.index,
              searchState.getMatchRanges(vimState.editor).length,
              vimState
            );
          }
          break;

        case 'dot':
          if (!globalState.previousFullAction) {
            return; // TODO(bell)
          }

          await modeHandler.rerunRecordedState(globalState.previousFullAction.clone());
          break;

        case 'macro':
          let recordedMacro = (await Register.get(vimState, transformation.register))?.text;
          if (!(recordedMacro instanceof RecordedState)) {
            return;
          }

          vimState.isReplayingMacro = true;

          if (transformation.register === ':') {
            await commandLine.Run(recordedMacro.commandString, vimState);
          } else if (transformation.replay === 'contentChange') {
            await modeHandler.runMacro(recordedMacro);
          } else {
            let keyStrokes: string[] = [];
            for (let action of recordedMacro.actionsRun) {
              keyStrokes = keyStrokes.concat(action.keysPressed);
            }
            vimState.recordedState = new RecordedState();
            await modeHandler.handleMultipleKeyEvents(keyStrokes);
          }

          vimState.isReplayingMacro = false;
          vimState.historyTracker.lastInvokedMacro = recordedMacro;

          if (vimState.lastMovementFailed) {
            // movement in last invoked macro failed then we should stop all following repeating macros.
            // Besides, we should reset `lastMovementFailed`.
            vimState.lastMovementFailed = false;
            return;
          }
          break;

        case 'contentChange':
          for (const change of transformation.changes) {
            await TextEditor.insert(vimState.editor, change.text);
            vimState.cursorStopPosition = vimState.editor.selection.start;
          }
          const newPos = vimState.cursorStopPosition.add(transformation.diff);
          vimState.editor.selection = new vscode.Selection(newPos, newPos);
          break;

        case 'tab':
          await vscode.commands.executeCommand('tab');
          if (transformation.diff) {
            if (transformation.cursorIndex === undefined) {
              throw new Error('No cursor index - this should never ever happen!');
            }

            if (!accumulatedPositionDifferences[transformation.cursorIndex]) {
              accumulatedPositionDifferences[transformation.cursorIndex] = [];
            }

            accumulatedPositionDifferences[transformation.cursorIndex].push(transformation.diff);
          }
          break;

        case 'reindent':
          await vscode.commands.executeCommand('editor.action.reindentselectedlines');
          if (transformation.diff) {
            if (transformation.cursorIndex === undefined) {
              throw new Error('No cursor index - this should never ever happen!');
            }

            if (!accumulatedPositionDifferences[transformation.cursorIndex]) {
              accumulatedPositionDifferences[transformation.cursorIndex] = [];
            }

            accumulatedPositionDifferences[transformation.cursorIndex].push(transformation.diff);
          }
          break;

        default:
          this.logger.warn(`Unhandled text transformation type: ${transformation.type}.`);
          break;
      }
    }

    const selections = vimState.editor.selections.map((sel) => {
      let range = Range.FromVSCodeSelection(sel);
      if (range.start.isBefore(range.stop)) {
        range = range.withNewStop(range.stop.getLeftThroughLineBreaks(true));
      }
      return new vscode.Selection(range.start, range.stop);
    });
    const firstTransformation = this.transformations[0];
    const manuallySetCursorPositions =
      (firstTransformation.type === 'deleteRange' ||
        firstTransformation.type === 'replaceText' ||
        firstTransformation.type === 'insertText') &&
      firstTransformation.manuallySetCursorPositions;

    // We handle multiple cursors in a different way in visual block mode, unfortunately.
    // TODO - refactor that out!
    if (vimState.currentMode !== Mode.VisualBlock && !manuallySetCursorPositions) {
      vimState.cursors = selections.map((sel, idx) => {
        const diffs = accumulatedPositionDifferences[idx] ?? [];
        if (vimState.recordedState.operatorPositionDiff) {
          diffs.push(vimState.recordedState.operatorPositionDiff);
        }

        return diffs.reduce(
          (cursor, diff) => new Range(cursor.start.add(diff), cursor.stop.add(diff)),
          Range.FromVSCodeSelection(sel)
        );
      });

      vimState.recordedState.operatorPositionDiff = undefined;
    } else if (accumulatedPositionDifferences[0]?.length > 0) {
      const diff = accumulatedPositionDifferences[0][0];
      vimState.cursorStopPosition = vimState.cursorStopPosition.add(diff);
      vimState.cursorStartPosition = vimState.cursorStartPosition.add(diff);
    }

    /**
     * This is a bit of a hack because Visual Block Mode isn't fully on board with
     * the new text transformation style yet.
     *
     * (TODO)
     */
    if (firstTransformation.type === 'deleteRange') {
      if (firstTransformation.collapseRange) {
        vimState.cursorStopPosition = new Position(
          vimState.cursorStopPosition.line,
          vimState.cursorStartPosition.character
        );
      }
    }

    vimState.recordedState.transformer = new Transformer();
  }
}
