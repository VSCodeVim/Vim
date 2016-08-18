export class TagMatcher {
  static openTag = "<";
  static closeTag = ">";
  static closeSlash = "/";
  static tagNameRegex = /[^\s>]+/;

  openStart: number|undefined;
  openEnd: number|undefined;
  closeStart: number|undefined;
  closeEnd: number|undefined;

  constructor(corpus: string, position: number) {
    let opening = corpus.lastIndexOf(TagMatcher.openTag, position);
    if (opening === -1) {
      return;
    }

    // If we found the closing tag, keep searching back for the opening tag
    if (corpus[opening + 1] === TagMatcher.closeSlash) {
      opening = corpus.lastIndexOf(TagMatcher.openTag, opening - 1);
      if (opening === -1) {
        return;
      }
    }

    const tagNameMatch = TagMatcher.tagNameRegex.exec(corpus.substring(opening + 1));
    if (tagNameMatch === null) {
      return;
    }
    const close = corpus.indexOf(TagMatcher.closeTag, opening + 1);
    const tagName = tagNameMatch[0];

    // We now know where the opening tag is
    this.openStart = opening;
    this.openEnd = close + 1;

    // Search for the closing tag
    const toFind = `</${tagName}>`;
    const closeTag = corpus.indexOf(toFind, position);
    if (closeTag === -1) {
      return;
    }

    this.closeStart = closeTag;
    this.closeEnd = closeTag + toFind.length;
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