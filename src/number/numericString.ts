export class NumericString {
  radix: number;
  value: number;
  prefix: string;
  suffix: string;

  private static matchings: { regex: RegExp, base: number, prefix: string }[] = [
    { regex: /^([-+])?0([0-7]+)$/, base: 8, prefix: "0" },
    { regex: /^([-+])?(\d+)$/, base: 10, prefix: "" },
    { regex: /^([-+])?0x([\da-fA-F]+)$/, base: 16, prefix: "0x" },
    { regex: /\d/, base: 10, prefix: "" }
  ];

  static parse(input: string): NumericString | null {
    for (const { regex, base, prefix } of NumericString.matchings) {
      const match = regex.exec(input);
      if (match == null) {
        continue;
      }

      // Regex to determine if this number has letters around it,
      // if it doesn't then that is easy and no prefix or suffix is needed
      let findNondigits = /[^\d-+]+/i;

      // Regex to find any leading characters before the number
      let findPrefix = /^[^\d-+]+(?=[0-9]+)/i;

      // Regex to find any trailing characters after the number
      let findSuffix = /[^\d]*$/i;

      let newPrefix = prefix;
      let newSuffix = "";
      let newNum = input;

      // Only use this section if this is a number surrounded by letters
      if (findNondigits.exec(input) !== null && NumericString.matchings[NumericString.matchings.length - 1].regex === regex) {
        let prefixFound = findPrefix.exec(input);
        let suffixFound = findSuffix.exec(input);

        // Find the prefix if it exists
        if (prefixFound !== null) {
          newPrefix = prefixFound.toString();
        }

        // Find the suffix if it exists
        if (suffixFound !== null) {
          newSuffix = suffixFound.toString();
        }

        // Obtain just the number with no extra letters
        newNum = input.replace(/[^\d-+]+/ig, '');
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
        this.value = 0xFFFFFFFF + this.value + 1;
      }
    }

    return this.prefix + this.value.toString(this.radix) + this.suffix;
  }
}
