import { lex } from './lexer';
import { CommandLine } from './node';
import { Token, TokenType } from './token';
import { Logger } from '../util/logger';
import { VimError, ErrorCode } from '../error';
import { getParser } from './subparser';

const logger = Logger.get('Parser');

interface IParseFunction {
  (state: ParserState, command: CommandLine): IParseFunction | undefined;
}

export function parse(input: string): CommandLine {
  const cmd = new CommandLine();
  let f: IParseFunction | undefined = parseLineRange;
  let state: ParserState = new ParserState(input);
  while (f) {
    f = f(state, cmd);
  }
  return cmd;
}

function parseLineRange(state: ParserState, commandLine: CommandLine): IParseFunction | undefined {
  while (true) {
    let tok = state.next();
    switch (tok.type) {
      case TokenType.Eof:
        return undefined;
      case TokenType.Dot:
      case TokenType.Dollar:
      case TokenType.Percent:
      case TokenType.Comma:
      case TokenType.LineNumber:
      case TokenType.SelectionFirstLine:
      case TokenType.SelectionLastLine:
      case TokenType.Mark:
      case TokenType.Offset:
      case TokenType.Plus:
      case TokenType.Minus:
        commandLine.range.addToken(tok);
        continue;
      case TokenType.CommandName:
        state.backup();
        return parseCommand;
      default:
        logger.warn(`Parser: skipping token Token(${tok.type},{${tok.content}})`);
        return undefined;
    }
  }
}

function parseCommand(state: ParserState, commandLine: CommandLine): IParseFunction | undefined {
  while (!state.isAtEof) {
    const tok = state.next();
    switch (tok.type) {
      case TokenType.CommandName:
        const commandParser = getParser(tok.content);
        if (!commandParser) {
          throw VimError.fromCode(ErrorCode.NotAnEditorCommand, state.input);
        }
        // TODO: Pass the args, but keep in mind there could be multiple commands, not just one.
        const argsTok = state.next();
        const args = argsTok.type === TokenType.CommandArgs ? argsTok.content : '';
        commandLine.command = commandParser(args);
        return undefined;
      default:
        throw new Error('Not implemented');
    }
  }

  if (!state.isAtEof) {
    state.backup();
    return parseCommand;
  } else {
    return undefined;
  }
}

// Keeps track of parsing state.
class ParserState {
  input: string;
  tokens: Token[] = [];
  pos: number = 0;

  constructor(input: string) {
    this.input = input;
    this.tokens = lex(input);
  }

  next(): Token {
    if (this.pos >= this.tokens.length) {
      this.pos = this.tokens.length;
      return new Token(TokenType.Eof, '__EOF__');
    }
    let tok = this.tokens[this.pos];
    this.pos++;
    return tok;
  }

  backup(): void {
    this.pos--;
  }

  get isAtEof() {
    return this.pos >= this.tokens.length;
  }
}
