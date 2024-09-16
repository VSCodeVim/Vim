import {
  Parser,
  regexp,
  seq,
  alt,
  // eslint-disable-next-line id-denylist
  string,
  lazy,
  // eslint-disable-next-line id-denylist
  any,
  optWhitespace,
  takeWhile,
  noneOf,
} from 'parsimmon';
import { ErrorCode, VimError } from '../../error';
import { binary, float, lambda, listExpr, int, str, blob } from './build';
import {
  BinaryOp,
  BlobValue,
  DictionaryExpression,
  EntryExpression,
  EnvVariableExpression,
  Expression,
  FloatValue,
  FuncrefCallExpression,
  FunctionCallExpression,
  IndexExpression,
  LambdaExpression,
  ListExpression,
  MethodCallExpression,
  NumberValue,
  OptionExpression,
  RegisterExpression,
  SliceExpression,
  StringValue,
  VariableExpression,
} from './types';

// TODO: Support dots between bytes
const blobParser: Parser<BlobValue> = regexp(/0[z]/i).then(
  regexp(/[0-1a-z]+/i).map<BlobValue>((hexData) => {
    if (hexData.length % 2 !== 0) {
      throw VimError.fromCode(ErrorCode.BlobLiteralShouldHaveAnEvenNumberOfHexCharacters);
    }
    const data = new Uint8Array(new ArrayBuffer(hexData.length / 2));
    for (let i = 0; i < hexData.length; i += 2) {
      data[i / 2] = Number.parseInt(hexData.substring(i, i + 2), 16);
    }
    return blob(data);
  }),
);

const binaryNumberParser: Parser<NumberValue> = regexp(/0[b]/i).then(
  regexp(/[0-1]+/).map((x) => {
    return int(Number.parseInt(x, 2));
  }),
);

const hexadecimalNumberParser: Parser<NumberValue> = regexp(/0[x]/i)
  .then(regexp(/[0-9a-f]+/i))
  .map((x) => {
    return int(Number.parseInt(x, 16));
  });

const decimalOrOctalNumberParser: Parser<NumberValue> = regexp(/\d+/).map((x) => {
  const base = x.startsWith('0') && /^[0-7]+$/.test(x) ? 8 : 10;
  return int(Number.parseInt(x, base));
});

const floatParser: Parser<FloatValue> = seq(
  regexp(/\d+\.\d+/).map((x) => Number.parseFloat(x)),
  alt(string('e'), string('E'))
    .then(
      seq(alt(string('+'), string('-')).fallback(undefined), regexp(/\d+/)).map(([sign, _num]) => {
        const num = Number.parseInt(_num, 10);
        if (sign === '-') {
          return -num;
        }
        return num;
      }),
    )
    .fallback(0),
)
  .map(([num, exp]) => float(num * Math.pow(10, exp)))
  .desc('a float');

export const numberParser: Parser<NumberValue> = seq(
  alt(string('+'), string('-')).fallback(undefined),
  alt(binaryNumberParser, hexadecimalNumberParser, decimalOrOctalNumberParser),
)
  .map(([sign, num]) => {
    if (sign === '-') {
      num.value = -num.value;
    }
    return num;
  })
  .desc('a number');

const stringParser: Parser<StringValue> = alt(
  string('\\')
    // eslint-disable-next-line id-denylist
    .then(any.fallback(undefined))
    .map((escaped) => {
      // TODO: handle other special chars (:help expr-quote)
      if (escaped === undefined) {
        throw VimError.fromCode(ErrorCode.MissingQuote); // TODO: parameter
      } else if (escaped === '\\') {
        return '\\';
      } else if (escaped === '"') {
        return '"';
      } else if (escaped === 'n') {
        return '\n';
      } else if (escaped === 't') {
        return '\t';
      } else {
        return `\\${escaped}`;
      }
    }),
  noneOf('"'),
)
  .many()
  .wrap(string('"'), string('"'))
  .desc('a string')
  .map((segments) => {
    return { type: 'string', value: segments.join('') };
  });

