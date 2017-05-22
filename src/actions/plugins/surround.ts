import { ModeName } from './../../mode/mode';
import { Position } from './../../common/motion/position';
import { Range } from './../../common/motion/range';
import { TextEditor } from './../../textEditor';
import { VimState } from './../../mode/modeHandler';
import { PairMatcher } from './../../common/matching/matcher';
import { Configuration } from './../../configuration/configuration';
import { RegisterAction } from './../base';
import { ChangeOperator, DeleteOperator, YankOperator } from './../operator';
import { BaseCommand } from './../commands/actions';
import { BaseMovement } from './../motion';
import {
  IMovement,
  MoveQuoteMatch, MoveASingleQuotes, MoveADoubleQuotes, MoveABacktick, MoveInsideCharacter, MoveACurlyBrace, MoveInsideTag,
  MoveAParentheses, MoveASquareBracket, MoveACaret, MoveAroundTag
} from './../motion';
import {
  TextObjectMovement, SelectInnerWord, SelectInnerBigWord, SelectInnerSentence, SelectInnerParagraph
} from './../textobject';


@RegisterAction
class CommandSurroundAddTarget extends BaseCommand {
  modes = [ModeName.SurroundInputMode];
  keys = [
    ["("], [")"],
    ["{"], ["}"],
    ["["], ["]"],
    ["<"], [">"],
    ["'"], ['"'], ["`"],
    ["t"],
    ["w"], ["W"], ["s"],
    ["p"]
  ];
  isCompleteAction = false;
  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (!vimState.surround) {
      return vimState;
    }

    vimState.surround.target = this.keysPressed[this.keysPressed.length - 1];

    // It's possible we're already done, e.g. dst
    await CommandSurroundAddToReplacement.TryToExecuteSurround(vimState, position);

    return vimState;
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.doesActionApply(vimState, keysPressed) &&
      !!(vimState.surround && vimState.surround.active &&
        !vimState.surround.target &&
        !vimState.surround.range);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.doesActionApply(vimState, keysPressed) &&
      !!(vimState.surround && vimState.surround.active &&
        !vimState.surround.target &&
        !vimState.surround.range);
  }
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
  modes = [ModeName.Normal];
  keys = ["s"];
  isCompleteAction = false;
  runsOnceForEveryCursor() { return false; }

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    return {
      start: position.getLineBeginRespectingIndent(),
      stop: position.getLineEnd().getLastWordEnd().getRight()
    };
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.doesActionApply(vimState, keysPressed) && vimState.surround !== undefined;
  }
}

@RegisterAction
class CommandSurroundModeStart extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["s"];
  isCompleteAction = false;
  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    // Only execute the action if the configuration is set
    if (!Configuration.surround) {
      return vimState;
    }

    const operator = vimState.recordedState.operator;
    let operatorString: "change" | "delete" | "yank" | undefined;

    if (operator instanceof ChangeOperator) { operatorString = "change"; }
    if (operator instanceof DeleteOperator) { operatorString = "delete"; }
    if (operator instanceof YankOperator) { operatorString = "yank"; }

    if (!operatorString) { return vimState; }

    // Start to record the keys to store for playback of surround using dot
    vimState.recordedState.surroundKeys.push(vimState.keyHistory[vimState.keyHistory.length - 2]);
    vimState.recordedState.surroundKeys.push("s");
    vimState.recordedState.surroundKeyIndexStart = vimState.keyHistory.length;

    vimState.surround = {
      active: true,
      target: undefined,
      operator: operatorString,
      replacement: undefined,
      range: undefined,
      isVisualLine: false
    };

    if (operatorString !== "yank") {
      vimState.currentMode = ModeName.SurroundInputMode;
    }

    return vimState;
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const hasSomeOperator = !!vimState.recordedState.operator;

    return super.doesActionApply(vimState, keysPressed) &&
      hasSomeOperator;
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const hasSomeOperator = !!vimState.recordedState.operator;

    return super.doesActionApply(vimState, keysPressed) &&
      hasSomeOperator;
  }
}

@RegisterAction
class CommandSurroundModeStartVisual extends BaseCommand {
  modes = [ModeName.Visual, ModeName.VisualLine];
  keys = ["S"];
  isCompleteAction = false;
  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    // Only execute the action if the configuration is set
    if (!Configuration.surround) {
      return vimState;
    }

