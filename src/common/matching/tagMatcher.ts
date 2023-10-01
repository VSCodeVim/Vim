import { TextEditor } from '../../textEditor';
import { VimState } from '../../state/vimState';

type Tag = { name: string; type: 'close' | 'open'; startPos: number; endPos: number };
type MatchedTag = {
  tag: string;
  openingTagStart: number;
  openingTagEnd: number;
  closingTagStart: number;
  closingTagEnd: number;
};

export class TagMatcher {
  // see regexr.com/3t585
  static TAG_REGEX = /\<(\/)?([^\>\<\s\/]+)(?:[^\>\<]*?)(\/)?\>/g;
  static OPEN_FORWARD_SLASH = 1;
  static TAG_NAME = 2;
  static CLOSE_FORWARD_SLASH = 3;

  openStart: number | undefined;
  openEnd: number | undefined;
  closeStart: number | undefined;
  closeEnd: number | undefined;

  constructor(corpus: string, position: number, vimState: VimState) {
    let match = TagMatcher.TAG_REGEX.exec(corpus);
    const tags: Tag[] = [];

    // Gather all the existing tags.
    while (match) {
      // Node is a self closing tag, skip.
      if (match[TagMatcher.CLOSE_FORWARD_SLASH]) {
        match = TagMatcher.TAG_REGEX.exec(corpus);
        continue;
      }

      tags.push({
        name: match[TagMatcher.TAG_NAME],
        type: match[TagMatcher.OPEN_FORWARD_SLASH] ? 'close' : 'open',
        startPos: match.index,
        endPos: TagMatcher.TAG_REGEX.lastIndex,
      });

      match = TagMatcher.TAG_REGEX.exec(corpus);
    }

    const stack: Tag[] = [];
    const matchedTags: MatchedTag[] = [];

    for (const tag of tags) {
      // We have to push on the stack
      // if it is an open tag.
      if (tag.type === 'open') {
        stack.push(tag);
      } else {
        // We have an unmatched closing tag,
        // so try and match it with any existing tag.
        for (let i = stack.length - 1; i >= 0; i--) {
          const openNode = stack[i];

          if (openNode.type === 'open' && openNode.name === tag.name) {
            // A matching tag was found, ignore
            // any tags that were in between.
            matchedTags.push({
              tag: openNode.name,
              openingTagStart: openNode.startPos,
              openingTagEnd: openNode.endPos,
              closingTagStart: tag.startPos,
              closingTagEnd: tag.endPos,
            });

            stack.splice(i);
            break;
          }
        }
      }
    }

    const firstNonWhitespacePositionOnLine = TextEditor.getFirstNonWhitespaceCharOnLine(
      vimState.document,
      vimState.cursorStartPosition.line,
    );

    /**
     * This adjustment fixes the following situation:
     * <foo>
     * |  <bar>
     *    test
     *    </bar>
     * </foo>
     * Now in tag matching situations, the tag opening on the cursor line is considered as well
     * (if there is only whitespace before the tag and the cursor is standing on these whitespaces)
     */
    const startPos =
      vimState.cursorStartPosition.character < firstNonWhitespacePositionOnLine.character
        ? firstNonWhitespacePositionOnLine
        : vimState.cursorStartPosition;

    const startPosOffset = vimState.document.offsetAt(startPos);
    const endPosOffset = position;
    const tagsSurrounding = matchedTags.filter((n) => {
      return startPosOffset >= n.openingTagStart && endPosOffset < n.closingTagEnd;
    });

    if (!tagsSurrounding.length) {
      return;
    }

    const nodeSurrounding = this.determineRelevantTag(
      tagsSurrounding,
      startPosOffset,
      vimState.cursorStartPosition.compareTo(vimState.cursorStopPosition) !== 0,
    );

    if (!nodeSurrounding) {
      return;
    }

    this.openStart = nodeSurrounding.openingTagStart;
    this.closeEnd = nodeSurrounding.closingTagEnd;
    // if the inner tag content is already selected, expand to enclose tags with 'it' as in vim
    if (
      startPosOffset === nodeSurrounding.openingTagEnd &&
      endPosOffset + 1 === nodeSurrounding.closingTagStart
    ) {
      this.openEnd = this.openStart;
      this.closeStart = this.closeEnd;
    } else {
      this.openEnd = nodeSurrounding.openingTagEnd;
      this.closeStart = nodeSurrounding.closingTagStart;
    }
  }

  /**
   * Most of the time the relevant tag is the innermost tag, but when Visual mode is active,
   * the rules are different.
   * When the cursorStart is standing on the < character of the inner tag, with "at" we must
   * jump to the outer tag.
   */
  determineRelevantTag(
    tagsSurrounding: MatchedTag[],
    adjustedStartPosOffset: number,
    selectionActive: boolean,
  ): MatchedTag | undefined {
    const relevantTag = tagsSurrounding[0];

    if (selectionActive && adjustedStartPosOffset === relevantTag.openingTagStart) {
      // we adjusted so we have to return the outer tag
      return tagsSurrounding[1];
    } else {
      return relevantTag;
    }
  }

  findOpening(inclusive: boolean): number | undefined {
    if (inclusive) {
      return this.openStart;
    }
    return this.openEnd;
  }

  findClosing(inclusive: boolean): number | undefined {
    if (inclusive) {
      return this.closeEnd;
    }
    return this.closeStart;
  }
}
