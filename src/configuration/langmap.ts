import { Mode } from '../mode/mode';

export class Langmap {
  private static qwertyToDvorak: { [key: string]: string } = {
    q: "'",
    w: ',',
    e: '.',
    r: 'p',
    t: 'y',
    y: 'f',
    u: 'g',
    i: 'c',
    o: 'r',
    p: 'l',
    '[': '/',
    ']': '=',
    a: 'a',
    s: 'o',
    d: 'e',
    f: 'u',
    g: 'i',
    h: 'd',
    j: 'h',
    k: 't',
    l: 'n',
    ';': 's',
    "'": '-',
    z: ';',
    x: 'q',
    c: 'j',
    v: 'k',
    b: 'x',
    n: 'b',
    m: 'm',
    ',': 'w',
    '.': 'v',
    '/': 'z',
    '-': '[',
    '=': ']',
    Q: '"',
    W: '<',
    E: '>',
    R: 'P',
    T: 'Y',
    Y: 'F',
    U: 'G',
    I: 'C',
    O: 'R',
    P: 'L',
    '{': '?',
    '}': '+',
    A: 'A',
    S: 'O',
    D: 'E',
    F: 'U',
    G: 'I',
    H: 'D',
    J: 'H',
    K: 'T',
    L: 'N',
    ':': 'S',
    '"': '_',
    Z: ':',
    X: 'Q',
    C: 'J',
    V: 'K',
    B: 'X',
    N: 'B',
    M: 'M',
    '<': 'W',
    '>': 'V',
    '?': 'Z',
  };

  private static nonMatchable = /<(any|leader|number|alpha|character)>/;
  private static literalKeys = /<(any|number|alpha|character)>/;

  public static isLiteralMode(mode: Mode): boolean {
    return [
      Mode.Insert,
      Mode.Replace,
      Mode.CommandlineInProgress,
      Mode.SearchInProgressMode,
    ].includes(mode);
  }

  private static dvorakToQwerty: { [key: string]: string } = Object.fromEntries(
    Object.entries(this.qwertyToDvorak).map((x) => [x[1], x[0]])
  );

  private static map(map: { [key: string]: string }, key: string) {
    if (key.length !== 1 || !(key in map)) return key;
    return map[key]; // notice that we're not remapping <C-> combinations. this is because in vim, ctrl remapping is not handled either
  }

  public static remapKey(key: string): string {
    return this.map(this.dvorakToQwerty, key);
  }

  private static unmapKey(key: string): string {
    return this.map(this.qwertyToDvorak, key);
  }

  public static unmapLiteral(
    reference: readonly string[] | readonly string[][],
    keys: readonly string[]
  ): string[] {
    if (reference.length === 0 || keys.length === 0) return [];

    // find best matching
    if (Array.isArray(reference[0])) {
      for (const possibility of reference as string[][]) {
        if (possibility.length !== keys.length) continue;
        let allMatch = true;
        for (let i = 0; i < possibility.length; ++i) {
          if (this.nonMatchable.test(possibility[i])) continue;
          if (possibility[i] !== keys[i]) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) return this.unmapLiteral(possibility, keys);
      }
    }

    // unmap <character> <number> <alpha> and <any>
    const unmapped = [...keys];
    for (let i = 0; i < keys.length; ++i) {
      if (this.literalKeys.test((reference as string[])[i])) {
        unmapped[i] = this.unmapKey(keys[i]);
      }
    }
    return unmapped;
  }
}
