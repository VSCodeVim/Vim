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

@RegisterAction
export class MoveAroundQuote extends SmartQuotes {
  keys = ['a', 'q'];
  override readonly anyQuote = true;
  readonly charToMatch = '"'; // it is not in use, because anyQuote is true.
  override includeQuotes = true;
}

@RegisterAction
export class MoveInsideQuote extends SmartQuotes {
  keys = ['i', 'q'];
  override readonly anyQuote = true;
  readonly charToMatch = '"'; // it is not in use, because anyQuote is true.
  override includeQuotes = false;
}

@RegisterAction
export class MoveAroundNextQuote extends SmartQuotes {
  keys = ['a', 'n', 'q'];
  override readonly which = 'next';
  override readonly anyQuote = true;
  readonly charToMatch = '"'; // it is not in use, because anyQuote is true.
  override includeQuotes = true;
}

@RegisterAction
export class MoveInsideNextQuote extends SmartQuotes {
  keys = ['i', 'n', 'q'];
  override readonly which = 'next';
  override readonly anyQuote = true;
  readonly charToMatch = '"'; // it is not in use, because anyQuote is true.
  override includeQuotes = false;
}

@RegisterAction
export class MoveAroundLastQuote extends SmartQuotes {
  keys = ['a', 'l', 'q'];
  override readonly which = 'last';
  override readonly anyQuote = true;
  readonly charToMatch = '"'; // it is not in use, because anyQuote is true.
  override includeQuotes = true;
}

@RegisterAction
export class MoveInsideLastQuote extends SmartQuotes {
  keys = ['i', 'l', 'q'];
  override readonly which = 'last';
  override readonly anyQuote = true;
  readonly charToMatch = '"'; // it is not in use, because anyQuote is true.
  override includeQuotes = false;
}
