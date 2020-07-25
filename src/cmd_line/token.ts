// Tokens for the Vim command line.

export enum TokenType {
  Unknown,
  Eof,
  LineNumber,
  Dot,
  Dollar,
  Percent,
  Comma,
  Plus,
  Minus,
  CommandName,
  CommandArgs,
  ForwardSearch,
  ReverseSearch,
  Offset,
  /**
   * Marks
   */
  SelectionFirstLine,
  SelectionLastLine,
  Mark,
}

export class Token {
  type: TokenType;
  content: string;

  constructor(type: TokenType, content: string) {
    this.type = type;
    this.content = content;
  }
}
