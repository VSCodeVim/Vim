export class Notation {
  // Mapping from the normalized string to regex strings that could match it.
  private static _notationMap: { [key: string]: string[] } = {
    'C-': ['ctrl\\+', 'c\\-'],
    'D-': ['cmd\\+', 'd\\-'],
    Esc: ['escape', 'esc'],
    BS: ['backspace', 'bs'],
    Del: ['delete', 'del'],
    Home: ['home'],
    End: ['end'],
    Insert: ['insert'],
    ' ': ['<space>'],
    '\n': ['<cr>', '<enter>'],
  };

  // Converts keystroke like <tab> to a single control character like \t
  public static ToControlCharacter(key: string) {
    if (key === '<tab>') {
      return '\t';
    }

    return key;
  }

  public static IsControlKey(key: string): boolean {
    key = key.toLocaleUpperCase();
    return (
      this.isSurroundedByAngleBrackets(key) &&
      key !== '<BS>' &&
      key !== '<SHIFT+BS>' &&
      key !== '<TAB>'
    );
  }

  /**
   * Normalizes key to AngleBracketNotation
   * (e.g. <ctrl+x>, Ctrl+x, <c-x> normalized to <C-x>)
   * and converts the characters to their literals
   * (e.g. <space>, <cr>, <leader>)
   */
  public static NormalizeKey(key: string, leaderKey: string): string {
    if (typeof key !== 'string') {
      return key;
    }

    if (!this.isSurroundedByAngleBrackets(key) && key.length > 1) {
      key = `<${key.toLocaleLowerCase()}>`;
    }

    if (key.toLocaleLowerCase() === '<leader>') {
      return leaderKey;
    }

    if (['<up>', '<down>', '<left>', '<right>'].includes(key.toLocaleLowerCase())) {
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
