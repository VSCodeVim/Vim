import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';
import { Range } from '../motion/range';
import { SearchDirection } from '../state/searchState';
import { TextEditor } from '../textEditor';
import { Position } from '../motion/position';
interface LineSearchResult {
  line: number;
  startChar: number;
  endChar: number;
  text: string;
}
export class TagMatcher {
  static openTag = "<";
  static closeTag = ">";
  static closeSlash = "/";
  static tagNameRegex = /[^\s>]+/;

  openStart: number | undefined;
  openEnd: number | undefined;
  closeStart: number | undefined;
  closeEnd: number | undefined;
  startRange: Range | undefined;
  closeRange: Range | undefined;
  constructor(position: Position) {
    // let opening = corpus.lastIndexOf(TagMatcher.openTag, position);
    // if (opening === -1) {
    //   return;
    // }

    // // If we found the closing tag, keep searching back for the opening tag
    // if (corpus[opening + 1] === TagMatcher.closeSlash) {
    //   position = opening;

    //   opening = corpus.lastIndexOf(TagMatcher.openTag, opening - 1);
    //   if (opening === -1) {
    //     return;
    //   }
    // }

    // const tagNameMatch = TagMatcher.tagNameRegex.exec(corpus.substring(opening + 1));
    // if (tagNameMatch === null) {
    //   return;
    // }
    // const close = corpus.indexOf(TagMatcher.closeTag, opening + 1);
    // const tagName = tagNameMatch[0];

    // // We now know where the opening tag is
    // this.openStart = opening;
    // this.openEnd = close + 1;

    // // Search for the closing tag
    // const toFind = `</${tagName}>`;
    // const closeTag = corpus.indexOf(toFind, position);
    // if (closeTag === -1) {
    //   return;
    // }

    // this.closeStart = closeTag;
    // this.closeEnd = closeTag + toFind.length;
    this.findTag(position);
  }

  findOpening(inclusive: boolean): Position | undefined {
    if (inclusive) {
      return this.startRange && this.startRange.start;
    }
    return this.startRange && this.startRange.stop.getRightThroughLineBreaks();
  }

