// import * as vscode from "vscode";
import { VimState } from './../mode/modeHandler';
import { Position } from './../motion/position';
// import { BaseAction, Actions } from './../actions/actions'
// import { TextEditor } from './../textEditor';



class Pair {
  constructor(start: string, end: string) {
    this.start = start;
    this.end = end;
  }
  start: string;
  end: string;
}

export class Surround {

  public changeToSet = false;
  public changeTo = "";

  public changeFromSet = false;
  public changeFrom = "";

  public isTag = false;
  public tagString = "";

  private static surroundPairs: { [key: string]: { pair: Pair } } = {
    "b": { pair: new Pair("(", ")") },
    "(": { pair: new Pair("( ", " )") },
    ")": { pair: new Pair("(", ")") },
    "B": { pair: new Pair("{", "}") },
    "{": { pair: new Pair("{ ", " }") },
    "}": { pair: new Pair("{", "}") },
    "r": { pair: new Pair("[", "]") },
    "[": { pair: new Pair("[ ", " ]") },
    "]": { pair: new Pair("[", "]") },
    "a": { pair: new Pair("<", ">") },
    ">": { pair: new Pair("<", ">") },
  };

  private static getSurroundPair(char: string): Pair | undefined {
    const findPair = this.surroundPairs[char];
    if (findPair !== undefined) {
      if (findPair.pair !== undefined) {
        return findPair.pair;
      }
    } else if (!/[a-z]/i.test(char)) {
      return new Pair(char, char);
    } else {
      return undefined;
    }
  }

  private static inputTagPair(tagInput: string): Pair | undefined {
    let tagName = "";
    if (tagInput.endsWith(">")) {
      tagName = tagInput.substring(1, tagInput.length - 1);
      return new Pair("<" + tagName + ">", "</" + tagName + ">");
    } else {
      return undefined;
    }
  }

  private static getOrInputPair(char: string): Pair | undefined {
    return char.startsWith('<') || char === 't' ? this.inputTagPair(char) : this.getSurroundPair(char);
  }



  // private static pasteSurround(innerValue: string, vimState: VimState): void {

  // }

  private static change(charFrom: Pair, charTo: Pair, vimState: VimState) {
    let forwardSearch = this.findChar(charFrom.end, true, vimState);
    if (forwardSearch === null) { return; };

    let backwardSearch = this.findChar(charFrom.start, false, vimState);
    if (backwardSearch === null) { return; };

    vimState.recordedState.transformations.push({
      type: "replaceText",
      text: charTo.end,
      start: forwardSearch.getRight(),
      end: new Position(forwardSearch.line, forwardSearch.getRight().character + charFrom.start.length),
      manuallySetCursorPositions: true
    });

    vimState.recordedState.transformations.push({
      type: "replaceText",
      text: charTo.start,
      start: backwardSearch.getLeftByCount(charFrom.end.length),
      end: new Position(backwardSearch.line, backwardSearch.character + charFrom.end.length - 1),
      manuallySetCursorPositions: true
    });

    // Move cursor to start of the surround area
    vimState.cursorPosition = backwardSearch.getLeftByCount(charFrom.end.length);
  }

  private static findChar(char: string, forwards: boolean, vimState: VimState): Position | null {
    if (forwards) {
      return vimState.cursorPosition.tilForwards(char, 1);
    } else {
      return vimState.cursorPosition.tilBackwards(char, 1);
    }
  }

  public static cSurroundHandler(charFrom: string, charTo: string, vimState: VimState) {
    const newSurround = this.getOrInputPair(charTo);
    const prevSurround = this.getOrInputPair(charFrom);
    if (newSurround !== undefined && prevSurround !== undefined) {
      this.change(prevSurround, newSurround, vimState);
    }
  }

  public static dSurroundHandler(charFrom: string, vimState: VimState) {
    const prevSurround = this.getOrInputPair(charFrom);
    if (prevSurround !== undefined) {
      this.change(prevSurround, new Pair("", ""), vimState);
    }
  }

  public static sSurroundHandler(start: Position, end: Position, charTo: string, vimState: VimState) {
    const newSurround = this.getOrInputPair(charTo);
    if (newSurround !== undefined) {
      vimState.recordedState.transformations.push({
        type: "insertText",
        text: newSurround.end,
        position: end,
        manuallySetCursorPositions: true
      });

      vimState.recordedState.transformations.push({
        type: "insertText",
        text: newSurround.start,
        position: start,
        manuallySetCursorPositions: true
      });
    }
  }
}