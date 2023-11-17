import { VimState } from '../../state/vimState';
import { PositionDiff, sorted } from './../../common/motion/position';
import { configuration } from './../../configuration/configuration';
import { Mode } from './../../mode/mode';
import { RegisterAction, BaseCommand } from './../base';
import {
  MoveAroundBacktick,
  MoveAroundCaret,
  MoveAroundCurlyBrace,
  MoveAroundDoubleQuotes,
  MoveAroundParentheses,
  MoveAroundTag,
  MoveAroundSingleQuotes,
  MoveAroundSquareBracket,
  MoveInsideCharacter,
  MoveInsideTag,
  MoveQuoteMatch,
} from '../motion';
import { isIMovement } from '../baseMotion';
import { MoveFullWordBegin, MoveWordBegin } from '../motion';
import { BaseOperator } from './../operator';
import {
  SelectInnerWord,
  TextObject,
  SelectABigWord,
  SelectWord,
} from '../../textobject/textobject';
import { Position, Range, window } from 'vscode';

type SurroundEdge = {
  leftEdge: Range;
  rightEdge: Range;
  /** we need to pass this with transformations */
  cursorIndex: number;
  /** to support changing a tag, cstt */
  leftTagName?: Range;
  rightTagName?: Range;
};

type TagReplacement = {
  tag: string;
  /** when  changing tag to tag, do we keep attributes? default: yes */
  keepAttributes: boolean;
};

export interface SurroundState {
  /** The operator paired with the surround action. "yank" is really "add", but it uses 'y' */
  operator: 'change' | 'delete' | 'yank';

  /** target of surround op: X in csXy and dsX */
  target: string | undefined;

  /** the added surrounding, like ",',(). t = tag */
  replacement: string;

  /** name of tag */
  tag?: TagReplacement;

  /** name of function */
  function?: string;

  /** for visual line mode */
  addNewline?: boolean;

  edges: SurroundEdge[];

  /** The mode before surround was triggered */
  previousMode: Mode;
}

abstract class SurroundOperator extends BaseOperator {
  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.surround && super.doesActionApply(vimState, keysPressed);
  }
}

@RegisterAction
class YankSurroundOperator extends SurroundOperator {
  // needs: nnoremap ys <plugys>. we leave it to Remapper to figure out y vs ys.
  public keys = ['<plugys>'];
  public modes = [Mode.Normal];

  public async run(vimState: VimState, start: Position, end: Position): Promise<void> {
    // reset surround state when run for first cursor
    if (!this.multicursorIndex) {
      vimState.surround = {
        operator: 'yank',
        target: undefined,
        replacement: '',
        edges: [],
        previousMode: vimState.currentMode,
      };
    }
    // then collect ranges for all cursors
    const multicursorIndex = this.multicursorIndex ?? 0;
    vimState.surround!.edges.push(getYankRanges());
    vimState.cursorStartPosition = start;
    // when called from visual operator, use end for stop to keep visual selection
    vimState.cursorStopPosition = vimState.currentMode === Mode.Visual ? end : start;
    await vimState.setCurrentMode(Mode.SurroundInputMode);

    return;

    function getYankRanges(): SurroundEdge {
      // for special handling for w motion.
      // with "|surroundme ZONK" it will jump to Z, but we just want surroundme
      const endPlus1 = new Range(end.getRight(), end.getRight());
      const prevWordEnd = end.getRight().prevWordEnd(vimState.document);
      const endW = new Range(prevWordEnd.getRight(), prevWordEnd.getRight());
      const lastMotion =
        vimState.recordedState.actionsRun[vimState.recordedState.actionsRun.length - 1];
      const ranWwMotion =
        lastMotion instanceof MoveWordBegin ||
        lastMotion instanceof MoveFullWordBegin ||
        lastMotion instanceof SelectABigWord ||
        lastMotion instanceof SelectWord;
      const rightEdge = ranWwMotion ? endW : endPlus1;
      return {
        leftEdge: new Range(start, start),
        rightEdge,
        cursorIndex: multicursorIndex,
      };
    }
  }

  public override async runRepeat(
    vimState: VimState,
    position: Position,
    count: number,
  ): Promise<void> {
    // we want to act on range: first non whitespace to last non whitespace
    await this.run(
      vimState,
      position.getLineBeginRespectingIndent(vimState.document),
      position
        .getDown(Math.max(0, count - 1))
        .getLineEnd()
        .prevWordEnd(vimState.document),
    );
  }
}

