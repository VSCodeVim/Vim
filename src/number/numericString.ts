export class NumericString {
  radix: number;
  value: number;
  prefix: string;

  static parse(input: string): NumericString | null {
    const num = Number(input);
    if (isNaN(num)) {
      return null;
    }
    let radix = 10;
    let prefix = "";
    if (input.startsWith("0x")) {
      radix = 16;
      prefix = "0x";
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