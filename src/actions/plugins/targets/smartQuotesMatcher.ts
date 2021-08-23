import { QuoteMatcher } from "../../../common/matching/quoteMatcher";

export type WhichQuotes = 'current' | 'next' | 'last';
type Dir = '>' | '<';
type SearchAction = {
  first: Dir;
  second: Dir;
  includeCurrent: boolean;
};
type QuotesAction = {
  search: SearchAction | undefined;
  skipToLeft: number | undefined; // for last quotes, how many quotes need to skip while searching
  skipToRight: number | undefined; // for next quotes, how many quotes need to skip while searching
};

const quoteDirs: Record<string, QuotesAction | undefined> = {
  '002': {
    // | "a" "b" "c"
    search: { first: '>', second: '>', includeCurrent: false },
    skipToLeft: undefined,
    skipToRight: 1,
  },
  '012': {
    // |"a" "b" "c" "
    search: { first: '>', second: '>', includeCurrent: true },
    skipToLeft: undefined,
    skipToRight: 2,
  },
  '102': {
    // "a" "|b" "c" "
    search: { first: '<', second: '>', includeCurrent: false },
    skipToLeft: 2,
    skipToRight: 2,
  },
  '112': {
    //  "a" "b|" "c"
    search: { first: '<', second: '<', includeCurrent: true },
    skipToLeft: 2,
    skipToRight: 1,
  },
  '202': {
    //  "a"| "b" "c"
    search: { first: '>', second: '>', includeCurrent: false },
    skipToLeft: 1,
    skipToRight: 1,
  },
  '211': {
    //  "a" |"b" "c"
    search: { first: '>', second: '>', includeCurrent: true },
    skipToLeft: 1,
    skipToRight: 2,
  },
  '101': {
    //  "a" "|b" "c"
    search: { first: '<', second: '>', includeCurrent: false },
    skipToLeft: 2,
    skipToRight: 2,
  },
  '011': {
    //  |"a" "b" "c"
    search: { first: '>', second: '>', includeCurrent: true },
    skipToLeft: undefined,
    skipToRight: 2,
  },
  '110': {
    //  "a" "b" "c|"
    search: { first: '<', second: '<', includeCurrent: true },
    skipToLeft: 2,
    skipToRight: undefined,
  },
  '212': {
    //  "a" |"b" "c" "
    search: { first: '>', second: '>', includeCurrent: true },
    skipToLeft: 1,
    skipToRight: 2,
  },
  '111': {
    //  "a" "b|" "c" "
    search: { first: '<', second: '<', includeCurrent: true },
    skipToLeft: 2,
    skipToRight: 1,
  },
  '200': {
    //  "a" "b" "c"|
    search: { first: '<', second: '<', includeCurrent: false },
    skipToLeft: 1,
    skipToRight: undefined,
  },
  '201': {
    //  "a" "b" "c"| "
    //  "a"| "b" "c" "
    search: { first: '>', second: '>', includeCurrent: false },
    skipToLeft: 1,
    skipToRight: 1,
  },
  '210': {
    //  "a" "b" "c" |"
    search: undefined,
    skipToLeft: 1,
    skipToRight: undefined,
  },
  '001': {
    // | "a" "b" "c" "
    search: undefined,
    skipToLeft: undefined,
    skipToRight: 1,
  },
  '010': undefined, //  a|"b
  '100': {
    //  "a" "b" "c" "|
    search: undefined,
    skipToLeft: 2,
    skipToRight: undefined,
  },
  '000': undefined, //  |ab
};

export class SmartQuoteMatcher extends QuoteMatcher {
  public smartSurroundingQuotes(
    cursorIndex: number,
    which: WhichQuotes
  ): [number, number] | undefined {
    // base on ideas from targets.vim

    // cut line in left of, on and right of cursor
    const left = Array.from(this.quoteMap.entries()).slice(undefined, cursorIndex);
    const cursor = this.quoteMap[cursorIndex];
    const right = Array.from(this.quoteMap.entries()).slice(cursorIndex + 1, undefined);

    // how many delimiters left, on and right of cursor
    const lc = left.filter(([_, v]) => v !== undefined).length;
    const cc = cursor !== undefined ? 1 : 0;
    const rc = right.filter(([_, v]) => v !== undefined).length;

    // truncate counts
    const lct = lc === 0 ? 0 : lc % 2 === 0 ? 2 : 1;
    const rct = rc === 0 ? 0 : rc >= 2 ? 2 : 1;

    const key = `${lct}${cc}${rct}`;
    const act = quoteDirs[key];

    if (act) {
      if (which === 'current') {
        if (act.search) {
          return this.smartSearch(cursorIndex, act.search);
        } else {
          return undefined;
        }
      } else if (which === 'next' && act.skipToRight) {
        const res = right.filter(([i, v]) => v !== undefined)[act.skipToRight];
        if (res !== undefined) {
          return this.smartSurroundingQuotes(res[0], 'current');
        } else {
          return undefined;
        }
      } else if (which === 'last' && act.skipToLeft) {
        const res = left.reverse().filter(([i, v]) => v !== undefined)[act.skipToLeft];
        if (res !== undefined) {
          return this.smartSurroundingQuotes(res[0], 'current');
        } else {
          return undefined;
        }
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  private smartSearch(start: number, action: SearchAction): [number, number] | undefined {
    const offset = action.includeCurrent ? 1 : 0;
    let cursorPos: number | undefined = start;
    let fst: number | undefined;
    let snd: number | undefined;

    if (action.first === '>') {
      cursorPos = fst = this.getNextQuote(cursorPos - offset);
    } else {
      // dir === '<'
      cursorPos = fst = this.getPrevQuote(cursorPos + offset);
    }
    if (cursorPos === undefined) return undefined;

    if (action.second === '>') {
      snd = this.getNextQuote(cursorPos);
    } else {
      // dir === '<'
      snd = this.getPrevQuote(cursorPos);
    }

    if (fst === undefined || snd === undefined) return undefined;

    if (fst < snd) return [fst, snd];
    else return [snd, fst];
  }
}
