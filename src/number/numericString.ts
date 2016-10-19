export class NumericString {
  radix: number;
  value: number;
  prefix: string;
  postfix: string;

  private static matchings: { regex: RegExp, base: number, prefix: string }[] = [
    { regex: /^([-+])?0([0-7]+)$/, base: 8, prefix: "0" },
    { regex: /^([-+])?(\d+)$/, base: 10, prefix: "" },
    { regex: /^([-+])?0x([\da-fA-F]+)$/, base: 16, prefix: "0x" },
    { regex: /^[a-z0-9]+$/i, base: 10, prefix: "" }
  ];

  static parse(input: string): NumericString | null {
    for (const { regex, base, prefix } of NumericString.matchings) {
      const match = regex.exec(input);
      if (match == null) {
        continue;
      }

      let findLetters = /[a-z]+/i;
      let findPrefix = /^[^\d]+(?=[0-9]+)/i;
      let findPostfix = /^[0-9]+(?=[^\d]+)/i;

      let newPrefix = prefix;
      let newPostfix = "";

      if (findLetters.exec(match[0]) !== null) {
        newPrefix = findPrefix.exec(match[0]).toString();
        newPostfix = findPostfix.exec(match[0]).toString();
        match[0] = match[0].replace(/^[a-z]+/i, '');
      }

      return new NumericString(parseInt(match[0], base), base, newPrefix, newPostfix);
    }
    return null;
  }

  constructor(value: number, radix: number, prefix: string, postfix: string) {
    this.value = value;
    this.radix = radix;
    this.prefix = prefix;
    this.postfix = postfix;
  }

  public toString(): string {
    return this.prefix + this.value.toString(this.radix) + this.postfix;
  }
}