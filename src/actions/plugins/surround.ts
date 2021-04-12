import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';
import { PairMatcher } from './../../common/matching/matcher';
import { PositionDiff, sorted } from './../../common/motion/position';
import { Range } from './../../common/motion/range';
import { configuration } from './../../configuration/configuration';
import { Mode } from './../../mode/mode';
import { TextEditor } from './../../textEditor';
import { RegisterAction, BaseCommand } from './../base';
import { BaseMovement, IMovement } from '../baseMotion';
import {
  MoveAroundBacktick,
  MoveAroundCaret,
  MoveAroundCurlyBrace,
  MoveAroundDoubleQuotes,
  MoveAroundParentheses,
  MoveAroundTag,
  MoveAroundSingleQuotes,
  MoveAroundSquareBracket,
  MoveInsideTag,
} from '../motion';
import { ChangeOperator, DeleteOperator, YankOperator } from './../operator';
import {
  SelectInnerBigWord,
  SelectInnerParagraph,
  SelectInnerSentence,
  SelectInnerWord,
  TextObjectMovement,
} from '../../textobject/textobject';
import { Position } from 'vscode';
import { WordType } from '../../textobject/word';

export interface SurroundState {
  /** The operator paired with the surround action. "yank" is really "add", but it uses 'y' */
  operator: 'change' | 'delete' | 'yank';

  target: string | undefined;

  replacement: string | undefined;

  range: vscode.Range | undefined;

  /** The mode before surround was triggered */
  previousMode: Mode;
}

// Aaaaagghhhh. I tried so hard to make surround an operator to make use of our
// sick new operator repeat structure, but there's just no clean way to do it.
// In the future, if somebody wants to refactor Surround, the big problem for
// why it's so weird is that typing `ys` loads up the Yank operator first,
// which prevents us from making a surround operator that's `ys` or something.
// You'd need to refactor our keybinding handling to "give up" keystrokes if it
// can't find a match.

@RegisterAction
class CommandSurroundModeRepeat extends BaseMovement {
  modes = [Mode.Normal];
  keys = ['s'];
  isCompleteAction = false;
  runsOnceForEveryCursor() {
    return false;
  }

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    return {
      start: position.getLineBeginRespectingIndent(vimState.document),
      stop: position.getLineEnd().prevWordEnd(vimState.document).getRight(),
    };
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.doesActionApply(vimState, keysPressed) && vimState.surround !== undefined;
  }
}

@RegisterAction
class CommandSurroundModeStart extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['s'];
  isCompleteAction = false;
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    // Only execute the action if the configuration is set
    if (!configuration.surround) {
      return;
    }

    const operator = vimState.recordedState.operator;

    let operatorString: 'change' | 'delete' | 'yank';
    if (operator instanceof ChangeOperator) {
      operatorString = 'change';
    } else if (operator instanceof DeleteOperator) {
      operatorString = 'delete';
    } else if (operator instanceof YankOperator) {
      operatorString = 'yank';
    } else {
      return;
    }

    // Start to record the keys to store for playback of surround using dot
    vimState.recordedState.surroundKeys.push(vimState.keyHistory[vimState.keyHistory.length - 2]);
    vimState.recordedState.surroundKeys.push('s');
    vimState.recordedState.surroundKeyIndexStart = vimState.keyHistory.length;

    vimState.surround = {
      target: undefined,
      operator: operatorString,
      replacement: undefined,
      range: undefined,
      previousMode: vimState.currentMode,
    };

    if (operatorString !== 'yank') {
      await vimState.setCurrentMode(Mode.SurroundInputMode);
    }
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const hasSomeOperator = !!vimState.recordedState.operator;

    return super.doesActionApply(vimState, keysPressed) && hasSomeOperator;
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const hasSomeOperator = !!vimState.recordedState.operator;

    return super.doesActionApply(vimState, keysPressed) && hasSomeOperator;
  }
}

@RegisterAction
class CommandSurroundModeStartVisual extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  keys = ['S'];
  isCompleteAction = false;
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    // Only execute the action if the configuration is set
    if (!configuration.surround) {
      return;
    }

    // Start to record the keys to store for playback of surround using dot
    vimState.recordedState.surroundKeys.push('S');
    vimState.recordedState.surroundKeyIndexStart = vimState.keyHistory.length;

    let [start, end] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);
    if (vimState.currentMode === Mode.VisualLine) {
      [start, end] = [start.getLineBegin(), end.getLineEnd()];
    }

    vimState.surround = {
      target: undefined,
      operator: 'yank',
      replacement: undefined,
      range: new vscode.Range(start, end),
      previousMode: vimState.currentMode,
    };

    await vimState.setCurrentMode(Mode.SurroundInputMode);

    // Put the cursor at the beginning of the visual selection
    vimState.cursorStopPosition = start;
    vimState.cursorStartPosition = start;
  }
}

