export class AngleBracketNotation {
  private static _notationMap : { [key: string] : string[]; } = {
    'C-': ['ctrl\\+', 'c\\-'],
    'Esc': ['escape', 'esc'],
    'BS': ['backspace', 'bs'],
    'Del': ['delete', 'del'],
  };

  /**
   * Normalizes key to AngleBracketNotation
   * For instance, <ctrl+x>, Ctrl+x, <c-x> normalized to <C-x>
   */
  public static Normalize(key: string): string {
    if (!this.isSurroundedByAngleBrackets(key) && key.length > 1) {
      key = `<${ key.toLocaleLowerCase() }>`;
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
