import { VimState } from '../../state/vimState';
import { PairMatcher } from './../../common/matching/matcher';
import { Position, PositionDiff, sorted } from './../../common/motion/position';
import { Range } from './../../common/motion/range';
import { configuration } from './../../configuration/configuration';
import { Mode, isVisualMode } from './../../mode/mode';
import { TextEditor } from './../../textEditor';
import { RegisterAction, RegisterPluginAction, BaseCommand } from './../base';
import { BaseMovement, IMovement } from '../baseMotion';
import {
  MoveABacktick,
  MoveACaret,
  MoveACurlyBrace,
  MoveADoubleQuotes,
  MoveAParentheses,
  MoveAroundTag,
  MoveASingleQuotes,
  MoveASquareBracket,
  MoveInsideCharacter,
  MoveInsideTag,
  MoveQuoteMatch,
} from '../motion';
import { ChangeOperator, DeleteOperator, YankOperator, BaseOperator } from './../operator';
import {
  SelectInnerBigWord,
  SelectInnerParagraph,
  SelectInnerSentence,
  SelectInnerWord,
  TextObjectMovement,
} from './../textobject';
import { RegisterMode } from '../../register/register';

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

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (!vimState.surround) {
      return vimState;
    }

    vimState.surround.target = this.keysPressed[this.keysPressed.length - 1];

    if (vimState.surround.target === 'b') {
      vimState.surround.target = ')';
    }

    if (vimState.surround.target === 'B') {
      vimState.surround.target = '}';
    }

    if (vimState.surround.target === 'r') {
      vimState.surround.target = ']';
    }

    if (vimState.surround.target === 'a') {
      vimState.surround.target = '>';
    }

    // It's possible we're already done, e.g. dst
    if (await CommandSurroundAddToReplacement.TryToExecuteSurround(vimState, position)) {
      this.isCompleteAction = true;
    }

    return vimState;
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return (
      super.doesActionApply(vimState, keysPressed) &&
      !!(
        vimState.surround &&
        vimState.surround.active &&
        !vimState.surround.target &&
        !vimState.surround.range
      )
    );
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return (
      super.doesActionApply(vimState, keysPressed) &&
      !!(
        vimState.surround &&
        vimState.surround.active &&
        !vimState.surround.target &&
        !vimState.surround.range
      )
    );
  }
}

async function StartSurroundMode(
  vimState: VimState,
  operatorString: 'change' | 'delete' | 'yank' | undefined = undefined,
  keys: string[],
  start: Position | undefined,
  end: Position | undefined,
  registerMode: RegisterMode | undefined
): Promise<VimState> {
  // Only execute the action if the configuration is set
  if (!configuration.surround || !operatorString || keys.length === 0) {
    return vimState;
  }

  // Start to record the keys to store for playback of surround using dot
  vimState.recordedState.surroundKeys.push(keys[0]);
  if (operatorString === 'yank' && vimState.recordedState.operator) {
    // include the motion keys after the operator
    vimState.recordedState.surroundKeyIndexStart =
      vimState.keyHistory.length - vimState.recordedState.actionKeys.length;
  } else {
    vimState.recordedState.surroundKeyIndexStart = vimState.keyHistory.length;
  }

  let range: Range | undefined = undefined;
  if (start && end) {
    range = new Range(start, end);
  }

  vimState.surround = {
    active: true,
    target: undefined,
    operator: operatorString,
    replacement: undefined,
    range: range,
    previousMode: vimState.currentMode,
    forcedRegisterMode: registerMode,
  };

  if (operatorString === 'yank' && start) {
    if (isVisualMode(vimState.surround.previousMode) && end) {
      // Put the cursor at the beginning of the visual selection
      vimState.cursorStopPosition = start;
      vimState.cursorStartPosition = start;
    } else {
      vimState.cursorStopPosition = start;
      vimState.cursorStartPosition = start;
    }
  }
  await vimState.setCurrentMode(Mode.SurroundInputMode);

  return vimState;
}