@RegisterAction
class CommandSurroundModeStartVisual extends SurroundOperator {
  modes = [Mode.Visual];
  keys = ['S'];

  public async run(vimState: VimState, start: Position, end: Position): Promise<void> {
    [start, end] = sorted(start, end);
    await new YankSurroundOperator(this.multicursorIndex).run(vimState, start, end);
    return;
  }
}

@RegisterAction
class CommandSurroundModeStartVisualLine extends SurroundOperator {
  modes = [Mode.VisualLine];
  keys = ['S'];

  public async run(vimState: VimState, start: Position, end: Position): Promise<void> {
    [start, end] = sorted(start.getLineBegin(), end.getLineEnd());

    // reset surround state when run for first cursor
    if (!this.multicursorIndex) {
      vimState.surround = {
        target: undefined,
        operator: 'yank',
        replacement: '',
        addNewline: true,
        edges: [],
        previousMode: vimState.currentMode,
      };
    }

    // collect ranges for all cursors
    vimState.surround?.edges.push({
      leftEdge: new Range(start, start),
      rightEdge: new Range(end, end),
      cursorIndex: this.multicursorIndex ?? 0,
    });

    vimState.cursorStartPosition = start;
    vimState.cursorStopPosition = end;
    await vimState.setCurrentMode(Mode.SurroundInputMode);
    return;
  }
}

abstract class CommandSurround extends BaseCommand {
  modes = [Mode.Normal];
  override createsUndoPoint = true;
  override runsOnceForEveryCursor() {
    return true;
  }
  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const target = keysPressed[keysPressed.length - 1];
    return (
      configuration.surround &&
      super.doesActionApply(vimState, keysPressed) &&
      SurroundHelper.edgePairings[target] !== undefined
    );
  }
}

@RegisterAction
class CommandSurroundDeleteSurround extends CommandSurround {
  keys = ['<plugds>', '<any>'];
  keysHasCnt = false;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const target = this.keysPressed[this.keysPressed.length - 1];
    // for derived class, support ds2X
    if (this.keysHasCnt) {
      const cntKey = this.keysPressed[this.keysPressed.length - 2];
      vimState.recordedState.count = parseInt(cntKey, undefined);
    }

    // for this operator, we set surround state and execute for each cursor one at a time
    vimState.surround = {
      operator: 'delete',
      target,
      replacement: '',
      edges: [],
      previousMode: Mode.Normal,
    };

    // we need surround state initiated for this call
    const replaceRanges = await SurroundHelper.getReplaceRanges(
      vimState,
      position,
      this.multicursorIndex ?? 0,
    );

    if (replaceRanges) {
      vimState.surround.edges = [replaceRanges];
      await SurroundHelper.ExecuteSurround(vimState);
    }
  }
}

@RegisterAction
class CommandSurroundDeleteSurroundCnt extends CommandSurroundDeleteSurround {
  // supports cnt up to 9, should be enough
  override keys = ['<plugds>', '<number>', '<any>'];
  override keysHasCnt = true;
}

@RegisterAction
class CommandSurroundChangeSurround extends CommandSurround {
  keys = ['<plugcs>', '<any>'];
  override isCompleteAction = false;
  keysHasCnt = false;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const target = this.keysPressed[this.keysPressed.length - 1];
    // for derived class, support ds2X
    if (this.keysHasCnt) {
      const cntKey = this.keysPressed[this.keysPressed.length - 2];
      vimState.recordedState.count = parseInt(cntKey, undefined);
    }

    // reset surround state when run for first cursor
    if (!this.multicursorIndex) {
      vimState.surround = {
        operator: 'change',
        target,
        replacement: '',
        edges: [],
        previousMode: Mode.Normal,
      };
    }

    // we need state surround initiated for this call
    const replaceRanges = await SurroundHelper.getReplaceRanges(
      vimState,
      position,
      this.multicursorIndex ?? 0,
    );

    // collect ranges for all cursors
    if (replaceRanges) {
      vimState.surround!.edges.push(replaceRanges);
    }
    await vimState.setCurrentMode(Mode.SurroundInputMode);
  }
}

@RegisterAction
class CommandSurroundChangeSurroundCnt extends CommandSurroundChangeSurround {
  // supports cnt up to 9, should be enough
  override keys = ['<plugcs>', '<number>', '<any>'];
  override keysHasCnt = true;
}

