import { all, Parser, seqMap, whitespace } from 'parsimmon';

import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { bangParser } from '../../vimscript/parserUtils';
import { varNameParser } from '../../vimscript/expression/parser';
import { ErrorCode, VimError } from '../../error';
import { globalState } from '../../state/globalState';

type CommandAttribute =
  | {
      type: 'nargs';
      value: '0' | '1' | '*' | '?' | '+';
    }
  | {
      type: 'complete';
      value: string;
    }
  | {
      type: 'range';
      value: '%' | number | undefined;
    }
  | {
      type: 'count';
      value: number | undefined;
    }
  | {
      type: 'addr';
      value: string;
    }
  | {
      type: 'bang';
    }
  | {
      type: 'bar';
    }
  | {
      type: 'register';
    }
  | {
      type: 'buffer';
    }
  | {
      type: 'keepscript';
    };

type CommandArgs = {
  attributes: CommandAttribute[];
  bang: boolean;
  name: string;
  replacement: string;
};

export class CommandCommand extends ExCommand {
  public static readonly argParser: Parser<CommandCommand> = seqMap(
    bangParser.skip(whitespace),
    varNameParser.skip(whitespace),
    all,
    (bang, name, replacement) =>
      new CommandCommand({
        attributes: [], // TODO: Parse attributes
        bang,
        name,
        replacement,
      }),
  );

  public readonly args: CommandArgs;
  constructor(args: CommandArgs) {
    super();
    this.args = args;
  }

  override async execute(vimState: VimState): Promise<void> {
    if (!/^[A-Z]/.test(this.args.name)) {
      throw VimError.fromCode(ErrorCode.UserDefinedCommandsMustStartWithAnUppercaseLetter);
    }
    if (globalState.userFunctions.get(this.args.name) !== undefined) {
      throw VimError.fromCode(ErrorCode.CommandAlreadyExists); // TODO: extraValue
    }
    globalState.userFunctions.set(this.args.name, {
      replacement: this.args.replacement,
    });
  }
}

export class UserCommand extends ExCommand {
  override async execute(vimState: VimState): Promise<void> {
    // TODO
  }
}