class BaseSurroundCommand extends BaseCommand {
  keys: string[] = [];
  operatorString: 'change' | 'delete' | 'yank' | undefined = undefined;
  isCompleteAction = false;
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (!this.operatorString || this.keys.length === 0) {
      return vimState;
    }
    return StartSurroundMode(
      vimState,
      this.operatorString,
      this.keys,
      undefined,
      undefined,
      undefined
    );
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.surround && super.doesActionApply(vimState, keysPressed);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.surround && super.couldActionApply(vimState, keysPressed);
  }
}

@RegisterPluginAction('surround')
class CommandChangeSurround extends BaseSurroundCommand {
  modes = [Mode.Normal];
  pluginActionDefaultKeys = ['c', 's'];
  keys = ['<Plug>Csurround'];
  operatorString: 'change' | 'delete' | 'yank' | undefined = 'change';
}

@RegisterPluginAction('surround')
class CommandChangeSurroundWithLineBreaks extends BaseSurroundCommand {
  modes = [Mode.Normal];
  pluginActionDefaultKeys = ['c', 'S'];
  keys = ['<Plug>CSurround'];
  operatorString: 'change' | 'delete' | 'yank' | undefined = 'change';

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    return StartSurroundMode(
      vimState,
      'change',
      this.keys,
      undefined,
      undefined,
      RegisterMode.LineWise
    );
  }
}

@RegisterPluginAction('surround')
class CommandDeleteSurround extends BaseSurroundCommand {
  modes = [Mode.Normal];
  pluginActionDefaultKeys = ['d', 's'];
  keys = ['<Plug>Dsurround'];
  operatorString: 'change' | 'delete' | 'yank' | undefined = 'delete';
}

@RegisterPluginAction('surround')
class CommandSurroundModeStartVisual extends BaseSurroundCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  pluginActionDefaultKeys = ['S'];
  keys = ['<Plug>VSurround'];
  operatorString: 'change' | 'delete' | 'yank' | undefined = 'yank';

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let [start, end] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);
    if (vimState.currentMode === Mode.VisualLine) {
      [start, end] = [start.getLineBegin(), end.getLineEnd()];
    }
    return StartSurroundMode(vimState, 'yank', this.keys, start, end, undefined);
  }
}

@RegisterPluginAction('surround')
class CommandSurroundModeStartVisualWithLineBreaks extends BaseSurroundCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  pluginActionDefaultKeys = ['g', 'S'];
  keys = ['<Plug>VgSurround'];
  operatorString: 'change' | 'delete' | 'yank' | undefined = 'yank';

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let [start, end] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);
    if (vimState.currentMode === Mode.VisualLine) {
      [start, end] = [start.getLineBegin(), end.getLineEnd()];
    }
    return StartSurroundMode(vimState, 'yank', this.keys, start, end, RegisterMode.LineWise);
  }
}

@RegisterPluginAction('surround')
class CommandSurroundModeStartLine extends BaseSurroundCommand {
  modes = [Mode.Normal];
  pluginActionDefaultKeys = ['y', 's', 's'];
  keys = ['<Plug>Yssurround'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const start: Position = position.getLineBeginRespectingIndent();
    const end: Position = position.getLineEnd().getLastWordEnd().getRight();
    return StartSurroundMode(vimState, 'yank', this.keys, start, end, undefined);
  }
}

@RegisterPluginAction('surround')
class CommandSurroundModeStartLineWithLineBreaks extends BaseSurroundCommand {
  modes = [Mode.Normal];
  pluginActionDefaultKeys = [
    ['y', 'S', 's'],
    ['y', 'S', 'S'],
  ];
  keys = ['<Plug>YSsurround'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const start: Position = position.getLineBeginRespectingIndent();
    const end: Position = position.getLineEnd().getLastWordEnd().getRight();
    return StartSurroundMode(vimState, 'yank', this.keys, start, end, RegisterMode.LineWise);
  }
}