const literalStringParser: Parser<StringValue> = regexp(/[^']*/)
  .sepBy(string("''"))
  .wrap(string("'"), string("'"))
  .desc('a literal string')
  .map((segments) => {
    return { type: 'string', value: segments.join("'") };
  });

const listParser: Parser<ListExpression> = lazy(() => expressionParser)
  .sepBy(string(',').trim(optWhitespace))
  .skip(string(',').atMost(1))
  .trim(optWhitespace)
  .wrap(string('['), string(']'))
  .map((items) => listExpr(items))
  .desc('a list');

const dictionaryParser: Parser<DictionaryExpression> = lazy(() =>
  alt(
    string('#').then(
      seq(
        takeWhile((char) => char !== ':')
          .map((x) => str(x))
          .skip(string(':'))
          .trim(optWhitespace),
        expressionParser,
      )
        .sepBy(string(',').trim(optWhitespace))
        .skip(string(',').atMost(1))
        .trim(optWhitespace)
        .wrap(string('{'), string('}')),
    ),
    seq(expressionParser.skip(string(':').trim(optWhitespace)), expressionParser)
      .sepBy(string(',').trim(optWhitespace))
      .skip(string(',').atMost(1))
      .trim(optWhitespace)
      .wrap(string('{'), string('}')),
  ).desc('a dictionary'),
).map((items) => {
  return {
    type: 'dictionary',
    items,
  };
});

export const optionParser: Parser<OptionExpression> = string('&')
  .then(
    seq(
      alt(string('g'), string('l')).skip(string(':')).atMost(1),
      regexp(/[a-z]+/).desc('&option'),
    ),
  )
  .map(([scope, name]) => {
    return { type: 'option', scope: scope ? scope[0] : undefined, name };
  });

const nestedExpressionParser: Parser<Expression> = lazy(() => expressionParser)
  .trim(optWhitespace)
  .wrap(string('('), string(')'))
  .desc('a nested expression');

export const variableParser: Parser<VariableExpression> = seq(
  alt(
    string('b'),
    string('w'),
    string('t'),
    string('g'),
    string('l'),
    string('s'),
    string('a'),
    string('v'),
  )
    .skip(string(':'))
    .fallback(undefined),
  regexp(/[a-zA-Z][a-zA-Z0-9]*/).desc('a variable'),
).map(([namespace, name]) => {
  return { type: 'variable', namespace, name };
});

export const envVariableParser: Parser<EnvVariableExpression> = string('$')
  .then(regexp(/[a-z]+/))
  .desc('$ENV')
  .map((name) => {
    return { type: 'env_variable', name };
  });

export const registerParser: Parser<RegisterExpression> = string('@')
  .then(any)
  .desc('@register')
  .map((name) => {
    return { type: 'register', name };
  });

const functionArgsParser: Parser<Expression[]> = lazy(() =>
  expressionParser
    .sepBy(string(',').trim(optWhitespace))
    .trim(optWhitespace)
    .wrap(string('('), string(')')),
);

export const functionCallParser: Parser<FunctionCallExpression> = seq(
  regexp(/[a-z0-9_]+/).skip(optWhitespace),
  functionArgsParser,
)
  .desc('a function call')
  .map(([func, args]) => {
    return {
      type: 'function_call',
      func,
      args,
    };
  });

const lambdaParser: Parser<LambdaExpression> = seq(
  regexp(/[a-z]+/i)
    .sepBy(string(',').trim(optWhitespace))
    .skip(string('->').trim(optWhitespace)),
  lazy(() => expressionParser).desc('a lambda'),
)
  .trim(optWhitespace)
  .wrap(string('{'), string('}'))
  .map(([args, body]) => {
    return lambda(args, body);
  });

// TODO: Function call with funcref
// TODO: Variable/function with curly braces
const expr9Parser: Parser<Expression> = alt(
  blobParser,
  floatParser,
  numberParser,
  stringParser,
  literalStringParser,
  listParser,
  dictionaryParser,
  optionParser,
  nestedExpressionParser,
  functionCallParser, // NOTE: this is out of order with :help expr, but it seems necessary
  variableParser,
  envVariableParser,
  registerParser,
  lambdaParser,
);

const indexParser: Parser<(expr: Expression) => IndexExpression> = lazy(() =>
  expressionParser.trim(optWhitespace).wrap(string('['), string(']')),
).map((index) => {
  return (expression: Expression) => {
    return { type: 'index', expression, index };
  };
});

const sliceParser: Parser<(expr: Expression) => SliceExpression> = lazy(() =>
  seq(expressionParser.atMost(1).skip(string(':').trim(optWhitespace)), expressionParser.atMost(1))
    .trim(optWhitespace)
    .wrap(string('['), string(']')),
).map(([start, end]) => {
  return (expression: Expression) => {
    return { type: 'slice', expression, start: start[0], end: end[0] };
  };
});

const entryParser: Parser<(expr: Expression) => EntryExpression> = string('.')
  .then(regexp(/[a-z0-9]+/i))
  .map((entryName) => {
    return (expression: Expression) => {
      return {
        type: 'entry',
        expression,
        entryName,
      };
    };
  });

const funcrefCallParser: Parser<(expr: Expression) => FuncrefCallExpression> = functionArgsParser
  .desc('a funcref call')
  .map((args) => {
    return (expression: Expression) => {
      return {
        type: 'funcrefCall',
        expression,
        args,
      };
    };
  });

// TODO: Support method call with lambda
const methodCallParser: Parser<(expr: Expression) => MethodCallExpression> = string('->')
  .then(seq(regexp(/[a-z]+/i), functionArgsParser))
  .desc('a method call')
  .map(([methodName, args]) => {
    return (expression: Expression) => {
      return {
        type: 'methodCall',
        methodName,
        expression,
        args,
      };
    };
  });

const expr8Parser: Parser<Expression> = seq(
  expr9Parser,
  alt<(expr: Expression) => Expression>(
    indexParser,
    sliceParser,
    entryParser,
    funcrefCallParser,
    methodCallParser,
  ).many(),
)
  .desc('expr8')
  .map(([expression, things]) => things.reduce((expr, thing) => thing(expr), expression));

// Logical NOT, unary plus/minus
const expr7Parser: Parser<Expression> = alt<Expression>(
  seq(
    alt(string('!'), string('-'), string('+')),
    lazy(() => expr7Parser),
  ).map(([operator, operand]) => {
    return { type: 'unary', operator, operand };
  }),
  expr8Parser,
).desc('expr7');

// Number multiplication/division/modulo
const expr6Parser: Parser<Expression> = seq(
  expr7Parser,
  seq(alt(string('*'), string('/'), string('%')).trim(optWhitespace), expr7Parser).many(),
)
  .map(leftAssociative)
  .desc('expr6');

// Number addition/subtraction, string/list/blob concatenation
const expr5Parser: Parser<Expression> = seq(
  expr6Parser,
  seq(
    alt(string('+'), string('-'), string('..'), string('.')).trim(optWhitespace),
    expr6Parser,
  ).many(),
)
  .map(leftAssociative)
  .desc('expr5');

// Comparison
const expr4Parser: Parser<Expression> = alt<Expression>(
  seq(
    expr5Parser,
    seq(
      alt(
        string('=='),
        string('!='),
        string('>'),
        string('>='),
        string('<'),
        string('<='),
        string('=~'),
        string('!~'),
        string('is'),
        string('isnot'),
      ),
      regexp(/[#\?]?/),
    ).trim(optWhitespace),
    expr5Parser,
  ).map(([lhs, [operator, matchCase], rhs]) => {
    return {
      type: 'comparison',
      operator,
      matchCase: matchCase === '#' ? true : matchCase === '?' ? false : undefined,
      lhs,
      rhs,
    };
  }),
  expr5Parser,
).desc('expr4');

// Logical AND
const expr3Parser: Parser<Expression> = seq(
  expr4Parser,
  seq(string('&&').trim(optWhitespace), expr4Parser).many(),
)
  .map(leftAssociative)
  .desc('expr3');

// Logical OR
const expr2Parser: Parser<Expression> = seq(
  expr3Parser,
  seq(string('||').trim(optWhitespace), expr3Parser).many(),
)
  .map(leftAssociative)
  .desc('expr2');

// If-then-else
const expr1Parser: Parser<Expression> = alt<Expression>(
  seq(
    expr2Parser,
    string('?').trim(optWhitespace),
    expr2Parser,
    string(':').trim(optWhitespace),
    expr2Parser,
  ).map(([_if, x, _then, y, _else]) => {
    return { type: 'ternary', if: _if, then: _then, else: _else };
  }),
  expr2Parser,
).desc('an expression');

function leftAssociative(args: [Expression, Array<[BinaryOp, Expression]>]) {
  let lhs = args[0];
  for (const [operator, rhs] of args[1]) {
    lhs = binary(lhs, operator, rhs);
  }
  return lhs;
}

export const expressionParser = expr1Parser;
