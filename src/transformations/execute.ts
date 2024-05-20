import * as vscode from 'vscode';
import { ExCommandLine } from '../cmd_line/commandLine';
import { Cursor } from '../common/motion/cursor';
import { PositionDiff } from '../common/motion/position';
import { Globals } from '../globals';
import { Mode } from '../mode/mode';
import { Register } from '../register/register';
import { globalState } from '../state/globalState';
import { RecordedState } from '../state/recordedState';
import { VimState } from '../state/vimState';
import { TextEditor } from '../textEditor';
import { Logger } from '../util/logger';
import { keystrokesExpressionParser } from '../vimscript/expression';
import {
  Dot,
  InsertTextVSCodeTransformation,
  TextTransformations,
  Transformation,
  areAllSameTransformation,
  isMultiCursorTextTransformation,
  isTextTransformation,
  overlappingTransformations,
} from './transformations';
import { Transformer } from './transformer';

export interface IModeHandler {
  vimState: VimState;

  updateView(args?: { drawSelection: boolean; revealRange: boolean }): Promise<void>;
  runMacro(recordedMacro: RecordedState): Promise<void>;
  handleMultipleKeyEvents(keys: string[]): Promise<void>;
  rerunRecordedState(transformation: Dot): Promise<void>;
}

export async function executeTransformations(
  modeHandler: IModeHandler,
  transformations: Transformation[],
) {
  if (transformations.length === 0) {
    return;
  }

  const vimState = modeHandler.vimState;

  const textTransformations = transformations.filter((x): x is TextTransformations =>
    isTextTransformation(x),
  );
  const multicursorTextTransformations: InsertTextVSCodeTransformation[] = transformations.filter(
    (x): x is InsertTextVSCodeTransformation => isMultiCursorTextTransformation(x),
  );

  const otherTransformations = transformations.filter(
    (x) => !isTextTransformation(x) && !isMultiCursorTextTransformation(x),
  );

  const accumulatedPositionDifferences: { [key: number]: PositionDiff[] } = {};

  const doTextEditorEdit = (command: TextTransformations, edit: vscode.TextEditorEdit) => {
    switch (command.type) {
      case 'insertText':
        edit.insert(command.position, command.text);
        break;
      case 'replaceText':
        edit.replace(command.range, command.text);
        break;
      case 'deleteRange':
        edit.delete(command.range);
        break;
      case 'moveCursor':
        break;
      default:
        Logger.warn(`Unhandled text transformation type: ${command.type}.`);
        break;
    }

    if (command.diff) {
      if (command.cursorIndex === undefined) {
        throw new Error('No cursor index - this should never ever happen!');
      }

      if (!accumulatedPositionDifferences[command.cursorIndex]) {
        accumulatedPositionDifferences[command.cursorIndex] = [];
      }

      accumulatedPositionDifferences[command.cursorIndex].push(command.diff);
    }
  };

  if (textTransformations.length > 0) {
    const overlapping = overlappingTransformations(textTransformations);
    if (overlapping !== undefined) {
      const msg = `Transformations overlapping: ${JSON.stringify(overlapping)}`;
      Logger.warn(msg);
      if (Globals.isTesting) {
        throw new Error(msg);
      }

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
      try {
        await vimState.editor.edit((edit) => {
          for (const command of textTransformations) {
            doTextEditorEdit(command, edit);
          }
        });
      } catch (e) {
        // Messages like "TextEditor(vs.editor.ICodeEditor:1,$model8) has been disposed" can be ignored.
        // They occur when the user switches to a new tab while an action is running.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (e.name !== 'DISPOSED') {
          throw e;
        }
      }
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
      Logger.warn(`Unhandled multicursor transformations. Not all transformations are the same!`);
    }
  }

  for (const transformation of otherTransformations) {
    switch (transformation.type) {
      case 'insertTextVSCode':
        await TextEditor.insert(vimState.editor, transformation.text);
        vimState.cursors[0] = Cursor.FromVSCodeSelection(vimState.editor.selection);
        break;

      case 'replayRecordedState':
        await modeHandler.rerunRecordedState(transformation);
        break;

      case 'macro':
        const recordedMacro = (await Register.get(transformation.register))?.text;
        if (!recordedMacro) {
          return;
        } else if (typeof recordedMacro === 'string') {
          // A string was set to the register. We need to execute the characters as if they were typed (in normal mode).
          const keystrokes = keystrokesExpressionParser.parse(recordedMacro);
          if (!keystrokes.status) {
            throw new Error(`Failed to execute macro: ${recordedMacro}`);
          }

          vimState.isReplayingMacro = true;

          vimState.recordedState = new RecordedState();
          await modeHandler.handleMultipleKeyEvents(keystrokes.value);

          // Set the executed register as the registerName, otherwise the last action register is used.
          vimState.recordedState.registerName = transformation.register;

          globalState.lastInvokedMacro = vimState.recordedState;
          vimState.isReplayingMacro = false;

          if (vimState.lastMovementFailed) {
            // movement in last invoked macro failed then we should stop all following repeating macros.
            // Besides, we should reset `lastMovementFailed`.
            vimState.lastMovementFailed = false;
            return;
          }
        } else {
          vimState.isReplayingMacro = true;

          vimState.recordedState = new RecordedState();
          if (transformation.register === ':') {
            await new ExCommandLine(recordedMacro.commandString, vimState.currentMode).run(
              vimState,
            );
          } else if (transformation.replay === 'contentChange') {
            await modeHandler.runMacro(recordedMacro);
          } else {
            let keyStrokes: string[] = [];
            for (const action of recordedMacro.actionsRun) {
              keyStrokes = keyStrokes.concat(action.keysPressed);
            }
            await modeHandler.handleMultipleKeyEvents(keyStrokes);
          }

          // TODO: Copied from `BaseAction.execCount`. This is all terrible.
          for (const t of vimState.recordedState.transformer.transformations) {
            if (isTextTransformation(t) && t.cursorIndex === undefined) {
              t.cursorIndex = 0;
            }
          }

          await executeTransformations(
            modeHandler,
            vimState.recordedState.transformer.transformations,
          );

          globalState.lastInvokedMacro = recordedMacro;
          vimState.isReplayingMacro = false;

          if (vimState.lastMovementFailed) {
            // movement in last invoked macro failed then we should stop all following repeating macros.
            // Besides, we should reset `lastMovementFailed`.
            vimState.lastMovementFailed = false;
            return;
          }
        }
        break;

      case 'contentChange':
        for (const change of transformation.changes) {
          await TextEditor.insert(vimState.editor, change.text);
          vimState.cursorStopPosition = vimState.editor.selection.start;
        }
        const newPos = vimState.cursorStopPosition.add(vimState.document, transformation.diff);
        vimState.editor.selection = new vscode.Selection(newPos, newPos);
        break;

      case 'vscodeCommand':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await vscode.commands.executeCommand(transformation.command, ...transformation.args);
        break;

      default:
        Logger.warn(`Unhandled text transformation type: ${transformation.type}.`);
        break;
    }
  }

  let selections;
  if (vimState.currentMode === Mode.Insert) {
    // Insert mode selections do not need to be modified
    selections = vimState.editor.selections;
  } else {
    selections = vimState.editor.selections.map((sel) => {
      let range = Cursor.FromVSCodeSelection(sel);
      if (range.start.isBefore(range.stop)) {
        range = range.withNewStop(range.stop.getLeftThroughLineBreaks(true));
      }
      return new vscode.Selection(range.start, range.stop);
    });
  }
  const firstTransformation = transformations[0];
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
        (cursor, diff) =>
          new Cursor(
            cursor.start.add(vimState.document, diff),
            cursor.stop.add(vimState.document, diff),
          ),
        Cursor.FromVSCodeSelection(sel),
      );
    });

    vimState.recordedState.operatorPositionDiff = undefined;
  } else if (accumulatedPositionDifferences[0]?.length > 0) {
    const diff = accumulatedPositionDifferences[0][0];
    vimState.cursorStopPosition = vimState.cursorStopPosition.add(vimState.document, diff);
    vimState.cursorStartPosition = vimState.cursorStartPosition.add(vimState.document, diff);
  }

  vimState.recordedState.transformer = new Transformer();
}
