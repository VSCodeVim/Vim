import * as _ from 'lodash';

export class Notation {
  // Mapping from the nomalized string to regex strings that could match it.
  private static _notationMap: { [key: string]: string[] } = {
    'C-': ['ctrl\\+', 'c\\-'],
    'D-': ['cmd\\+', 'd\\-'],
    Esc: ['escape', 'esc'],
    BS: ['backspace', 'bs'],
    Del: ['delete', 'del'],
    ' ': ['<space>'],
    '\n': ['<cr>', '<enter>']
  };

  /**
   * Normalizes key to AngleBracketNotation
   * (e.g. <ctrl+x>, Ctrl+x, <c-x> normalized to <C-x>)
   * and converts the characters to their literals
   * (e.g. <space>, <cr>, <leader>)
   */
  public static NormalizeKey(key: string, leaderKey: string): string {
    if (!this.isSurroundedByAngleBrackets(key) && key.length > 1) {
      key = `<${key.toLocaleLowerCase()}>`;
    }

    if (key.toLocaleLowerCase() === '<leader>') {
      return leaderKey;
    }

    if (_.includes(['<up>', '<down>', '<left>', '<right>'], key.toLocaleLowerCase())) {
      return key.toLocaleLowerCase();
    }

    for (const notationMapKey in this._notationMap) {
      if (this._notationMap.hasOwnProperty(notationMapKey)) {
        const regex = new RegExp(this._notationMap[notationMapKey].join('|'), 'gi');
        if (regex.test(key)) {
          key = key.replace(regex, notationMapKey);
          break;
        }
      }
    }

    return key;
  }

  private static isSurroundedByAngleBrackets(key: string): boolean {
    return key.startsWith('<') && key.endsWith('>');
  }
}