@RegisterAction
class CommandSurroundAddSurrounding extends BaseCommand {
  modes = [Mode.SurroundInputMode];
  // add surrounding / read X when: ys + motion + X. or csYX
  keys = ['<any>'];
  override isCompleteAction = true;
  override runsOnceForEveryCursor() {
    return false;
  }
  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const replacement = keysPressed[keysPressed.length - 1];
    return (
      configuration.surround &&
      super.doesActionApply(vimState, keysPressed) &&
      replacement !== 't' && // do not run this for surrounding with a tag
      replacement !== '<' &&
      replacement !== 'f' && // or for surrounding with a function
      replacement !== 'F' &&
      replacement !== '<C-f>'
    );
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const replacement = this.keysPressed[this.keysPressed.length - 1];

    if (!vimState.surround || !SurroundHelper.edgePairings[replacement]) {
      // cant surround, abort.
      // this typically handles, when last keypress was wrong and not a valid surrounding
      vimState.surround = undefined;
      await vimState.setCurrentMode(Mode.Normal);
      return;
    }

    vimState.surround.replacement = replacement;

    await SurroundHelper.ExecuteSurround(vimState);
  }
}

@RegisterAction
export class CommandSurroundAddSurroundingTag extends BaseCommand {
  modes = [Mode.SurroundInputMode];
  // add surrounding / read X when: ys + motion + X
  keys = [['<'], ['t']];
  override isCompleteAction = true;
  recordedTag = ''; // to save for repeat
  override runsOnceForEveryCursor() {
    return false;
  }
  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (!vimState.surround) {
      return;
    }

    vimState.surround.replacement = 't';
    const tagInput =
      vimState.isRunningDotCommand || vimState.isReplayingMacro
        ? this.recordedTag
        : await this.readTag();

    if (!tagInput) {
      vimState.surround = undefined;
      await vimState.setCurrentMode(Mode.Normal);
      return;
    }

    // record tag for repeat. this works because recordedState will store the actual objects
    this.recordedTag = tagInput;

    // check as special case (set by >) if we want to replace the attributes on tag or keep them (default)
    vimState.surround.tag = checkReplaceAttributes(tagInput);

    // finally, we can exec surround
    await SurroundHelper.ExecuteSurround(vimState);

    // local helper
    function checkReplaceAttributes(tag: string) {
      return tag.substring(tag.length - 1) === '>'
        ? { tag: tag.substring(0, tag.length - 1), keepAttributes: false }
        : { tag, keepAttributes: true };
    }
  }

  private async readTag(): Promise<string | undefined> {
    return window.showInputBox({
      prompt: 'Enter tag',
      ignoreFocusOut: true,
    });
  }
}

@RegisterAction
export class CommandSurroundAddSurroundingFunction extends BaseCommand {
  modes = [Mode.SurroundInputMode];
  // add surrounding / read X when: ys + motion + X
  keys = [['f'], ['F'], ['<C-f>']];
  override isCompleteAction = true;
  recordedFunction = ''; // to save for repeat
  override runsOnceForEveryCursor() {
    return false;
  }
  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (!vimState.surround) {
      return;
    }

    // reuse the spacing logic from the parentheses
    // for the right side of the replacement
    vimState.surround.replacement =
      this.keysPressed[this.keysPressed.length - 1] === 'F' ? '(' : ')';

    const functionInput =
      vimState.isRunningDotCommand || vimState.isReplayingMacro
        ? this.recordedFunction
        : await this.readFunction();

    if (!functionInput) {
      vimState.surround = undefined;
      await vimState.setCurrentMode(Mode.Normal);
      return;
    }

    // record function for repeat.
    this.recordedFunction = functionInput;

    // format the left side of the replacement based on the key pressed
    vimState.surround.function = this.formatFunction(functionInput);

    await SurroundHelper.ExecuteSurround(vimState);
  }

  private async readFunction(): Promise<string | undefined> {
    return window.showInputBox({
      prompt: 'Enter function',
      ignoreFocusOut: true,
    });
  }

  private formatFunction(fn: string): string {
    switch (this.keysPressed[this.keysPressed.length - 1]) {
      case 'f':
        return fn + '(';
      case 'F':
        return fn + '( ';
      case '<C-f>':
      default:
        return '(' + fn + ' ';
    }
  }
}

