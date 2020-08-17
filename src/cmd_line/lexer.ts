import { Scanner } from './scanner';
import { Token, TokenType } from './token';

// Describes a function that can lex part of a Vim command line.
interface ILexFunction {
  (state: Scanner, tokens: Token[]): ILexFunction | null;
}

export function lex(input: string): Token[] {
  // We use a character scanner as state for the lexer.
  const state = new Scanner(input);
  let tokens: Token[] = [];
  let f: ILexFunction | null = LexerFunctions.lexRange;
  while (f) {
    // Each lexing function returns the next lexing function or null.
    f = f(state, tokens);
  }
  return tokens;
}

function emitToken(type: TokenType, state: Scanner): Token | null {
  const content = state.emit();

  return content.length > 0 ? new Token(type, content) : null;
}

namespace LexerFunctions {
  // Starts lexing a Vim command line and delegates on other lexer functions as needed.
  export function lexRange(state: Scanner, tokens: Token[]): ILexFunction | null {
    while (true) {
      if (state.isAtEof) {
        break;
      }
      const c = state.next();
      switch (c) {
        case ',':
        case ';':
          tokens.push(emitToken(TokenType.Comma, state)!);
          continue;
        case '%':
          tokens.push(emitToken(TokenType.Percent, state)!);
          continue;
        case '$':
          tokens.push(emitToken(TokenType.Dollar, state)!);
          continue;
        case '.':
          tokens.push(emitToken(TokenType.Dot, state)!);
          continue;
        case '/':
          return lexForwardSearch;
        case '?':
          return lexReverseSearch;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          if (tokens.length < 1) {
            // special case - first digitey token is always a line number
            return lexDigits(TokenType.LineNumber);
          } else {
            // otherwise, use previous token to determine which flavor of digit lexer should be used
            const previousTokenType = tokens[tokens.length - 1].type;
            if (previousTokenType === TokenType.Plus || previousTokenType === TokenType.Minus) {
              return lexDigits(TokenType.Offset);
            } else {
              return lexDigits(TokenType.LineNumber);
            }
          }
        case '+':
          tokens.push(emitToken(TokenType.Plus, state)!);
          continue;
        case '-':
          tokens.push(emitToken(TokenType.Minus, state)!);
          continue;
        case '*':
          state.ignore();
          tokens.push(new Token(TokenType.SelectionFirstLine, '<'));
          tokens.push(new Token(TokenType.Comma, ','));
          tokens.push(new Token(TokenType.SelectionLastLine, '>'));
          continue;
        case "'":
          return lexMark;
        case '!':
          tokens.push(emitToken(TokenType.CommandName, state)!);
          return lexCommandArgs;
        case ' ':
          state.ignore();
          continue;
        default:
          return lexCommand;
      }
    }

    return null;
  }

  function lexMark(state: Scanner, tokens: Token[]): ILexFunction | null {
    // The first token has already been lexed.
    if (state.isAtEof) {
      return null;
    }

    const c = state.next();
    switch (c) {
      case '<':
        tokens.push(emitToken(TokenType.SelectionFirstLine, state)!);
        break;
      case '>':
        tokens.push(emitToken(TokenType.SelectionLastLine, state)!);
        break;
      default:
        if (/[a-zA-Z]/.test(c)) {
          state.emit();
          tokens.push(new Token(TokenType.Mark, c));
        } else {
          state.backup();
        }
        break;
    }

    return lexRange;
  }

  /**
   * when we're lexing digits, it could either be a line number or an offset, depending on whether
   * our previous token was a + or a -
   *
   * so it's lexRange's job to specify which token to emit.
   */
  function lexDigits(tokenType: TokenType) {
    return function (state: Scanner, tokens: Token[]): ILexFunction | null {
      // The first digit has already been lexed.
      while (true) {
        if (state.isAtEof) {
          tokens.push(emitToken(tokenType, state)!);
          return null;
        }

        if (!/[0-9]/.test(state.next())) {
          state.backup();
          tokens.push(emitToken(tokenType, state)!);
          return lexRange;
        }
      }
    };
  }

  function lexCommand(state: Scanner, tokens: Token[]): ILexFunction | null {
    // The first character of the command's name has already been lexed.
    while (true) {
      if (state.isAtEof) {
        tokens.push(emitToken(TokenType.CommandName, state)!);
        break;
      }
      const c = state.next().toLowerCase();
      if (c >= 'a' && c <= 'z') {
        continue;
      } else {
        state.backup();
        tokens.push(emitToken(TokenType.CommandName, state)!);
        return lexCommandArgs;
      }
    }
    return null;
  }

  function lexCommandArgs(state: Scanner, tokens: Token[]): ILexFunction | null {
    while (!state.isAtEof) {
      state.next();
    }
    // TODO(guillermooo): We need to parse multiple commands.
    const args = emitToken(TokenType.CommandArgs, state);
    if (args) {
      tokens.push(args);
    }
    return null;
  }

  function lexForwardSearch(state: Scanner, tokens: Token[]): ILexFunction {
    // The first slash has already been lexed.
    state.skip('/'); // XXX: really?
    let escaping = false;
    let searchTerm = '';
    while (!state.isAtEof) {
      const c = state.next();
      if (c === '/' && !escaping) {
        break;
      }
      if (c === '\\') {
        escaping = true;
        continue;
      } else {
        escaping = false;
      }
      searchTerm += c !== '\\' ? c : '\\\\';
    }
    tokens.push(new Token(TokenType.ForwardSearch, searchTerm));
    state.ignore();
    if (!state.isAtEof) {
      state.skip('/');
    }
    return lexRange;
  }

  function lexReverseSearch(state: Scanner, tokens: Token[]): ILexFunction {
    // The first question mark has already been lexed.
    state.skip('?'); // XXX: really?
    let escaping = false;
    let searchTerm = '';
    while (!state.isAtEof) {
      const c = state.next();
      if (c === '?' && !escaping) {
        break;
      }
      if (c === '\\') {
        escaping = true;
        continue;
      } else {
        escaping = false;
      }
      searchTerm += c !== '\\' ? c : '\\\\';
    }
    tokens.push(new Token(TokenType.ReverseSearch, searchTerm));
    state.ignore();
    if (!state.isAtEof) {
      state.skip('?');
    }
    return lexRange;
  }
}
