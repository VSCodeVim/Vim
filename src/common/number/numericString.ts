export class NumericString {
  radix: number;
  value: number;
  prefix: string;
  suffix: string;

  private static matchings: { regex: RegExp; base: number; prefix: string }[] = [
    { regex: /^([-+])?0([0-7]+)$/g, base: 8, prefix: '0' },
    { regex: /^([-+])?(\d+)$/g, base: 10, prefix: '' },
    { regex: /^([-+])?0x([\da-fA-F]+)$/g, base: 16, prefix: '0x' },
    { regex: /\d/, base: 10, prefix: '' },
  ];

  // Regex to determine if this number has letters around it,
  // if it doesn't then that is easy and no prefix or suffix is needed
  private static findNondigits = /[^\d-+]+/g;

  // Regex to find any leading characters before the number
  private static findPrefix = /^[^\d-+]+(?=[0-9]+)/g;

  // Regex to find any trailing characters after the number
  private static findSuffix = /[^\d]*[\d]*(.*)/g;

  static parse(input: string): NumericString | null {
    for (const { regex, base, prefix } of NumericString.matchings) {
      if (!regex.test(input)) {
        continue;
      }

      let newPrefix = prefix;
      let newSuffix = '';
      let newNum = input;

      // Only use this section if this is a number surrounded by letters
      if (
        NumericString.findNondigits.test(input) &&
        NumericString.matchings[NumericString.matchings.length - 1].regex === regex
      ) {
        const prefixFound = NumericString.findPrefix.exec(input);
        const suffixFound = NumericString.findSuffix.exec(input);

        // Find the prefix if it exists
        if (prefixFound !== null) {
          newPrefix = prefixFound.toString();
        }

        // Find the suffix if it exists
        if (suffixFound !== null) {
          newSuffix = suffixFound[1].toString();
        }

        // Obtain just the number with no extra letters
        newNum = newNum.slice(newPrefix.length, newNum.length - newSuffix.length);
      }

      return new NumericString(parseInt(newNum, base), base, newPrefix, newSuffix);
    }
    return null;
  }

  constructor(value: number, radix: number, prefix: string, suffix: string) {
    this.value = value;
    this.radix = radix;
    this.prefix = prefix;
    this.suffix = suffix;
  }

  public toString(): string {
    // Allow signed hex represented as twos complement
    if (this.radix === 16) {
      if (this.value < 0) {
        this.value = 0xffffffff + this.value + 1;
      }
    }

    return this.prefix + this.value.toString(this.radix) + this.suffix;
  }
}