// following are static internal helper functions
// top level helper is ExecuteSurround, which is called from exec and does the actual text transformations
class SurroundHelper {
  /** a map which holds for each target key: inserted text + implementation helper */
  static edgePairings: {
    [key: string]: {
      left: string;
      right: string;
      /** do we consume space on the edges? "(" vs ")" */
      removeSpace: boolean;
      movement: () => MoveInsideCharacter | MoveQuoteMatch | MoveAroundTag | TextObject;
      /** typically to extend an inner  word. with *foo*, from "foo" to "*foo*" */
      extraChars?: number;
    };
  } = {
    // helpful linter is helpful :-D
    '(': {
      left: '( ',
      right: ' )',
      removeSpace: true,
      movement: () => new MoveAroundParentheses(),
    },
    ')': { left: '(', right: ')', removeSpace: false, movement: () => new MoveAroundParentheses() },
    '[': {
      left: '[ ',
      right: ' ]',
      removeSpace: true,
      movement: () => new MoveAroundSquareBracket(),
    },
    ']': {
      left: '[',
      right: ']',
      removeSpace: false,
      movement: () => new MoveAroundSquareBracket(),
    },
    '{': { left: '{ ', right: ' }', removeSpace: true, movement: () => new MoveAroundCurlyBrace() },
    '}': { left: '{', right: '}', removeSpace: false, movement: () => new MoveAroundCurlyBrace() },
    '>': { left: '<', right: '>', removeSpace: false, movement: () => new MoveAroundCaret() },
    '"': {
      left: '"',
      right: '"',
      removeSpace: false,
      movement: () => new MoveAroundDoubleQuotes(false),
    },
    "'": {
      left: "'",
      right: "'",
      removeSpace: false,
      movement: () => new MoveAroundSingleQuotes(false),
    },
    '`': {
      left: '`',
      right: '`',
      removeSpace: false,
      movement: () => new MoveAroundBacktick(false),
    },
    '<': { left: '', right: '', removeSpace: false, movement: () => new MoveAroundTag() },
    '*': {
      left: '*',
      right: '*',
      removeSpace: false,
      movement: () => new SelectInnerWord(),
      extraChars: 1,
    },
    // aliases
    b: { left: '(', right: ')', removeSpace: false, movement: () => new MoveAroundParentheses() },
    r: { left: '[', right: ']', removeSpace: false, movement: () => new MoveAroundSquareBracket() },
    B: { left: '{', right: '}', removeSpace: false, movement: () => new MoveAroundCurlyBrace() },
    a: { left: '<', right: '>', removeSpace: false, movement: () => new MoveAroundCaret() },
    t: { left: '', right: '', removeSpace: false, movement: () => new MoveAroundTag() },
    _: { left: '_', right: '_', removeSpace: false, movement: () => new SelectInnerWord() },
  };