@RegisterPluginAction('surround')
class SurroundModeStartOperator extends BaseOperator {
  modes = [Mode.Normal];
  pluginActionDefaultKeys = ['y', 's'];
  keys = ['<Plug>Ysurround'];
  isCompleteAction = false;
  runsOnceForEveryCursor() {
    return false;
  }

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    return StartSurroundMode(vimState, 'yank', this.keys, start, end, undefined);
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.surround && super.doesActionApply(vimState, keysPressed);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.surround && super.couldActionApply(vimState, keysPressed);
  }
}

@RegisterPluginAction('surround')
class SurroundModeStartOperatorWithLineBreaks extends SurroundModeStartOperator {
  modes = [Mode.Normal];
  pluginActionDefaultKeys = ['y', 'S'];
  keys = ['<Plug>YSurround'];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    return StartSurroundMode(vimState, 'yank', this.keys, start, end, RegisterMode.LineWise);
  }
}

@RegisterAction
export class CommandSurroundAddToReplacement extends BaseCommand {
  modes = [Mode.SurroundInputMode];
  keys = ['<any>'];

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.surround && super.doesActionApply(vimState, keysPressed);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.surround && super.couldActionApply(vimState, keysPressed);
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (!vimState.surround) {
      return vimState;
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

        return vimState;
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

    if (await CommandSurroundAddToReplacement.TryToExecuteSurround(vimState, position)) {
      this.isCompleteAction = true;
    }

    return vimState;
  }

  public static async Finish(vimState: VimState): Promise<boolean> {
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

  // we assume that we start directly on the characters we're operating over
  // e.g. cs{' starts us with start on { end on }.

  public static RemoveWhitespace(vimState: VimState, start: Position, stop: Position): void {
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
      TextEditor.getCharAt(firstRangeEnd).match(/[ \t]/)
    ) {
      firstRangeEnd = firstRangeEnd.getRight();
    }

    while (
      !secondRangeStart.isEqual(firstRangeEnd) &&
      TextEditor.getCharAt(secondRangeStart).match(/[ \t]/) &&
      !secondRangeStart.isLineBeginning()
    ) {
      secondRangeStart = secondRangeStart.getLeftThroughLineBreaks(false);
    }

    // Adjust range start based on found position
    secondRangeStart = secondRangeStart.getRight();

    const firstRange = new Range(firstRangeStart, firstRangeEnd);
    const secondRange = new Range(secondRangeStart, secondRangeEnd);

    vimState.recordedState.transformations.push({ type: 'deleteRange', range: firstRange });
    vimState.recordedState.transformations.push({ type: 'deleteRange', range: secondRange });
  }

