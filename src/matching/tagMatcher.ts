import * as vscode from "vscode";
import { Position, } from "./../motion/position";
import { TextEditor } from "./../textEditor";


export class TagMatcher {
  openStartPos: Position|undefined;
  openEndPos: Position|undefined;
  closeStartPos: Position|undefined;
  closeEndPos: Position|undefined;

  document: vscode.TextDocument;
  documentText: string;

  constructor(cursorPosition: Position) {
    this.document = TextEditor.getDocument();
    this.documentText = TextEditor.getAllText();

    const cursorOffset = this.document.offsetAt(cursorPosition);
    let startOffset = cursorOffset;

    while (true) {
      const closingTagOffsets = this.findClosingTag(startOffset);
      if (!closingTagOffsets) {
        return;
      }

      const tagName = closingTagOffsets.tagName;
      const openingTagOffsets = this.findOpeningTag(closingTagOffsets.startOffset, tagName);
      if (openingTagOffsets && openingTagOffsets.startOffset <= cursorOffset) {
        this.closeStartPos = Position.FromVSCodePosition(this.document.positionAt(closingTagOffsets.startOffset - 1));
        this.closeEndPos = Position.FromVSCodePosition(this.document.positionAt(closingTagOffsets.endOffset));
        this.openStartPos = Position.FromVSCodePosition(this.document.positionAt(openingTagOffsets.startOffset));
        this.openEndPos = Position.FromVSCodePosition(this.document.positionAt(openingTagOffsets.endOffset + 1));
        return;
      } else {
        startOffset = closingTagOffsets.endOffset + 1;
      }
    }
  }

  findClosingTag(startOffset: number): {startOffset: number, endOffset: number, tagName: string} | null {
    let closeBracketOffset = startOffset;
    let openBracketOffset = 0;

    while (closeBracketOffset < this.documentText.length) {
      closeBracketOffset = this.documentText.indexOf('>', closeBracketOffset);
      if (closeBracketOffset < 0) {
        return null;
      }

      openBracketOffset = closeBracketOffset - 1;
      while (openBracketOffset >= 0) {
        openBracketOffset = this.documentText.lastIndexOf('<', openBracketOffset);
        if (openBracketOffset >= 0 && openBracketOffset + 1 < this.documentText.length
              && this.documentText.charAt(openBracketOffset + 1) === '/') {
          const tagName = this.documentText.substring(openBracketOffset + '</'.length, closeBracketOffset);
          if (tagName.length > 0 && tagName.charAt(0) !== ' ') {
            return {
              startOffset: openBracketOffset,
              endOffset: closeBracketOffset,
              tagName
            };
          }
        }
        openBracketOffset--;
      }
      closeBracketOffset++;
    }
    return null;
  }

  findOpeningTag(startOffset: number, tagName: string): {startOffset: number, endOffset: number} | null {
    const tagBeginning = '<' + tagName;
    const re = new RegExp(tagBeginning, 'ig');

    const possibleBeginningTags = this.matchAll(this.documentText.substr(0, startOffset), re).reverse();

    for (let possibleBeginningMatch of possibleBeginningTags) {
      const openingTagOffset = possibleBeginningMatch.index;
      const openingTagEndOffset = openingTagOffset + tagBeginning.length;
      const closeBracketOffset = this.documentText.substr(openingTagOffset).indexOf('>') + openingTagOffset;

      if (closeBracketOffset > 0 && (closeBracketOffset === openingTagEndOffset || this.documentText.charAt(openingTagEndOffset) === ' ')) {
        return {
          startOffset: openingTagOffset,
          endOffset: closeBracketOffset
        };
      }
    }

    return null;
  }

  matchAll(text: string, re: RegExp): Array<RegExpExecArray> {
    let tagMatches: Array<RegExpExecArray> = [];
    let reMatch: RegExpExecArray;
    do {
        reMatch = re.exec(text);
        if (reMatch) {
          tagMatches.push(reMatch);
        }
    } while (reMatch);
    return tagMatches;
  }

  findOpening(inclusive: boolean): Position|undefined {
    if (inclusive) {
      return this.openStartPos;
    }
    return this.openEndPos;
  }

  findClosing(inclusive: boolean): Position|undefined {
    if (inclusive) {
      return this.closeEndPos;
    }
    return this.closeStartPos;
  }
}