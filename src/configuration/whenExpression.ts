export type WhenContextValue = boolean | string | undefined;

type TokenType =
  | 'identifier'
  | 'string'
  | 'boolean'
  | 'and'
  | 'or'
  | 'not'
  | 'equals'
  | 'notEquals'
  | 'lparen'
  | 'rparen'
  | 'eof';

interface Token {
  type: TokenType;
  value?: string | boolean;
}

class WhenExpressionSyntaxError extends Error {}

class Tokenizer {
  private position = 0;
  private readonly expression: string;

  constructor(expression: string) {
    this.expression = expression;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.position < this.expression.length) {
      this.skipWhitespace();
      if (this.position >= this.expression.length) {
        break;
      }

      const remaining = this.expression.slice(this.position);
      if (remaining.startsWith('&&')) {
        tokens.push({ type: 'and' });
        this.position += 2;
        continue;
      }

      if (remaining.startsWith('||')) {
        tokens.push({ type: 'or' });
        this.position += 2;
        continue;
      }

      if (remaining.startsWith('==')) {
        tokens.push({ type: 'equals' });
        this.position += 2;
        continue;
      }

      if (remaining.startsWith('!=')) {
        tokens.push({ type: 'notEquals' });
        this.position += 2;
        continue;
      }

      const current = this.expression[this.position];
      if (current === '!') {
        tokens.push({ type: 'not' });
        this.position += 1;
        continue;
      }

      if (current === '(') {
        tokens.push({ type: 'lparen' });
        this.position += 1;
        continue;
      }

      if (current === ')') {
        tokens.push({ type: 'rparen' });
        this.position += 1;
        continue;
      }

      if (current === '"' || current === "'") {
        tokens.push({ type: 'string', value: this.readString(current) });
        continue;
      }

      const identifier = this.readIdentifier();
      if (identifier.length === 0) {
        throw new WhenExpressionSyntaxError(
          `Unexpected character '${this.expression[this.position]}' in when clause.`,
        );
      }

      if (identifier === 'true' || identifier === 'false') {
        tokens.push({ type: 'boolean', value: identifier === 'true' });
      } else {
        tokens.push({ type: 'identifier', value: identifier });
      }
    }

    tokens.push({ type: 'eof' });
    return tokens;
  }

  private skipWhitespace(): void {
    while (this.position < this.expression.length && /\s/u.test(this.expression[this.position])) {
      this.position += 1;
    }
  }

  private readString(quote: string): string {
    this.position += 1;
    let value = '';

    while (this.position < this.expression.length) {
      const current = this.expression[this.position];
      if (current === '\\') {
        this.position += 1;
        if (this.position >= this.expression.length) {
          break;
        }

        value += this.expression[this.position];
        this.position += 1;
        continue;
      }

      if (current === quote) {
        this.position += 1;
        return value;
      }

      value += current;
      this.position += 1;
    }

    throw new WhenExpressionSyntaxError('Unterminated string literal in when clause.');
  }

  private readIdentifier(): string {
    const start = this.position;

    while (this.position < this.expression.length) {
      const current = this.expression[this.position];
      if (/\s/u.test(current) || ['(', ')', '!', '&', '|', '=', '"', "'"].includes(current)) {
        break;
      }

      this.position += 1;
    }

    return this.expression.slice(start, this.position);
  }
}

class Parser {
  private position = 0;
  private readonly tokens: Token[];
  private readonly getContextValue: (key: string) => WhenContextValue;

  constructor(tokens: Token[], getContextValue: (key: string) => WhenContextValue) {
    this.tokens = tokens;
    this.getContextValue = getContextValue;
  }

  public parse(): boolean {
    const value = this.parseOr();
    this.expect('eof');
    return value;
  }

  private parseOr(): boolean {
    let value = this.parseAnd();

    while (this.match('or')) {
      const right = this.parseAnd();
      value = value || right;
    }

    return value;
  }

  private parseAnd(): boolean {
    let value = this.parseEquality();

    while (this.match('and')) {
      const right = this.parseEquality();
      value = value && right;
    }

    return value;
  }

  private parseEquality(): boolean {
    const left = this.parseOperand();

    if (this.match('equals')) {
      return left === this.parseOperand();
    }

    if (this.match('notEquals')) {
      return left !== this.parseOperand();
    }

    return this.toBoolean(left);
  }

  private parseOperand(): WhenContextValue {
    if (this.match('not')) {
      return !this.toBoolean(this.parseOperand());
    }

    if (this.match('lparen')) {
      const value = this.parseOr();
      this.expect('rparen');
      return value;
    }

    const token = this.peek();
    if (token.type === 'identifier') {
      this.position += 1;
      return this.getContextValue(String(token.value));
    }

    if (token.type === 'string' || token.type === 'boolean') {
      this.position += 1;
      return token.value as string | boolean;
    }

    throw new WhenExpressionSyntaxError('Unexpected token in when clause.');
  }

  private toBoolean(value: WhenContextValue): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    return Boolean(value);
  }

  private match(type: TokenType): boolean {
    if (this.peek().type === type) {
      this.position += 1;
      return true;
    }

    return false;
  }

  private expect(type: TokenType): void {
    if (!this.match(type)) {
      throw new WhenExpressionSyntaxError(`Expected token '${type}' in when clause.`);
    }
  }

  private peek(): Token {
    return this.tokens[this.position];
  }
}

export function evaluateWhenClause(
  expression: string,
  getContextValue: (key: string) => WhenContextValue,
): boolean {
  const tokens = new Tokenizer(expression).tokenize();
  return new Parser(tokens, getContextValue).parse();
}

export function validateWhenClause(expression: string): string | undefined {
  try {
    evaluateWhenClause(expression, () => undefined);
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid when clause.';
  }
}
