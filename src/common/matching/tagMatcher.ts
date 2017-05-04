type Tag = { name: string; type: "close" | "open"; startPos: number; endPos: number };
type MatchedTag = {tag: string, openingTagStart: number, openingTagEnd: number, closingTagStart: number, closingTagEnd: number};

export class TagMatcher {
  static TAG_REGEX = /\<(\/)?([^\>\<\s]+)[^\>\<]*(\/?)\>/g;
  static OPEN_FORWARD_SLASH = 1;
  static TAG_NAME = 2;
  static CLOSE_FORWARD_SLASH = 3;

  openStart: number|undefined;
  openEnd: number|undefined;
  closeStart: number|undefined;
  closeEnd: number|undefined;

  constructor(corpus: string, position: number) {
    let match = TagMatcher.TAG_REGEX.exec(corpus);
    const tags : Tag[] = [];

    // Gather all the existing tags.
    while (match) {
      // Node is a self closing tag, skip.
      if (match[TagMatcher.CLOSE_FORWARD_SLASH]) {
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

    const stack : Tag[] = [];
    const matchedTags : MatchedTag[] = [];

    for (let tag of tags) {
      // We have to push on the stack
      // if it is an open tag.
      if (tag.type === 'open') {
        stack.push(tag);
      } else {
        // We have an unmatched closing tag,
        // so try and match it with any existing tag.
        for (let i = stack.length - 1; i >= 0; i--) {
          const openNode = stack[i];

          if (openNode.type === 'open'
              && openNode.name === tag.name) {
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

    const tagsSurrounding = matchedTags.filter(n => {
      return position >= n.openingTagStart && position <= n.closingTagEnd;
    });

    if (!tagsSurrounding.length) {
      return;
    }

    // The first one should be the most relevant tag.
    const nodeSurrounding = tagsSurrounding[0];

    this.openStart = nodeSurrounding.openingTagStart;
    this.openEnd = nodeSurrounding.openingTagEnd;
    this.closeStart = nodeSurrounding.closingTagStart;
    this.closeEnd = nodeSurrounding.closingTagEnd;
  }

  findOpening(inclusive: boolean): number|undefined {
    if (inclusive) {
      return this.openStart;
    }
    return this.openEnd;
  }

  findClosing(inclusive: boolean): number|undefined {
    if (inclusive) {
      return this.closeEnd;
    }
    return this.closeStart;
  }
}