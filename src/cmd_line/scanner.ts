// Provides state and behavior to scan an input string character by character.
export class Scanner {
  static EOF: string = '__EOF__';
  start: number = 0;
  pos: number = 0;
  input: string;

  constructor(input: string) {
    this.input = input;
  }

  // Returns the next character in the input, or EOF.
  next(): string {
    if (this.isAtEof) {
      this.pos = this.input.length;
      return Scanner.EOF;
    }
    const c = this.input[this.pos];
    this.pos++;
    return c;
  }

  nextWhile(fn: (c: string) => boolean): string {
    if (this.isAtEof) {
      return '';
    }

    while (true) {
      const c = this.next();

      if (c === Scanner.EOF) {
        break;
      } else if (!fn(c)) {
        this.backup();
        break;
      }
    }

    return this.emit();
  }

  // Returns the next word in the input, or EOF.
  nextWord(wordSeparators: string[] = [' ', '\t']): string {
    this.skipRun(wordSeparators);

    if (this.isAtEof) {
      this.pos = this.input.length;
      return Scanner.EOF;
    }

    let result = '';
    let c: string | undefined;

    while (!this.isAtEof) {
      c = this.next();

      if (c === Scanner.EOF || wordSeparators.includes(c)) {
        break;
      }

      result += c;
    }

    if (c && wordSeparators.includes(c)) {
      this.backup();
    }

    this.ignore();
    return result;
  }

  // Returns whether we've reached EOF.
  get isAtEof(): boolean {
    return this.pos >= this.input.length;
  }

  // Ignores the span of text between the current start and the current position.
  ignore(): void {
    this.start = this.pos;
  }

  // Returns the span of text between the current start and the current position.
  emit(): string {
    const s = this.input.substring(this.start, this.pos);
    this.ignore();
    return s;
  }

  // Returns the text from the current position to the end.
  remaining(): string {
    while (!this.isAtEof) {
      this.next();
    }
    return this.emit();
  }

  backup(): void {
    this.pos--;
  }

  // skips over c and ignores the text span
  skip(c: string): void {
    if (this.isAtEof) {
      return;
    }
    let s = this.next();
    while (!this.isAtEof) {
      if (s !== c) {
        break;
      }
      s = this.next();
    }
    this.backup();
    this.ignore();
  }

  // skips text while any of chars matches and ignores the text span
  skipRun(chars: string[]): void {
    if (this.isAtEof) {
      return;
    }
    while (!this.isAtEof) {
      const c = this.next();
      if (!chars.includes(c)) {
        break;
      }
    }
    this.backup();
    this.ignore();
  }

  // skips over whitespace (tab, space) and ignores the text span
  skipWhiteSpace(): void {
    if (this.isAtEof) {
      return;
    }
    let c: string | null = null;

    while (!this.isAtEof) {
      c = this.next();
      if (c === ' ' || c === '\t') {
        continue;
      }
      break;
    }

    if (c !== Scanner.EOF && c !== ' ' && c !== '\t') {
      this.backup();
    }
    this.ignore();
  }

  expect(value: string): void {
    if (!this.input.substring(this.pos).startsWith(value)) {
      throw new Error('Unexpected character.');
    }
    this.pos += value.length;
  }

  expectOneOf(values: string[]): void {
    const match = values.filter((s) => this.input.substr(this.pos).startsWith(s));
    if (match.length !== 1) {
      if (match.length > 1) {
        throw new Error('Too many matches.');
      }
      throw new Error('Unexpected character.');
    }
    this.pos += match[0].length;
  }
}
