enum QuoteMatch {
  Opening,
  Closing,
}

/**
 * QuoteMatcher matches quoted strings, respecting escaped quotes (\") and friends
 */
export class QuoteMatcher {
  static readonly escapeChar = '\\';

  private readonly quoteMap: QuoteMatch[] = [];

  constructor(quote: '"' | "'" | '`', corpus: string) {
    let openingQuote = true;
    // Loop over corpus, marking quotes and respecting escape characters.
    for (let i = 0; i < corpus.length; i++) {
      if (corpus[i] === QuoteMatcher.escapeChar) {
        i += 1;
        continue;
      }
      if (corpus[i] === quote) {
        this.quoteMap[i] = openingQuote ? QuoteMatch.Opening : QuoteMatch.Closing;
        openingQuote = !openingQuote;
      }
    }
  }

  public surroundingQuotes(cursorIndex: number): [number, number] | undefined {
    const cursorQuoteType = this.quoteMap[cursorIndex];
    if (cursorQuoteType === QuoteMatch.Opening) {
      const closing = this.getNextQuote(cursorIndex);
      return closing !== undefined ? [cursorIndex, closing] : undefined;
    } else if (cursorQuoteType === QuoteMatch.Closing) {
      return [this.getPrevQuote(cursorIndex)!, cursorIndex];
    } else {
      const opening = this.getPrevQuote(cursorIndex) ?? this.getNextQuote(cursorIndex);

      if (opening !== undefined) {
        const closing = this.getNextQuote(opening);
        if (closing !== undefined) {
          return [opening, closing];
        }
      }
    }

    return undefined;
  }

  private getNextQuote(start: number): number | undefined {
    for (let i = start + 1; i < this.quoteMap.length; i++) {
      if (this.quoteMap[i] !== undefined) {
        return i;
      }
    }

    return undefined;
  }

  private getPrevQuote(start: number): number | undefined {
    for (let i = start - 1; i >= 0; i--) {
      if (this.quoteMap[i] !== undefined) {
        return i;
      }
    }

    return undefined;
  }
}