  /** returns two ranges (for left and right replacement) for our surround target (X in dsX, csXy) relative to position */
  public static async getReplaceRanges(
    vimState: VimState,
    position: Position,
    multicursorIndex: number,
  ): Promise<SurroundEdge | undefined> {
    /* so this method is a bit of a dumpster for edge cases and ugly details
    the main idea is this:
    1. from position, we execute a textobject movement to get the total range of our surround target
    2. from there, we derive two ranges (left and right), where to apply delete/change
    3. that our result to return
    */

    // input verification
    if (!vimState.surround || !vimState.surround.target) {
      return undefined;
    }
    const target = this.edgePairings[vimState.surround.target];
    if (!target) {
      return undefined;
    }

    // we want start, end of executing movement for surround target count times from position
    const { removeSpace, movement } = target;
    vimState.cursorStartPosition = position; // some textobj (MoveInsideCharacter) expect this
    const count = vimState.recordedState.count || 1;
    const targetMovement = await movement().execActionWithCount(position, vimState, count);
    if (!isIMovement(targetMovement) || !!targetMovement.failed) {
      // we want as result an IMovement, that did not fail.
      return undefined;
    }
    let rangeStart = targetMovement.start;
    let rangeEnd = targetMovement.stop;

    // good to go, now we can calculate our ranges based on rangeStart and rangeEnd
    return vimState.surround.target === 't' ? getAdjustedRangesForTag() : getAdjustedRanges();

    // some local helpers
    function getAdjustedRanges(): SurroundEdge {
      if (movement() instanceof MoveInsideCharacter) {
        // for parens, brackets, curly ... we have to adjust the right range
        // there seems to be inconsistency between MoveInsideCharacter and MoveQuoteMatch
        rangeEnd = rangeEnd.getLeft();
      }
      if (target.extraChars) {
        rangeStart = rangeStart.getLeft(target.extraChars);
        rangeEnd = rangeEnd.getRight(target.extraChars);
      }
      // now start and end are on ()
      // next, check if there is space to remove (foo) vs ( bar )
      const delSpace = checkRemoveSpace(); // 0 or 1

      return {
        leftEdge: new Range(rangeStart, rangeStart.getRight(1 + delSpace)),
        rightEdge: new Range(rangeEnd.getLeft(delSpace), rangeEnd.getRight()),
        cursorIndex: multicursorIndex,
      };
    }

    function checkRemoveSpace(): number {
      // capiche?
      const leftSpace = vimState.editor.document.getText(
        new Range(rangeStart.getRight(), rangeStart.getRight(2)),
      );
      const rightSpace = vimState.editor.document.getText(new Range(rangeEnd.getLeft(), rangeEnd));
      return removeSpace && leftSpace === ' ' && rightSpace === ' ' ? 1 : 0;
    }
    async function getAdjustedRangesForTag(): Promise<SurroundEdge | undefined> {
      // we are on start of opening tag and end of closing tag
      // return ranges from there to the other side
      // start -> <foo>bar</foo> <-- stop
      const openTagNameStart = rangeStart.getRight();
      const openTagNameEnd = openTagNameStart
        .nextWordEnd(vimState.document, { inclusive: true })
        .getRight();
      const closeTagNameStart = rangeEnd
        .getLeft(2)
        .prevWordStart(vimState.document, { inclusive: true });
      const closeTagNameEnd = rangeEnd.getLeft();
      vimState.cursorStartPosition = position; // some textobj (MoveInsideCharacter) expect this
      vimState.cursorStopPosition = position;
      const innerTag =
        count === 1
          ? await new MoveInsideTag().execActionWithCount(position, vimState, 1)
          : await new MoveAroundTag().execActionWithCount(position, vimState, count - 1);
      if (!isIMovement(innerTag) || !!innerTag.failed) {
        return undefined;
      } else {
        return {
          leftEdge: new Range(rangeStart, innerTag.start),
          // maybe there is a small bug with cstt for multicursor, 2nd+ cursors
          rightEdge: new Range(innerTag.stop, rangeEnd),
          leftTagName: new Range(openTagNameStart, openTagNameEnd),
          rightTagName: new Range(closeTagNameStart, closeTagNameEnd),
          cursorIndex: multicursorIndex,
        };
      }
    }
  }

  /** executes our prepared surround changes */
  public static async ExecuteSurround(vimState: VimState): Promise<void> {
    const surroundState = vimState.surround;
    if (!surroundState || !surroundState.edges) {
      return;
    }

    const replacement = this.edgePairings[surroundState.replacement];
    // undefined allowed only for delete operator
    if (!replacement && surroundState.operator !== 'delete') {
      throw new Error('replacement missing in pairs');
    }
    // handle special case: cstt, replace only tag name
    if (surroundState.target === 't' && surroundState.tag && surroundState.tag.keepAttributes) {
      for (const { leftTagName, rightTagName } of surroundState.edges) {
        if (!surroundState.tag || !leftTagName || !rightTagName) {
          // throw ?
          continue;
        }
        vimState.recordedState.transformer.replace(leftTagName, surroundState.tag.tag);
        vimState.recordedState.transformer.replace(rightTagName, surroundState.tag.tag);
      }
    }
    // all other cases: ys, ds, cs
    else {
      const optNewline = surroundState.addNewline ? '\n' : '';
      const leftFixed =
        surroundState.operator === 'delete'
          ? ''
          : surroundState.tag
            ? '<' + surroundState.tag.tag + '>' + optNewline
            : surroundState.function
              ? surroundState.function + optNewline
              : replacement.left + optNewline;

      const rightFixed =
        surroundState.operator === 'delete'
          ? ''
          : surroundState.tag
            ? optNewline + '</' + surroundState.tag.tag + '>'
            : optNewline + replacement.right;

      for (const { leftEdge, rightEdge, cursorIndex } of surroundState.edges) {
        vimState.recordedState.transformer.addTransformation({
          type: 'replaceText',
          text: leftFixed,
          range: leftEdge,
          cursorIndex,
          // keep cursor on left edge / start. todo: not completly correct vor visual S
          diff:
            surroundState.operator === 'yank'
              ? PositionDiff.offset({ character: -leftFixed.length })
              : undefined,
        });
        vimState.recordedState.transformer.addTransformation({
          type: 'replaceText',
          text: rightFixed,
          range: rightEdge,
        });
      }
    }

    // finish / cleanup. sql-koala was here :D
    await vimState.setCurrentMode(Mode.Normal);
  }
}