  public static GetStartAndEndReplacements(
    replacement: string | undefined
  ): { startReplace: string; endReplace: string } {
    if (!replacement) {
      return { startReplace: '', endReplace: '' };
    }

    let startReplace = replacement;
    let endReplace = replacement;

    if (startReplace[0] === '<') {
      let tagName = /([-\w.]+)/.exec(startReplace);
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

  // Returns true if it could actually find something to run surround on.
  public static async TryToExecuteSurround(
    vimState: VimState,
    position: Position
  ): Promise<boolean> {
    const { target, operator } = vimState.surround!;
    let replacement = vimState.surround!.replacement;

    // Flag of whether or not html attributes should be retained
    let retainAttributes = false;

    if (operator === 'change' || operator === 'yank') {
      if (!replacement) {
        return false;
      }

      // This is currently an incomplete tag. Check if we should finish it.
      if (replacement[0] === '<') {
        // If enter is used, retain the html attributes if possible and consider this tag done
        // if neither > or <enter> were pressed, this is not a complete tag so return false
        if (replacement[replacement.length - 1] === '\n') {
          replacement = replacement.slice(0, replacement.length - 1);
          retainAttributes = true;
        } else if (replacement[replacement.length - 1] !== '>') {
          return false;
        }
      }
    }

    let { startReplace, endReplace } = this.GetStartAndEndReplacements(replacement);

    if (operator === 'yank') {
      if (!vimState.surround?.range) {
        return false;
      }

      let { start, stop } = vimState.surround.range;

      if (TextEditor.getCharAt(stop) !== ' ') {
        stop = stop.getRight();
      }

      if (
        vimState.surround.previousMode === Mode.VisualLine ||
        vimState.surround.forcedRegisterMode === RegisterMode.LineWise
      ) {
        startReplace = startReplace + '\n';
        endReplace = '\n' + endReplace;
      }

      vimState.recordedState.transformations.push({
        type: 'insertText',
        text: startReplace,
        position: start,
        // This PositionDiff places the cursor at the start of startReplace text the we insert rather than after
        // which matches vim-surround better
        diff: new PositionDiff({ character: -startReplace.length }),
      });
      vimState.recordedState.transformations.push({
        type: 'insertText',
        text: endReplace,
        position: stop,
      });

      return CommandSurroundAddToReplacement.Finish(vimState);
    }

    let startReplaceRange: Range | undefined;
    let endReplaceRange: Range | undefined;
    let startDeleteRange: Range | undefined;
    let endDeleteRange: Range | undefined;

    const quoteMatches: { char: string; movement: () => MoveQuoteMatch }[] = [
      { char: "'", movement: () => new MoveASingleQuotes() },
      { char: '"', movement: () => new MoveADoubleQuotes() },
      { char: '`', movement: () => new MoveABacktick() },
    ];

    for (const { char, movement } of quoteMatches) {
      if (char !== target) {
        continue;
      }

      const { start, stop, failed } = await movement().execAction(position, vimState);

      if (failed) {
        return CommandSurroundAddToReplacement.Finish(vimState);
      }

      startReplaceRange = new Range(start, start.getRight());
      endReplaceRange = new Range(stop, stop.getRight());

      if (vimState.surround?.forcedRegisterMode === RegisterMode.LineWise) {
        startReplace = startReplace + '\n';
        endReplace = '\n' + endReplace;
      }
    }

    const pairedMatchings: {
      open: string;
      close: string;
      movement: () => MoveInsideCharacter;
    }[] = [
      { open: '{', close: '}', movement: () => new MoveACurlyBrace() },
      { open: '[', close: ']', movement: () => new MoveASquareBracket() },
      { open: '(', close: ')', movement: () => new MoveAParentheses() },
      { open: '<', close: '>', movement: () => new MoveACaret() },
    ];

    for (const { open, close, movement } of pairedMatchings) {
      if (target !== open && target !== close) {
        continue;
      }

      let { start, stop, failed } = await movement().execAction(position, vimState);

      if (failed) {
        return CommandSurroundAddToReplacement.Finish(vimState);
      }

      stop = stop.getLeft();

      startReplaceRange = new Range(start, start.getRight());
      endReplaceRange = new Range(stop, stop.getRight());

      if (target === open) {
        CommandSurroundAddToReplacement.RemoveWhitespace(vimState, start, stop);
      }

      if (vimState.surround?.forcedRegisterMode === RegisterMode.LineWise) {
        startReplace = startReplace + '\n';
        endReplace = '\n' + endReplace;
      }
    }

    if (target === 't') {
      // `MoveInsideTag` must be run first as otherwise the search will
      // look for the next enclosing tag after having selected the first
      let innerTagContent = await new MoveInsideTag().execAction(position, vimState);
      let { start, stop, failed } = await new MoveAroundTag().execAction(position, vimState);

      if (failed || innerTagContent.failed) {
        return CommandSurroundAddToReplacement.Finish(vimState);
      }

      stop = stop.getRight();
      innerTagContent.stop = innerTagContent.stop.getRight();

      if (failed) {
        return CommandSurroundAddToReplacement.Finish(vimState);
      }

      startReplaceRange = new Range(start, start.getRight());
      endReplaceRange = new Range(innerTagContent.stop, innerTagContent.stop.getRight());

      if (retainAttributes) {
        // Don't remove the attributes, just the tag name (one WORD)
        const tagNameEnd = start.getCurrentBigWordEnd().getRight();
        startDeleteRange = new Range(start.getRight(), tagNameEnd);
      } else {
        startDeleteRange = new Range(start.getRight(), innerTagContent.start);
      }

      endDeleteRange = new Range(innerTagContent.stop.getRight(), stop);

      if (vimState.surround?.forcedRegisterMode === RegisterMode.LineWise) {
        startReplace = startReplace + '\n';
        endReplace = '\n' + endReplace;
      }
    }

    if (operator === 'change') {
      if (!replacement) {
        return false;
      }
      const wordMatchings: {
        char: string;
        movement: () => TextObjectMovement;
        addNewline: 'no' | 'end-only' | 'both';
      }[] = [
        { char: 'w', movement: () => new SelectInnerWord(), addNewline: 'no' },
        { char: 'p', movement: () => new SelectInnerParagraph(), addNewline: 'both' },
        { char: 's', movement: () => new SelectInnerSentence(), addNewline: 'end-only' },
        { char: 'W', movement: () => new SelectInnerBigWord(), addNewline: 'no' },
      ];

      for (const { char, movement, addNewline } of wordMatchings) {
        if (target !== char) {
          continue;
        }

        let { stop, start, failed } = await movement().execAction(position, vimState);

        stop = stop.getRight();

        if (failed) {
          return CommandSurroundAddToReplacement.Finish(vimState);
        }

        let isForcedLineWise = false;
        if (vimState.surround?.forcedRegisterMode === RegisterMode.LineWise) {
          isForcedLineWise = true;
        }

        if (addNewline === 'end-only' || addNewline === 'both' || isForcedLineWise) {
          endReplace = '\n' + endReplace;
        }
        if (addNewline === 'both' || isForcedLineWise) {
          startReplace += '\n';
        }

        vimState.recordedState.transformations.push({
          type: 'insertText',
          text: startReplace,
          position: start,
        });
        vimState.recordedState.transformations.push({
          type: 'insertText',
          text: endReplace,
          position: stop,
        });

        return CommandSurroundAddToReplacement.Finish(vimState);
      }
    }

    // We've got our ranges. Run the surround command with the appropriate operator.

    if (!startReplaceRange && !endReplaceRange && !startDeleteRange && !endDeleteRange) {
      return false;
    }

    if (operator === 'change') {
      if (!replacement) {
        return false;
      }

      if (startReplaceRange) {
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: startReplace,
          start: startReplaceRange.start,
          end: startReplaceRange.stop,
        });
      }
      if (endReplaceRange) {
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: endReplace,
          start: endReplaceRange.start,
          end: endReplaceRange.stop,
        });
      }
      if (startDeleteRange) {
        vimState.recordedState.transformations.push({
          type: 'deleteRange',
          range: startDeleteRange,
        });
      }
      if (endDeleteRange) {
        vimState.recordedState.transformations.push({ type: 'deleteRange', range: endDeleteRange });
      }

      return CommandSurroundAddToReplacement.Finish(vimState);
    }

    if (operator === 'delete') {
      if (startReplaceRange) {
        vimState.recordedState.transformations.push({
          type: 'deleteRange',
          range: startReplaceRange,
        });
      }
      if (endReplaceRange) {
        vimState.recordedState.transformations.push({
          type: 'deleteRange',
          range: endReplaceRange,
        });
      }

      if (startDeleteRange) {
        vimState.recordedState.transformations.push({
          type: 'deleteRange',
          range: startDeleteRange,
        });
      }
      if (endDeleteRange) {
        vimState.recordedState.transformations.push({ type: 'deleteRange', range: endDeleteRange });
      }

      return CommandSurroundAddToReplacement.Finish(vimState);
    }

    return false;
  }
}
