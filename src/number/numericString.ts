export class NumericString {
  radix: number;
  value: number;
  prefix: string;

  private static matchings: { regex: RegExp, base: number, prefix: string }[] = [
    { regex: /^0([0-7]+)$/, base: 8, prefix: "0"},
    { regex: /^(\d+)$/, base: 10, prefix: ""},
    { regex: /^0x([\da-fA-F]+)$/, base: 16, prefix: "0x"},
  ];

  static parse(input: string): NumericString | null {
    for (let matcher of NumericString.matchings) {
      const match = matcher.regex.exec(input);
      if (match == null) {
        continue;
      }
      return new NumericString(parseInt(match[1], matcher.base), matcher.base, matcher.prefix);
    }
    return null;
  }

  constructor(value: number, radix: number, prefix: string) {
    this.value = value;
    this.radix = radix;
    this.prefix = prefix;
  }

  public toString(): string {
    return this.prefix + this.value.toString(this.radix);
  }
}