@RegisterAction
class CommandSurroundAddTarget extends BaseCommand {
  modes = [Mode.SurroundInputMode];
  keys = [
    ['('],
    [')'],
    ['{'],
    ['}'],
    ['['],
    [']'],
    ['<'],
    ['>'],
    ["'"],
    ['"'],
    ['`'],
    ['t'],
    ['w'],
    ['W'],
    ['s'],
    ['p'],
    ['b'],
    ['B'],
    ['r'],
    ['a'],
  ];
  isCompleteAction = false;
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (!vimState.surround) {
      return;
    }

    vimState.surround.target = this.keysPressed[this.keysPressed.length - 1];

    if (vimState.surround.target === 'b') {
      vimState.surround.target = ')';
    } else if (vimState.surround.target === 'B') {
      vimState.surround.target = '}';
    } else if (vimState.surround.target === 'r') {
      vimState.surround.target = ']';
    } else if (vimState.surround.target === 'a') {
      vimState.surround.target = '>';
    }

    // It's possible we're already done, e.g. dst
    if (await CommandSurroundAddToReplacement.tryToExecuteSurround(vimState, position)) {
      this.isCompleteAction = true;
    }
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return (
      super.doesActionApply(vimState, keysPressed) &&
      !!(vimState.surround && !vimState.surround.target && !vimState.surround.range)
    );
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return (
      super.doesActionApply(vimState, keysPressed) &&
      !!(vimState.surround && !vimState.surround.target && !vimState.surround.range)
    );
  }
}

@RegisterAction
class CommandSurroundAddToReplacement extends BaseCommand {
  modes = [Mode.SurroundInputMode];
  keys = ['<any>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (!vimState.surround) {
      return;
    }

    // Backspace modifies the tag entry
    if (vimState.surround.replacement !== undefined) {
      if (
        this.keysPressed[this.keysPressed.length - 1] === '<BS>' &&
        vimState.surround.replacement[0] === '<'
      ) {
        // Only allow backspace up until the < character
        if (vimState.surround.replacement.length > 1) {
          vimState.surround.replacement = vimState.surround.replacement.slice(
            0,
            vimState.surround.replacement.length - 1
          );
        }

        return;
      }
    }

    if (!vimState.surround.replacement) {
      vimState.surround.replacement = '';
    }

    let stringToAdd = this.keysPressed[this.keysPressed.length - 1];

    // t should start creation of a tag
    if (this.keysPressed[0] === 't' && vimState.surround.replacement.length === 0) {
      stringToAdd = '<';
    }

    // Convert a few shortcuts to the correct surround characters when NOT entering a tag
    if (vimState.surround.replacement.length === 0) {
      if (stringToAdd === 'b') {
        stringToAdd = ')';
      }
      if (stringToAdd === 'B') {
        stringToAdd = '}';
      }
      if (stringToAdd === 'r') {
        stringToAdd = ']';
      }
      if (stringToAdd === 'a') {
        stringToAdd = '>';
      }
    }

    vimState.surround.replacement += stringToAdd;