    // Start to record the keys to store for playback of surround using dot
    vimState.recordedState.surroundKeys.push("S");
    vimState.recordedState.surroundKeyIndexStart = vimState.keyHistory.length;

    // Make sure cursor positions are ordered correctly for top->down or down->top selection
    if (vimState.cursorStartPosition.line > vimState.cursorPosition.line) {
      [vimState.cursorPosition, vimState.cursorStartPosition] =
        [vimState.cursorStartPosition, vimState.cursorPosition];
    }

    // Make sure start/end cursor positions are in order
    if (vimState.cursorPosition.line < vimState.cursorPosition.line ||
      (vimState.cursorPosition.line === vimState.cursorStartPosition.line
        && vimState.cursorPosition.character < vimState.cursorStartPosition.character)) {
      [vimState.cursorPosition, vimState.cursorStartPosition] = [vimState.cursorStartPosition, vimState.cursorPosition];
    }

    vimState.surround = {
      active: true,
      target: undefined,
      operator: "yank",
      replacement: undefined,
      range: new Range(vimState.cursorStartPosition, vimState.cursorPosition),
      isVisualLine: false
    };

    if (vimState.currentMode === ModeName.VisualLine) {
      vimState.surround.isVisualLine = true;
    }

    vimState.currentMode = ModeName.SurroundInputMode;
    vimState.cursorPosition = vimState.cursorStartPosition;

    return vimState;
  }
}


@RegisterAction
export class CommandSurroundAddToReplacement extends BaseCommand {
  modes = [ModeName.SurroundInputMode];
  keys = ["<any>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (!vimState.surround) {
      return vimState;
    }

    // Backspace modifies the tag entry
    if (vimState.surround.replacement !== undefined) {
      if (this.keysPressed[this.keysPressed.length - 1] === "<BS>" &&
        vimState.surround.replacement[0] === "<") {

        // Only allow backspace up until the < character
        if (vimState.surround.replacement.length > 1) {
          vimState.surround.replacement =
            vimState.surround.replacement.slice(0, vimState.surround.replacement.length - 1);
        }

        return vimState;
      }
    }

    if (!vimState.surround.replacement) {
      vimState.surround.replacement = "";
    }

    let stringToAdd = this.keysPressed[this.keysPressed.length - 1];

    // t should start creation of a tag
    if (this.keysPressed[0] === "t" && vimState.surround.replacement.length === 0) {
      stringToAdd = "<";
    }

    // Convert a few shortcuts to the correct surround characters when NOT entering a tag
    if (vimState.surround.replacement.length === 0) {
      if (stringToAdd === "b") { stringToAdd = "("; }
      if (stringToAdd === "B") { stringToAdd = "{"; }
      if (stringToAdd === "r") { stringToAdd = "["; }
    }

    vimState.surround.replacement += stringToAdd;

    await CommandSurroundAddToReplacement.TryToExecuteSurround(vimState, position);

