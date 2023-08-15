import { Mode } from '../mode/mode';

export class Langmap {
  //
  // Properties
  //

  private static nonMatchable = /<(any|leader|number|alpha|character)>/;
  private static literalKeys = /<(any|number|alpha|character)>/;

  public fromQwerty: { [key: string]: string };
  public toQwerty: { [key: string]: string };

  //
  // Singleton logic + Static methods
  //

  private static instance = new Langmap('');
  public static isRemapped = false;

  public static getLangmap(): Langmap {
    return this.instance;
  }

  public static updateLangmap(langmap: string) {
    this.instance = new Langmap(langmap);
    this.isRemapped = Object.keys(this.instance.toQwerty).length !== 0;
  }

  public static isLiteralMode(mode: Mode): boolean {
    return [
      Mode.Insert,
      Mode.Replace,
      Mode.CommandlineInProgress,
      Mode.SearchInProgressMode,
    ].includes(mode);
  }

  //
  // Langmap parsing
  //

  private constructor(langmap: string) {
    // From :help langmap
    /*
      The 'langmap' option is a list of parts, separated with commas.  Each
          part can be in one of two forms:
          1.  A list of pairs.  Each pair is a "from" character immediately
              followed by the "to" character.  Examples: "aA", "aAbBcC".
          2.  A list of "from" characters, a semi-colon and a list of "to"
              characters.  Example: "abc;ABC"
    */

    // Step 0: Shortcut for empty langmap
    if (langmap === '') {
      this.toQwerty = {};
      this.fromQwerty = {};
      return;
    }

    // Step 1: Separate into parts.
    // Technically the regex /(?<!(^|[^\\])\\(\\\\)*)\,/ should do the trick,
    // but Javascript's implementation disagrees.
    const separators = [...langmap.matchAll(/(?<!(^|[^\\])\\(\\\\)*)\,|$/g)].map((x) => x.index);
    const parts = separators.map((separatorIndex, arrayIndex) =>
      langmap.substring(
        arrayIndex === 0 ? 0 : (separators[arrayIndex - 1] as number) + 1,
        separatorIndex
      )
    );

    // Step 2: Parse each part
    this.toQwerty = {};

    function getEscaped(list: string) {
      const characters = [];
      let escaped = false;
      for (const character of list) {
        if (character === '/') {
          escaped = !escaped;
          if (escaped) continue;
        }
        characters.push(character);
      }
      return characters;
    }

    for (const part of parts) {
      const semicolon = [...langmap.matchAll(/(?<!(^|[^\\])\\(\\\\)*)\;/g)].map((x) => x.index);
      if (semicolon.length > 1) continue; // skip over malformed part
      if (semicolon.length === 0) {
        // List of pairs of "from" and "to" characters
        const pairs = getEscaped(part);
        if (pairs.length % 2 !== 0) continue; // skip over malformed part
        for (let i = 0; i < pairs.length; i += 2) this.toQwerty[pairs[i]] = pairs[i + 1];
      } else {
        // List of "from" characters and list of "to" characters
        const from = getEscaped(part.substring(0, semicolon[0] as number));
        const to = getEscaped(part.substring((semicolon[0] as number) + 1));
        if (from.length !== to.length) continue; // skip over malformed part
        for (let i = 0; i < from.length; i += 2) this.toQwerty[from[i]] = to[i + 1];
      }
    }

    // Step 3: Reverse mapping
    this.fromQwerty = Object.fromEntries(Object.entries(this.toQwerty).map((x) => [x[1], x[0]]));
  }

  //
  // Mapping logic
  //

  private map(map: { [key: string]: string }, key: string) {
    if (key.length !== 1 || !(key in map)) return key;
    return map[key]; // notice that we're not remapping <C-> combinations. this is because in vim, ctrl remapping is not handled either
  }

  public remapKey(key: string): string {
    return this.map(this.toQwerty, key);
  }

  private unmapKey(key: string): string {
    return this.map(this.fromQwerty, key);
  }

  public unmapLiteral(
    // for commands that interpret some keys literally, like "f<character>", we must unmap the literal keys
    reference: readonly string[] | readonly string[][],
    keys: readonly string[]
  ): string[] {
    if (reference.length === 0 || keys.length === 0) return [];

    // find best matching if there are multiple
    if (Array.isArray(reference[0])) {
      for (const possibility of reference as string[][]) {
        if (possibility.length !== keys.length) continue;
        let allMatch = true;
        for (let i = 0; i < possibility.length; ++i) {
          if (Langmap.nonMatchable.test(possibility[i])) continue;
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
      if (Langmap.literalKeys.test((reference as string[])[i])) {
        unmapped[i] = this.unmapKey(keys[i]);
      }
    }
    return unmapped;
  }
}
