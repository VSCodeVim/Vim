// eslint-disable-next-line id-denylist
import { alt, optWhitespace, Parser, seqMap, string, whitespace } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { varNameParser } from '../../vimscript/expression/parser';
import { VimError } from '../../error';

// TODO: Other variants
type FunctionCommandArgs = {
  bang: boolean;
  name: string;
  args: string[];
  range?: true;
  abort?: true;
  dict?: true;
  closure?: true;
};

export class FunctionCommand extends ExCommand {
  public static readonly argParser: Parser<FunctionCommand> = seqMap(
    string('!').result(true).fallback(false),
    whitespace.then(varNameParser),
    varNameParser // TODO: Handle default argument values
      .sepBy(string(',').then(optWhitespace))
      .wrap(string('(').then(optWhitespace), optWhitespace.then(string(')'))),
    whitespace
      .then(
        alt(string('range'), string('abort'), string('dict'), string('closure')).sepBy(whitespace),
      )
      .fallback([]),
    (bang, name, args, modifiers) => new FunctionCommand({ bang, name, args }), // TODO: Handle modifiers
  );

  public readonly args: FunctionCommandArgs;
  constructor(args: FunctionCommandArgs) {
    super();
    this.args = args;
  }

  public override async execute(vimState: VimState): Promise<void> {
    // TODO
    throw new Error(':fu[nction] is not yet implemented');
  }
}

export class EndFunctionCommand extends ExCommand {
  public override async execute(vimState: VimState): Promise<void> {
    throw VimError.EndFunctionNotInsideFunction();
  }
}