    return vimState;
  }

  public static Finish(vimState: VimState): boolean {
    vimState.recordedState.hasRunOperator = false;
    vimState.recordedState.actionsRun = [];
    vimState.recordedState.hasRunSurround = true;
    vimState.surround = undefined;
    vimState.currentMode = ModeName.Normal;

    // Record keys that were pressed since surround started
    for (let i = vimState.recordedState.surroundKeyIndexStart; i < vimState.keyHistory.length; i++) {
      vimState.recordedState.surroundKeys.push(vimState.keyHistory[i]);
    }

    return false;
  }

  // we assume that we start directly on the characters we're operating over
  // e.g. cs{' starts us with start on { end on }.

  public static RemoveWhitespace(vimState: VimState, start: Position, stop: Position): void {
    const firstRangeStart = start.getRightThroughLineBreaks();
    let firstRangeEnd = start.getRightThroughLineBreaks();

    let secondRangeStart = stop.getLeftThroughLineBreaks();
    const secondRangeEnd = stop.getLeftThroughLineBreaks().getRight();

    if (firstRangeEnd.isEqual(secondRangeStart)) { return; }

    while (!firstRangeEnd.isEqual(stop) &&
      TextEditor.getCharAt(firstRangeEnd).match(/[ \t]/) &&
      !firstRangeEnd.isLineEnd()) {
      firstRangeEnd = firstRangeEnd.getRight();
    }

    while (!secondRangeStart.isEqual(firstRangeEnd) &&
      TextEditor.getCharAt(secondRangeStart).match(/[ \t]/) &&
      !secondRangeStart.isLineBeginning()) {
      secondRangeStart = secondRangeStart.getLeftThroughLineBreaks(false);
    }

    // Adjust range start based on found position
    secondRangeStart = secondRangeStart.getRight();

    const firstRange = new Range(firstRangeStart, firstRangeEnd);
    const secondRange = new Range(secondRangeStart, secondRangeEnd);

    vimState.recordedState.transformations.push({ type: "deleteRange", range: firstRange });
    vimState.recordedState.transformations.push({ type: "deleteRange", range: secondRange });
  }

  public static GetStartAndEndReplacements(replacement: string | undefined): { startReplace: string; endReplace: string; } {
    if (!replacement) { return { startReplace: "", endReplace: "" }; }

    let startReplace = replacement;
    let endReplace = replacement;

    if (startReplace[0] === "<") {
      let tagName = /([-\w]+)/.exec(startReplace);
      if (tagName) {
        endReplace = `</${tagName[1]}>`;
      } else {
        endReplace = "</" + startReplace.slice(1);
      }
    }

    if (startReplace.length === 1 && startReplace in PairMatcher.pairings) {
      endReplace = PairMatcher.pairings[startReplace].match;

      if (!PairMatcher.pairings[startReplace].nextMatchIsForward) {
        [startReplace, endReplace] = [endReplace, startReplace];
      } else {
        startReplace = startReplace + " ";
        endReplace = " " + endReplace;
      }
    }

    return { startReplace, endReplace };
  }

  // Returns true if it could actually find something to run surround on.
  public static async TryToExecuteSurround(vimState: VimState, position: Position): Promise<boolean> {
    const { target, replacement, operator } = vimState.surround!;

    if (operator === "change" || operator === "yank") {
      if (!replacement) {
        return false;
      }

      // This is an incomplete tag. Wait for the user to finish it.
      if (replacement[0] === "<" && replacement[replacement.length - 1] !== ">") {
        return false;
      }
    }

    let { startReplace, endReplace } = this.GetStartAndEndReplacements(replacement);

    if (operator === "yank") {
      if (!vimState.surround) { return false; }
      if (!vimState.surround.range) { return false; }

      let start = vimState.surround.range.start;
      let stop = vimState.surround.range.stop;

      stop = stop.getRight();

      if (vimState.surround.isVisualLine) {
        startReplace = startReplace + "\n";
        endReplace = "\n" + endReplace;
      }

      vimState.recordedState.transformations.push({ type: "insertText", text: startReplace, position: start });
      vimState.recordedState.transformations.push({ type: "insertText", text: endReplace, position: stop });

      return CommandSurroundAddToReplacement.Finish(vimState);
    }

    let startReplaceRange: Range | undefined;
    let endReplaceRange: Range | undefined;
    let startDeleteRange: Range | undefined;
    let endDeleteRange: Range | undefined;

    const quoteMatches: { char: string; movement: () => MoveQuoteMatch }[] = [
      { char: "'", movement: () => new MoveASingleQuotes() },
      { char: '"', movement: () => new MoveADoubleQuotes() },
      { char: "`", movement: () => new MoveABacktick() },
    ];

    for (const { char, movement } of quoteMatches) {
      if (char !== target) { continue; }

      const { start, stop, failed } = await movement().execAction(position, vimState);

      if (failed) { return CommandSurroundAddToReplacement.Finish(vimState); }

      startReplaceRange = new Range(start, start.getRight());
      endReplaceRange = new Range(stop, stop.getRight());
    }

    const pairedMatchings: { open: string, close: string, movement: () => MoveInsideCharacter }[] = [
      { open: "{", close: "}", movement: () => new MoveACurlyBrace() },
      { open: "[", close: "]", movement: () => new MoveASquareBracket() },
      { open: "(", close: ")", movement: () => new MoveAParentheses() },
      { open: "<", close: ">", movement: () => new MoveACaret() },
    ];

    for (const { open, close, movement } of pairedMatchings) {
      if (target !== open && target !== close) { continue; }

      let { start, stop, failed } = await movement().execAction(position, vimState);

      if (failed) { return CommandSurroundAddToReplacement.Finish(vimState); }

      stop = stop.getLeft();

      startReplaceRange = new Range(start, start.getRight());
      endReplaceRange = new Range(stop, stop.getRight());

      if (target === open) {
        CommandSurroundAddToReplacement.RemoveWhitespace(vimState, start, stop);
      }
    }

    if (target === "t") {
      let { start, stop, failed } = await new MoveAroundTag().execAction(position, vimState);
      let tagEnd = await new MoveInsideTag().execAction(position, vimState);

      if (failed || tagEnd.failed) { return CommandSurroundAddToReplacement.Finish(vimState); }

      stop = stop.getRight();
      tagEnd.stop = tagEnd.stop.getRight();

      if (failed) { return CommandSurroundAddToReplacement.Finish(vimState); }

      startReplaceRange = new Range(start, start.getRight());
      endReplaceRange = new Range(tagEnd.stop, tagEnd.stop.getRight());

      startDeleteRange = new Range(start.getRight(), tagEnd.start);
      endDeleteRange = new Range(tagEnd.stop.getRight(), stop);
    }

    if (operator === "change") {
      if (!replacement) { return false; }
      const wordMatchings: { char: string, movement: () => TextObjectMovement, addNewline: "no" | "end-only" | "both" }[] = [
        { char: "w", movement: () => new SelectInnerWord(), addNewline: "no" },
        { char: "p", movement: () => new SelectInnerParagraph(), addNewline: "both" },
        { char: "s", movement: () => new SelectInnerSentence(), addNewline: "end-only" },
        { char: "W", movement: () => new SelectInnerBigWord(), addNewline: "no" },
      ];

      for (const { char, movement, addNewline } of wordMatchings) {
        if (target !== char) { continue; }

        let { stop, start, failed } = await movement().execAction(position, vimState) as IMovement;

        stop = stop.getRight();

        if (failed) { return CommandSurroundAddToReplacement.Finish(vimState); }

        if (addNewline === "end-only" || addNewline === "both") { endReplace = "\n" + endReplace; }
        if (addNewline === "both") { startReplace += "\n"; }

        vimState.recordedState.transformations.push({ type: "insertText", text: startReplace, position: start });
        vimState.recordedState.transformations.push({ type: "insertText", text: endReplace, position: stop });

        return CommandSurroundAddToReplacement.Finish(vimState);
      }
    }

    // We've got our ranges. Run the surround command with the appropriate operator.

    if (!startReplaceRange && !endReplaceRange && !startDeleteRange && !endDeleteRange) {
      return false;
    }

    if (operator === "change") {
      if (!replacement) { return false; }

      if (startReplaceRange) { TextEditor.replaceText(vimState, startReplace, startReplaceRange.start, startReplaceRange.stop); }
      if (endReplaceRange) { TextEditor.replaceText(vimState, endReplace, endReplaceRange.start, endReplaceRange.stop); }
      if (startDeleteRange) { vimState.recordedState.transformations.push({ type: "deleteRange", range: startDeleteRange }); }
      if (endDeleteRange) { vimState.recordedState.transformations.push({ type: "deleteRange", range: endDeleteRange }); }

      return CommandSurroundAddToReplacement.Finish(vimState);
    }

    if (operator === "delete") {
      if (startReplaceRange) { vimState.recordedState.transformations.push({ type: "deleteRange", range: startReplaceRange }); }
      if (endReplaceRange) { vimState.recordedState.transformations.push({ type: "deleteRange", range: endReplaceRange }); }

      if (startDeleteRange) { vimState.recordedState.transformations.push({ type: "deleteRange", range: startDeleteRange }); }
      if (endDeleteRange) { vimState.recordedState.transformations.push({ type: "deleteRange", range: endDeleteRange }); }

      return CommandSurroundAddToReplacement.Finish(vimState);
    }

    return false;
  }
}