    if (await CommandSurroundAddToReplacement.tryToExecuteSurround(vimState, position)) {
      this.isCompleteAction = true;
    }
  }

  // we assume that we start directly on the characters we're operating over
  // e.g. cs{' starts us with start on { end on }.

  private static removeWhitespace(vimState: VimState, start: Position, stop: Position): void {
    const firstRangeStart = start.getRight();
    let firstRangeEnd = start.getRight();

    let secondRangeStart = stop.getLeftThroughLineBreaks();
    let secondRangeEnd = stop.getLeftThroughLineBreaks().getRight();
    if (stop.isLineBeginning()) {
      secondRangeStart = stop;
      secondRangeEnd = stop.getRight();
    }

    if (firstRangeEnd.isEqual(secondRangeStart)) {
      return;
    }

    while (
      !firstRangeEnd.isEqual(stop) &&
      !firstRangeEnd.isLineEnd() &&
      TextEditor.getCharAt(vimState.document, firstRangeEnd).match(/[ \t]/)
    ) {
      firstRangeEnd = firstRangeEnd.getRight();
    }

    while (
      !secondRangeStart.isEqual(firstRangeEnd) &&
      TextEditor.getCharAt(vimState.document, secondRangeStart).match(/[ \t]/) &&
      !secondRangeStart.isLineBeginning()
    ) {
      secondRangeStart = secondRangeStart.getLeftThroughLineBreaks(false);
    }

    // Adjust range start based on found position
    secondRangeStart = secondRangeStart.getRight();

    const firstRange = new Range(firstRangeStart, firstRangeEnd);
    const secondRange = new Range(secondRangeStart, secondRangeEnd);

    vimState.recordedState.transformer.addTransformation({
      type: 'deleteRange',
      range: firstRange,
    });
    vimState.recordedState.transformer.addTransformation({
      type: 'deleteRange',
      range: secondRange,
    });
  }

  private static getStartAndEndReplacements(
    replacement: string | undefined
  ): { startReplace: string; endReplace: string } {
    if (!replacement) {
      return { startReplace: '', endReplace: '' };
    }

    let startReplace = replacement;
    let endReplace = replacement;

    if (startReplace[0] === '<') {
      const tagName = /([-\w.]+)/.exec(startReplace);
      if (tagName) {
        endReplace = `</${tagName[1]}>`;
      } else {
        endReplace = '</' + startReplace.slice(1);
      }
    }

    if (startReplace.length === 1 && startReplace in PairMatcher.pairings) {
      endReplace = PairMatcher.pairings[startReplace].match;

      if (!PairMatcher.pairings[startReplace].isNextMatchForward) {
        [startReplace, endReplace] = [endReplace, startReplace];
      } else {
        startReplace = startReplace + ' ';
        endReplace = ' ' + endReplace;
      }
    }

    return { startReplace, endReplace };
  }

  /** Returns true if it could actually find something to run surround on. */
  public static async tryToExecuteSurround(
    vimState: VimState,
    position: Position
  ): Promise<boolean> {
    const { target, operator } = vimState.surround!;
    let replacement = vimState.surround!.replacement;

    // Only relevant when changing a tag to another tag (`cst<`)
    let retainAttributes = false;

    if (operator === 'change' || operator === 'yank') {
      if (!replacement) {
        return false;
      }

      // The replacement is a tag - is it complete?
      if (replacement[0] === '<') {
        const replacementEnd = replacement[replacement.length - 1];

        // If enter is used, retain the html attributes if possible and consider this tag done
        if (replacementEnd === '\n') {
          replacement = replacement.slice(0, replacement.length - 1);
          retainAttributes = true;
        } else if (replacementEnd !== '>') {
          // The tag isn't complete yet
          return false;
        }
      }
    }

    // Get the text to be added before and after, in the case of tags or paired characters
    let { startReplace, endReplace } = this.getStartAndEndReplacements(replacement);

    if (operator === 'yank') {
      if (!vimState.surround?.range) {
        return false;
      }

      const start = vimState.surround.range.start;
      let end = vimState.surround.range.end;

      if (TextEditor.getCharAt(vimState.document, end) !== ' ') {
        end = end.getRight();
      }

      if (vimState.surround.previousMode === Mode.VisualLine) {
        startReplace = startReplace + '\n';
        endReplace = '\n' + endReplace;
      }

      vimState.recordedState.transformer.addTransformation({
        type: 'insertText',
        text: startReplace,
        position: start,
        // This PositionDiff places the cursor at the start of startReplace text the we insert rather than after
        diff: PositionDiff.offset({ character: -startReplace.length }),
      });
      vimState.recordedState.transformer.addTransformation({
        type: 'insertText',
        text: endReplace,
        position: end,
      });

      return CommandSurroundAddToReplacement.finish(vimState);
    }

    let replaceRanges: [Range, Range] | undefined;

    // Target: symmetrical text object (quotes)
    for (const { char, movement } of [
      { char: "'", movement: () => new MoveAroundSingleQuotes() },
      { char: '"', movement: () => new MoveAroundDoubleQuotes() },
      { char: '`', movement: () => new MoveAroundBacktick() },
    ]) {
      if (char !== target) {
        continue;
      }

      const { start, stop, failed } = await movement().execAction(position, vimState);

      if (failed) {
        return CommandSurroundAddToReplacement.finish(vimState);
      }

      replaceRanges = [new Range(start, start.getRight()), new Range(stop, stop.getRight())];
    }

    // Target: asymmetrical text object (parentheses, brackets, etc.)
    for (const { open, close, movement } of [
      { open: '{', close: '}', movement: () => new MoveAroundCurlyBrace() },
      { open: '[', close: ']', movement: () => new MoveAroundSquareBracket() },
      { open: '(', close: ')', movement: () => new MoveAroundParentheses() },
      { open: '<', close: '>', movement: () => new MoveAroundCaret() },
    ]) {
      if (target !== open && target !== close) {
        continue;
      }

      let { start, stop, failed } = await movement().execAction(position, vimState);

      if (failed) {
        return CommandSurroundAddToReplacement.finish(vimState);
      }

      stop = stop.getLeft();

      replaceRanges = [new Range(start, start.getRight()), new Range(stop, stop.getRight())];

      if (target === open) {
        CommandSurroundAddToReplacement.removeWhitespace(vimState, start, stop);
      }
    }

    if (target === 't') {
      // `MoveInsideTag` must be run first as otherwise the search will
      // look for the next enclosing tag after having selected the first
      const innerTagContent = await new MoveInsideTag().execAction(position, vimState);
      const { start, stop, failed } = await new MoveAroundTag().execAction(position, vimState);

      if (failed || innerTagContent.failed) {
        return CommandSurroundAddToReplacement.finish(vimState);
      }

      replaceRanges = [
        new Range(
          start,
          retainAttributes
            ? start.nextWordEnd(vimState.document, { wordType: WordType.Big }).getRight()
            : innerTagContent.start
        ),
        new Range(innerTagContent.stop.getRight(), stop.getRight()),
      ];
    }

    // Special case: 'change' with targets w(ord), W(ord), s(entence), p(aragraph)
    // is a shortcut for 'yank' with an inner text object (e.g. `csw]` is the same as `ysiw]`)
    if (operator === 'change') {
      let textObj: (new () => TextObjectMovement) | undefined;
      let addNewline: 'no' | 'end-only' | 'both' = 'no';
      if (target === 'w') {
        [textObj, addNewline] = [SelectInnerWord, 'no'];
      } else if (target === 'W') {
        [textObj, addNewline] = [SelectInnerBigWord, 'no'];
      } else if (target === 'p') {
        [textObj, addNewline] = [SelectInnerParagraph, 'both'];
      } else if (target === 's') {
        [textObj, addNewline] = [SelectInnerSentence, 'end-only'];
      }

      if (textObj !== undefined) {
        let { start, stop, failed } = await new textObj().execAction(position, vimState);

        if (failed) {
          return CommandSurroundAddToReplacement.finish(vimState);
        }

        stop = stop.getRight();

        if (addNewline === 'end-only' || addNewline === 'both') {
          endReplace = '\n' + endReplace;
        }
        if (addNewline === 'both') {
          startReplace += '\n';
        }

        vimState.recordedState.transformer.addTransformation({
          type: 'insertText',
          text: startReplace,
          position: start,
        });
        vimState.recordedState.transformer.addTransformation({
          type: 'insertText',
          text: endReplace,
          position: stop,
        });

        return CommandSurroundAddToReplacement.finish(vimState);
      }
    }

    // We've got our ranges. Run the surround command with the appropriate operator.

    if (!replaceRanges) {
      return false;
    }

    if (operator === 'change') {
      if (replaceRanges) {
        const [startReplaceRange, endReplaceRange] = replaceRanges;
        vimState.recordedState.transformer.addTransformation({
          type: 'replaceText',
          text: startReplace,
          range: startReplaceRange,
        });
        vimState.recordedState.transformer.addTransformation({
          type: 'replaceText',
          text: endReplace,
          range: endReplaceRange,
        });
      }

      return CommandSurroundAddToReplacement.finish(vimState);
    }

    if (operator === 'delete') {
      if (replaceRanges) {
        const [startReplaceRange, endReplaceRange] = replaceRanges;
        vimState.recordedState.transformer.addTransformation({
          type: 'deleteRange',
          range: startReplaceRange,
        });
        vimState.recordedState.transformer.addTransformation({
          type: 'deleteRange',
          range: endReplaceRange,
        });
      }

      return CommandSurroundAddToReplacement.finish(vimState);
    }

    return false;
  }

  private static async finish(vimState: VimState): Promise<boolean> {
    vimState.recordedState.hasRunOperator = false;
    vimState.recordedState.actionsRun = [];
    vimState.recordedState.hasRunSurround = true;
    vimState.surround = undefined;
    await vimState.setCurrentMode(Mode.Normal);

    // Record keys that were pressed since surround started
    for (
      let i = vimState.recordedState.surroundKeyIndexStart;
      i < vimState.keyHistory.length;
      i++
    ) {
      vimState.recordedState.surroundKeys.push(vimState.keyHistory[i]);
    }

    return true;
  }
}
