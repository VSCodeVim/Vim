import { QuoteMatcher } from '../../common/matching/quoteMatcher';

type Dir = '>' | '<';
type SearchAction = {
  first: Dir;
  second: Dir;
  includeCurrent: boolean;
};

const searchActions: Record<string, SearchAction | undefined> = {
  lcl: { first: '<', second: '<', includeCurrent: true },
  ll: { first: '<', second: '<', includeCurrent: false },
  rcr: { first: '>', second: '>', includeCurrent: true },
  rr: { first: '>', second: '>', includeCurrent: false },
  lr: { first: '<', second: '>', includeCurrent: false },
  none: undefined,
};

const quoteDirs: Record<string, keyof typeof searchActions | undefined> = {
  '002': 'rr',
  '012': 'rcr',
  '102': 'lr',
  '112': 'lcl',
  '202': 'rr',
  '211': 'rcr',
  '101': 'lr',
  '110': 'lcl',
  '212': 'rcr',
  '111': 'lcl',
  '200': 'none',
  '201': 'none',
  '210': 'none',
  '001': 'none',
  '010': 'none',
  '100': 'none',
  '000': 'none',
};

export class SmartQuoteMatcher extends QuoteMatcher {
  public override surroundingQuotes(cursorIndex: number): [number, number] | undefined {
    // base on ideas from targets.vim

    // cut line in left of, on and right of cursor
    const left = this.quoteMap.slice(undefined, cursorIndex);
    const cursor = this.quoteMap[cursorIndex];
    const right = this.quoteMap.slice(cursorIndex + 1, undefined);

    // how many delimiters left, on and right of cursor
    const lc = left.filter((v) => v !== undefined).length;
    const cc = cursor !== undefined ? 1 : 0;
    const rc = right.filter((v) => v !== undefined).length;

    // truncate counts
    const lct = lc === 0 ? 0 : lc % 2 === 0 ? 2 : 1;
    const rct = rc === 0 ? 0 : rc >= 2 ? 2 : 1;

    const key = `${lct}${cc}${rct}`;
    const act = searchActions[quoteDirs[key]!];

    if (act) {
      return this.smartSearch(cursorIndex, act);
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
