// import * as vscode from "vscode";
import { VimState } from './../mode/modeHandler';
// import { Position } from './../motion/position';
// import { TextEditor } from './../textEditor';

class Pair {
  constructor(start: string, end: string){
    this.start = start;
    this.end = end;
  }
  start: string;
  end: string;
}

export class Surround {

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
    if (this.surroundPairs[char].pair !== undefined) {
      return this.surroundPairs[char].pair;
    } else if (!/[a-z]/i.test(char)) {
      return new Pair(char, char);
    } else {
      return undefined;
    }
  }

  private static inputTagPair(tagInput: string): Pair | undefined {
    let tagName = "";
    if (tagInput.endsWith(">")) {
      tagName = tagInput.substring(0, tagInput.length - 1);
      return new Pair("<" + tagName + ">", "</" + tagName + ">");
    } else {
      return undefined;
    }
  }

  private static getOrInputPair(char: string): Pair | undefined {
    return char === '<' || char === 't' ? this.inputTagPair(char) : this.getSurroundPair(char);
  }



  private static pasteSurround(innerValue: string, vimState: VimState): void {

  }

  private static change(charFrom: string, charTo: Pair, vimState: VimState) {

  }

  public static cSurroundHandler(charFrom: string, charTo: string, vimState: VimState){
    const newSurround = this.getOrInputPair(charTo);
    if (newSurround !== undefined) {
      this.change(charFrom, newSurround, vimState);
    }
  }

  public static dSurroundHandler(charFrom: string, charTo: string, vimState: VimState){
    this.change(charFrom, new Pair("", ""), vimState);
  }

  public static ySurroundHandler(charFrom: string, charTo: string, vimState: VimState){

  }

}