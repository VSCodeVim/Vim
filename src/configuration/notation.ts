import { configuration } from './configuration';

export class Notation {
  // Mapping from the normalized string to a regex that could match it.
  private static readonly _notationMap: { [key: string]: RegExp } = {
    'C-': /ctrl\+|c\-/gi,
    'D-': /cmd\+|d\-/gi,
    Esc: /escape|esc/gi,
    BS: /backspace|bs/gi,
    Del: /delete|del/gi,
    Home: /home/gi,
    End: /end/gi,
    Insert: /insert/gi,
    ' ': /<space>/gi,
    '\n': /<cr>|<enter>/gi,
  };

  /**
   * Converts keystroke like <tab> to a single control character like \t
   */
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
        const regex = this._notationMap[notationMapKey];
        if (regex.test(key)) {
          key = key.replace(regex, notationMapKey);
          break;
        }
      }
    }

    return key;
  }

  /**
   * Converts a key to a form which will look nice when logged, etc.
   */
  public static printableKey(key: string) {
    const normalized = this.NormalizeKey(key, configuration.leader);
    return normalized === ' ' ? '<space>' : normalized === '\n' ? '<enter>' : normalized;
  }

  private static isSurroundedByAngleBrackets(key: string): boolean {
    return key.startsWith('<') && key.endsWith('>');
  }
}
