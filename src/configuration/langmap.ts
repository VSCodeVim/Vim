export class Langmap {
  private static keymap: { [key: string]: string } = {
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

  public static remapKey(key: string): string {
    if (key.length !== 1 || !(key in this.keymap)) return key;
    return this.keymap[key]; // notice that we're not remapping <C-> combinations. this is because in vim, ctrl remapping is not handled either
  }

  private static remapArray(keys: readonly string[]): string[] {
    return keys.map((x) => this.remapKey(x));
  }

  private static remap2DArray(keys: readonly string[][]): string[][] {
    return keys.map((x) => this.remapArray(x));
  }

  public static remapKeys(keys: readonly string[] | readonly string[][]): string[] | string[][] {
    console.log('remapping ' + keys);
    if (keys === undefined || keys.length === 0) return [...keys] as string[] | string[][];
    if (Array.isArray(keys[0])) return this.remap2DArray(keys as readonly string[][]);
    return this.remapArray(keys as string[]);
  }
}