  findClosing(inclusive: boolean): Position | undefined {
    if (inclusive) {
      return this.closeRange && this.closeRange.stop;
    }
    return this.closeRange && this.closeRange.start.getLeftThroughLineBreaks(true);
  }
  findTag(currentPosition: Position): any {
    let cursorText = TextEditor.getCharAt(currentPosition);
    if (cursorText == "<") {
      let lineStr = TextEditor.getLineAt(currentPosition).text;
      let nextChar = lineStr[currentPosition.character + 1];
      if (nextChar == TagMatcher.closeSlash) {
        //is the closing tag
        let startRange = this.findMatchStartTag(currentPosition, "\\w+", 0);
        if (startRange) {
          let tagName = this.getTagName(startRange.start);
          if (tagName) {
            let endRange = this.findMatchEndTag(startRange.stop, tagName, 0);
            if (endRange) {
              this.startRange = startRange;
              this.closeRange = endRange;
              return;
            }
          }
        }
      } else {
        let endRange = this.findMatchEndTag(currentPosition, "\\w+", 0);
        if (endRange) {
          let tagName = this.getTagName(endRange.start);
          if (tagName) {
            let startRange = this.findMatchStartTag(endRange.start, tagName, 0);
            if (startRange) {
              this.startRange = startRange;
              this.closeRange = endRange;
              return;
            }
          }
        }
      }
    } else if (cursorText == ">") {
      let searchResult = this.lineSearchPattern(currentPosition, "<", true);
      if (searchResult) {
        let startPosition = this.resultToRange(searchResult).start;
        return this.findTag(startPosition);
      }
    } else {
      let openResult = this.lineSearchPattern(currentPosition, /<|>/, true);
      let closeResult = this.lineSearchPattern(currentPosition, /<|>/, false);
      if (openResult && closeResult && openResult.text == "<" && closeResult.text == ">") {
        let startPosition = this.resultToRange(openResult).start;
        return this.findTag(startPosition);
      } else {
        let endRange = this.findMatchEndTag(currentPosition, "\\w+", 0);
        if (endRange) {
          let tagName = this.getTagName(endRange.start);
          if (tagName) {
            let startRange = this.findMatchStartTag(endRange.start, tagName, 0);
            if (startRange) {
              this.startRange = startRange;
              this.closeRange = endRange;
              return;
            }
          }
        }
      }
    }
  }
  getTagName(position: Position): undefined | string {
    let lineStr = TextEditor.getLineAt(position).text.slice(position.character);
    let m = lineStr.match(/<\/?(\w+)/);
    return m ? m[1] : undefined;
  }
  resultToRange(result: LineSearchResult) {
    return new Range(new Position(result.line, result.startChar), new Position(result.line, result.endChar));
  }
  findMatchEndTag(currentPosition: Position, tagName: string, innerTagCount: number): Range | undefined {
    let openReg = new RegExp("<(\/)?" + tagName);
    let openResult = this.lineSearchPattern(currentPosition, openReg, false);
    if (openResult) {
      let openRange = this.resultToRange(openResult);
      let closeResult = this.lineSearchPattern(openRange.stop, /\/?>/, false);
      if (closeResult) {
        let closeRange = this.resultToRange(closeResult);
        if (openResult.text[1] != "/") {
          if (closeResult.text[0] != "/") innerTagCount++;
          return this.findMatchEndTag(closeRange.stop, tagName, innerTagCount);
        } else {
          innerTagCount--;
          if (innerTagCount < 0) {
            return new Range(openRange.start, closeRange.stop);
          } else {
            return this.findMatchEndTag(closeRange.stop, tagName, innerTagCount);
          }
        }
      } else {
        return;
      }
    }
    return;
  }
  findMatchStartTag(currentPosition: Position, tagName: string, innerTagCount: number): Range | undefined {
    let openReg = new RegExp("<(\/)?" + tagName);
    let openResult = this.lineSearchPattern(currentPosition, openReg, true);
    if (openResult) {
      let openRange = this.resultToRange(openResult);
      let closeResult = this.lineSearchPattern(openRange.stop, /\/?>/, false);
      if (closeResult) {
        let closeRange = this.resultToRange(closeResult);
        if (closeRange.stop.isBefore(currentPosition)) {
          if (openResult.text[1] == "/") {
            innerTagCount++;
            return this.findMatchStartTag(openRange.start, tagName, innerTagCount);
          } else if (closeResult.text[0] == "/") {
            //self-closing tag,skip it;
            return this.findMatchStartTag(openRange.start, tagName, innerTagCount);
          } else {
            innerTagCount--;
            if (innerTagCount < 0) {
              return new Range(openRange.start, closeRange.stop);
            } else {
              return this.findMatchStartTag(openRange.start, tagName, innerTagCount);
            }
          }
        }
      } else {
        return this.findMatchStartTag(openRange.start, tagName, innerTagCount);
      }
    }
    return;
  }
  lineSearchPattern(currentPosition: Position, target: string | RegExp, isBackward: boolean): LineSearchResult | undefined {
    let lineCount = TextEditor.getLineCount();
    let line = currentPosition.line;
    let lineStr = TextEditor.getLineAt(currentPosition).text;
    let lineNo = currentPosition.line;
    if (isBackward) {
      lineStr = lineStr && lineStr.slice(0, currentPosition.character);
      if (target instanceof RegExp) {
        target = new RegExp(target, "g");
      }
      while (lineNo >= 0 && currentPosition.line - lineNo < 5000) {
        if (lineStr) {
          let index = -1;
          let text = "";
          if (typeof target == "string") {
            index = lineStr.lastIndexOf(target);
            text = target;
          } else {
            let m = lineStr.match(target);
            if (m) {
              text = m[m.length - 1];
              index = lineStr.lastIndexOf(text);
            }
          }
          if (index >= 0) {
            return {
              line: lineNo,
              startChar: index,
              endChar: index + text.length - 1,
              text: text
            }
          }
        }
        lineNo--;
        if (lineNo >= 0) lineStr = TextEditor.readLineAt(lineNo);
      }
    } else {
      lineStr = lineStr && lineStr.slice(currentPosition.character + 1);
      while (lineNo < lineCount && lineNo - currentPosition.line < 5000) {
        if (lineStr) {
          let index = -1;
          let text = "";
          if (typeof target == "string") {
            index = lineStr.indexOf(target);
            text = target;
          } else {
            let m = lineStr.match(target);
            if (m) {
              index = m.index == undefined ? -1 : m.index;
              text = m[0];
            }
          }
          if (index >= 0) {
            let startChar: number, endChar: number;
            return {
              line: lineNo,
              startChar: (lineNo == currentPosition.line ? currentPosition.character + 1 : 0) + index,
              endChar: (lineNo == currentPosition.line ? currentPosition.character + 1 : 0) + index + text.length - 1,
              text: text
            }
          }
        }
        lineNo++;
        if (lineNo < lineCount) lineStr = TextEditor.readLineAt(lineNo);
      }
    }
    return undefined;
  }
}
