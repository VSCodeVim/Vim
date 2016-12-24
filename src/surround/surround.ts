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
    } else if (char !== "a") {
      // TODO xconverge: check if char is not a letter, create a pair if it is not
      return new Pair(char, char);
    } else {
      return undefined;
    }
  }

  public static CSurroundHandler(charFrom: string, charTo: string, vimState: VimState){


  }

  public static pasteSurround(innerValue: string, vimState: VimState): void {

  }

}