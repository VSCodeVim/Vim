/**
 *      aaaa0x111bbbbbb
 *      |-------------| => NumericString
 *      |--|            => prefix
 *          |---|       => core
 *               |----| => suffix
 *          ||          => numPrefix
 *            |-|       => num
 *
 * Greedy matching, leftmost match wins.
 * If multiple matches begin at the same position, the match with the biggest
 *   span wins.
 * If multiple matches have the same begin position and span (This usually
 *   happens on octal and decimal), following priority sequence is used:
 *   (decimal => octal => hexadecimal)
 *
 * Example:
 *                    |  core  |     What we got      |     Rather than     |
 *  ------------------|--------|----------------------|---------------------|
 *  Leftmost rule:    | 010xff |    (010)xff [octal]  |    01(0xff) [hex]   |
 *  Biggest span rule:| 0xff   |     (0xff) [hex]     |   (0)xff [decimal]  |
 *  Priority rule:    | 00007  |    (00007) [octal]   |  (00007) [decimal]  |
 *
 * Side Effect:
 *  -0xf  Will be parsed as (-0)xf rather than -(0xf), current workaround is
 *          capturing '-' in hexadecimal regex but not consider '-' as a part
 *          of the number. This is achieved by using `negative` boolean value
 *          in `NumericString`.
 */
export class NumericString {
  radix: number;
  value: number;
  numLength: number;
  prefix: string;
  suffix: string;
  // If a negative sign should be manually added when converting to string.
  negative: boolean;

  // Map radix to number prefix
  private static numPrefix = {
    8: '0',
    10: '',
    16: '0x',
  };

  // Keep octal at the top of decimal to avoid regarding 0000007 as decimal.
  // '000009' matches decimal.
  // '000007' matches octal.
  // '-0xf' matches hex rather than decimal '-0'
  private static matchings: { regex: RegExp; radix: number }[] = [
    { regex: /(-)?0[0-7]+/, radix: 8 },
    { regex: /(-)?\d+/, radix: 10 },
    { regex: /(-)?0x[\da-fA-F]+/, radix: 16 },
  ];

  // Return parse result and offset of suffix
  public static parse(input: string): { num: NumericString; suffixOffset: number } | undefined {
    // Find core numeric part of input
    let coreBegin = -1;
    let coreLength = -1;
    let coreRadix = -1;
    let coreSign = false;
    for (const { regex, radix } of NumericString.matchings) {
      const match = regex.exec(input);
      if (match != null) {
        // Get the leftmost and largest match
        if (
          coreRadix < 0 ||
          match.index < coreBegin ||
          (match.index === coreBegin && match[0].length > coreLength)
        ) {
          coreBegin = match.index;
          coreLength = match[0].length;
          coreRadix = radix;
          coreSign = match[1] === '-';
        }
      }
    }

    if (coreRadix < 0) {
      return undefined;
    }

    const coreEnd = coreBegin + coreLength;

    const prefix = input.slice(0, coreBegin);
    const core = input.slice(coreBegin, coreEnd);
    const suffix = input.slice(coreEnd, input.length);

    let value = parseInt(core, coreRadix);

    // 0x00ff:  numLength = 4
    // 077:     numLength = 2
    // -0999:   numLength = 3
    // The numLength is only useful for parsing non-decimal. Decimal with
    // leading zero will be trimmed in `toString()`. If value is negative,
    // remove the width of negative sign.
    const numLength = coreLength - NumericString.numPrefix[coreRadix].length - (coreSign ? 1 : 0);

    // According to original vim's behavior, for hex and octal, the leading
    // '-' *should* be captured and preserved but *should not* be regarded as
    // part of number, which means with <C-a>, `-0xf` turns into `-0x10`. So
    // for hex and octal, we make the value absolute and set the negative
    // sign flag.
    let negative = false;
    if (coreRadix !== 10 && coreSign) {
      value = -value;
      negative = true;
    }

    return {
      num: new NumericString(value, coreRadix, numLength, prefix, suffix, negative),
      suffixOffset: coreEnd,
    };
  }

  private constructor(
    value: number,
    radix: number,
    numLength: number,
    prefix: string,
    suffix: string,
    negative: boolean
  ) {
    this.value = value;
    this.radix = radix;
    this.numLength = numLength;
    this.prefix = prefix;
    this.suffix = suffix;
    this.negative = negative;
  }

  public toString(): string {
    // For decreased octal and hexadecimal
    if (this.radix !== 10) {
      const max = 0xffffffff;
      while (this.value < 0) {
        this.value = max + this.value + 1;
      }
    }

    // Gen num part
    const absValue = Math.abs(this.value);
    let num = absValue.toString(this.radix);
    // numLength of decimal *should not* be preserved.
    if (this.radix !== 10) {
      const diff = this.numLength - num.length;
      if (diff > 0) {
        // Preserve num length if it's narrower.
        num = '0'.repeat(diff) + num;
      }
    }

    const sign = this.negative || this.value < 0 ? '-' : '';
    const core = sign + NumericString.numPrefix[this.radix] + num;
    return this.prefix + core + this.suffix;
  }
}
