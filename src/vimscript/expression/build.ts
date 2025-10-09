import {
  NumberValue,
  Expression,
  ListExpression,
  UnaryExpression,
  BinaryOp,
  BinaryExpression,
  FunctionCallExpression,
  StringValue,
  LambdaExpression,
  VariableExpression,
  Namespace,
  FloatValue,
  FuncRefValue,
  ListValue,
  DictionaryValue,
  Value,
  BlobValue,
  FuncrefCallExpression,
  NumberExpression,
  BlobExpression,
  DictionaryExpression,
  FloatExpression,
  FuncRefExpression,
  StringExpression,
} from './types';

export function int(value: number): NumberValue {
  return {
    type: 'number',
    value: Math.trunc(value),
  };
}

export function float(value: number): FloatValue {
  return {
    type: 'float',
    value,
  };
}

export function bool(value: boolean): NumberValue {
  return int(value ? 1 : 0);
}

export function str(value: string): StringValue {
  return {
    type: 'string',
    value,
  };
}

export function list(items: Value[]): ListValue {
  return {
    type: 'list',
    items,
  };
}

export function dictionary(items: Map<string, Value>): DictionaryValue {
  return {
    type: 'dictionary',
    items,
  };
}

export function funcref(args: {
  name: string;
  body?: (args: Value[]) => Value;
  arglist?: ListValue;
  dict?: DictionaryValue;
}): FuncRefValue {
  return {
    type: 'funcref',
    ...args,
  };
}

export function blob(data: Uint8Array<ArrayBuffer>): BlobValue {
  return {
    type: 'blob',
    data,
  };
}

export function toExpr(value: NumberValue): NumberExpression;
export function toExpr(value: FloatValue): FloatExpression;
export function toExpr(value: StringValue): StringExpression;
export function toExpr(value: ListValue): ListExpression;
export function toExpr(value: DictionaryValue): DictionaryExpression;
export function toExpr(value: FuncRefValue): FuncRefExpression;
export function toExpr(value: BlobValue): BlobExpression;
export function toExpr(value: Value): Expression;
export function toExpr(value: Value): Expression {
  if (value.type === 'number' || value.type === 'float' || value.type === 'string') {
    return value;
  } else if (value.type === 'list') {
    return listExpr(value.items.map(toExpr));
  } else if (value.type === 'dictionary') {
    return {
      type: 'dictionary',
      items: [...value.items.entries()].map(([key, val]) => [str(key), toExpr(val)]),
    };
  } else if (value.type === 'funcref') {
    return {
      type: 'funcref',
      name: value.name,
      body: value.body,
      arglist: value.arglist ? toExpr(value.arglist) : undefined,
      dict: value.dict ? toExpr(value.dict) : undefined,
    };
  } else if (value.type === 'blob') {
    return {
      type: 'blob',
      data: value.data,
    };
  }
  const guard: never = value;
  throw new Error(`Unknown value type in toExpr()`);
}

export function listExpr(items: Expression[]): ListExpression {
  return {
    type: 'list',
    items,
  };
}

export function variable(name: string, namespace?: Namespace): VariableExpression {
  return {
    type: 'variable',
    name,
    namespace,
  };
}

export function lambda(args: string[], body: Expression): LambdaExpression {
  return {
    type: 'lambda',
    args,
    body,
  };
}

export function negative(operand: Expression): UnaryExpression {
  return {
    type: 'unary',
    operator: '-',
    operand,
  };
}

export function positive(operand: Expression): UnaryExpression {
  return {
    type: 'unary',
    operator: '+',
    operand,
  };
}

export function binary(lhs: Expression, operator: BinaryOp, rhs: Expression): BinaryExpression {
  return {
    type: 'binary',
    operator,
    lhs,
    rhs,
  };
}

export function add(lhs: Expression, rhs: Expression): BinaryExpression {
  return binary(lhs, '+', rhs);
}

export function subtract(lhs: Expression, rhs: Expression): BinaryExpression {
  return binary(lhs, '-', rhs);
}

export function multiply(lhs: Expression, rhs: Expression): BinaryExpression {
  return binary(lhs, '*', rhs);
}

export function divide(lhs: Expression, rhs: Expression): BinaryExpression {
  return binary(lhs, '/', rhs);
}

export function modulo(lhs: Expression, rhs: Expression): BinaryExpression {
  return binary(lhs, '%', rhs);
}

export function concat(lhs: Expression, rhs: Expression): BinaryExpression {
  return binary(lhs, '..', rhs);
}

export function funcCall(func: string, args: Expression[]): FunctionCallExpression {
  return {
    type: 'function_call',
    func,
    args,
  };
}

export function funcrefCall(expression: Expression, args: Expression[]): FuncrefCallExpression {
  return {
    type: 'funcrefCall',
    expression,
    args,
  };
}
