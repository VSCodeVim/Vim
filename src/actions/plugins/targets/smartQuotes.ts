import { RegisterAction } from '../../base';
import { Mode } from '../../../mode/mode';
import { MoveQuoteMatch } from '../../motion';

abstract class SmartQuotes extends MoveQuoteMatch {
  override modes = [Mode.Normal, Mode.Visual, Mode.VisualBlock];
}

@RegisterAction
export class MoveAroundNextSingleQuotes extends SmartQuotes {
  keys = ['a', 'n', "'"];
  readonly charToMatch = "'";
  override readonly which = 'next';
  override includeQuotes = true;
}

@RegisterAction
export class MoveInsideNextSingleQuotes extends SmartQuotes {
  keys = ['i', 'n', "'"];
  readonly charToMatch = "'";
  override readonly which = 'next';
  override includeQuotes = false;
}

@RegisterAction
export class MoveAroundLastSingleQuotes extends SmartQuotes {
  keys = ['a', 'l', "'"];
  readonly charToMatch = "'";
  override readonly which = 'last';
  override includeQuotes = true;
}

@RegisterAction
export class MoveInsideLastSingleQuotes extends SmartQuotes {
  keys = ['i', 'l', "'"];
  readonly charToMatch = "'";
  override readonly which = 'last';
  override includeQuotes = false;
}

@RegisterAction
export class MoveAroundNextDoubleQuotes extends SmartQuotes {
  keys = ['a', 'n', '"'];
  readonly charToMatch = '"';
  override readonly which = 'next';
  override includeQuotes = true;
}

@RegisterAction
export class MoveInsideNextDoubleQuotes extends SmartQuotes {
  keys = ['i', 'n', '"'];
  readonly charToMatch = '"';
  override readonly which = 'next';
  override includeQuotes = false;
}

@RegisterAction
export class MoveAroundLastDoubleQuotes extends SmartQuotes {
  keys = ['a', 'l', '"'];
  readonly charToMatch = '"';
  override readonly which = 'last';
  override includeQuotes = true;
}

@RegisterAction
export class MoveInsideLastDoubleQuotes extends SmartQuotes {
  keys = ['i', 'l', '"'];
  readonly charToMatch = '"';
  override readonly which = 'last';
  override includeQuotes = false;
}

@RegisterAction
export class MoveAroundNextBacktick extends SmartQuotes {
  keys = ['a', 'n', '`'];
  readonly charToMatch = '`';
  override readonly which = 'next';
  override includeQuotes = true;
}

@RegisterAction
export class MoveInsideNextBacktick extends SmartQuotes {
  keys = ['i', 'n', '`'];
  readonly charToMatch = '`';
  override readonly which = 'next';
  override includeQuotes = false;
}

@RegisterAction
export class MoveAroundLastBacktick extends SmartQuotes {
  keys = ['a', 'l', '`'];
  readonly charToMatch = '`';
  override readonly which = 'last';
  override includeQuotes = true;
}

@RegisterAction
export class MoveInsideLastBacktick extends SmartQuotes {
  keys = ['i', 'l', '`'];
  readonly charToMatch = '`';
  override readonly which = 'last';
  override includeQuotes = false;
}
