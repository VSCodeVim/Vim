export class NumericString {
  radix: number;
  value: number;
  prefix: string;
  suffix: string;

  private static matchings: { regex: RegExp; radix: number; prefix: string }[] = [
    { regex: /([-+])?0([0-7]+)/, radix: 8, prefix: '0' },
    { regex: /([-+])?(\d+)/, radix: 10, prefix: '' },
    { regex: /([-+])?0x([\da-fA-F]+)/, radix: 16, prefix: '0x' },
  ];

  public static parse(input: string): NumericString | undefined {
    // Find core numeric part of input
    let coreBegin = -1;
    let coreLength = -1;
    let coreRadix = -1;
    let numPrefix = '';
    for (const { regex, radix, prefix } of NumericString.matchings) {
      const match = regex.exec(input);
      if (match != null) {
        // Get the left and large possible match
        if (
          coreRadix < 0 ||
          match.index < coreBegin ||
          (match.index === coreBegin && match[0].length > coreLength)
        ) {
          coreBegin = match.index;
          coreLength = match[0].length;
          coreRadix = radix;
          numPrefix = prefix;
        }
      }
    }

    if (coreRadix < 0) {
      return undefined;
    }

    const coreEnd = coreBegin + coreLength;

    const corePrefix = input.slice(0, coreBegin) + numPrefix;
    const core = input.slice(coreBegin, coreEnd);
    const coreSuffix = input.slice(coreEnd, input.length);

    return new NumericString(parseInt(core, coreRadix), coreRadix, corePrefix, coreSuffix);
  }

  private constructor(value: number, radix: number, prefix: string, suffix: string) {
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
