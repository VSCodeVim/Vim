export class NumericString {
  radix: number;
  value: number;
  prefix: string;
  private static octalRegex = new RegExp('^0[0-7]+');

  static parse(input: string): NumericString | null {
    let num = Number(input);
    if (isNaN(num)) {
      return null;
    }
    let radix = 10;
    let prefix = "";
    if (input.startsWith("0x")) {
      radix = 16;
      prefix = "0x";
    } else if (NumericString.octalRegex.test(input)) {
      // Re-parse, since it didn't get it right the first time
      num = parseInt(input, 8);
      radix = 8;
      prefix = "0";
    }

    return new NumericString(num, radix, prefix);
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