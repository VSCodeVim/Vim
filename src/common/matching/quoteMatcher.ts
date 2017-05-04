enum QuoteMatch {
  None,
  Opening,
  Closing
}

/**
 * QuoteMatcher matches quoted strings, respecting escaped quotes (\") and friends
 */
export class QuoteMatcher {
  static escapeChar = "\\";

  private quoteMap: QuoteMatch[] = [];

  constructor(char: string, corpus: string) {
    let openingQuote = false;
    // Loop over corpus, marking quotes and respecting escape characters.
    for (let i = 0; i < corpus.length; i++) {
      if (corpus[i] === QuoteMatcher.escapeChar) {
        i += 1;
        continue;
      }
      if (corpus[i] === char) {
        openingQuote = !openingQuote;
        this.quoteMap[i] = openingQuote ? QuoteMatch.Opening : QuoteMatch.Closing;
      }
    }
  }

  findOpening(start: number): number {
    // First, search backwards to see if we could be inside a quote
    for (let i = start; i >= 0; i--) {
      if (this.quoteMap[i] === QuoteMatch.Opening) {
        return i;
      }
    }

    // Didn't find one behind us, the string may start ahead of us. This happens
    // to be the same logic we use to search forwards.
    return this.findClosing(start);
  }

  findClosing(start: number): number {
    // Search forwards from start, looking for a non-escaped char
    for (let i = start; i <= this.quoteMap.length; i++) {
      if (this.quoteMap[i]) {
        return i;
      }
    }

    return -1;
  }
}