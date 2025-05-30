import { Uri } from 'vscode';
import { ElseCommand, ElseIfCommand, EndIfCommand, IfCommand } from '../cmd_line/commands/ifelse';
import {
  BreakCommand,
  ContinueCommand,
  EndForCommand,
  EndWhileCommand,
  ForCommand,
  WhileCommand,
} from '../cmd_line/commands/loop';
import { FinishCommand } from '../cmd_line/commands/source';
import { VimError } from '../error';
import { VimState } from '../state/vimState';
import { ExCommand } from './exCommand';
import { exCommandParser, NoOpCommand } from './exCommandParser';
import { bool, int, str } from './expression/build';
import { EvaluationContext, VariableStore } from './expression/evaluate';
import {
  BlobValue,
  Expression,
  ListValue,
  StringValue,
  Value,
  VariableExpression,
} from './expression/types';
import { LineRange } from './lineRange';
import { workspace } from 'vscode';
import { EndFunctionCommand, FunctionCommand } from '../cmd_line/commands/function';

type CommandResult = 'continue' | 'break' | 'finish' | undefined;

class Command {
  public command: ExCommand;
  public lineRange: LineRange | undefined;

  constructor(command: ExCommand, lineRange: LineRange | undefined) {
    this.command = command;
    this.lineRange = lineRange;
  }

  public async execute(vimState: VimState): Promise<CommandResult> {
    if (this.command instanceof BreakCommand) {
      return 'break';
    } else if (this.command instanceof ContinueCommand) {
      return 'continue';
    } else if (this.command instanceof FinishCommand) {
      return 'finish';
    }
    if (this.lineRange) {
      await this.command.executeWithRange(vimState, this.lineRange);
    } else {
      await this.command.execute(vimState);
    }
    return undefined;
  }
}

type Branch = {
  condition: Expression;
  commands: Array<Command | Block>;
};

class IfElseBlock {
  private script: Script;
  private branches: Branch[];

  constructor(script: Script, condition: Expression) {
    this.script = script;
    this.branches = [
      {
        condition,
        commands: [],
      },
    ];
  }

  public addBranch(condition: Expression) {
    this.branches.push({
      condition,
      commands: [],
    });
  }

  public addCommand(command: Command | Block) {
    this.branches.at(-1)!.commands.push(command);
  }

  public async execute(vimState: VimState): Promise<CommandResult> {
    const ctx = this.script.evalContext;
    for (const branch of this.branches) {
      if (ctx.evaluateComparison('==', true, ctx.evaluate(branch.condition), bool(true))) {
        for (const command of branch.commands) {
          const result = await command.execute(vimState);
          if (result) {
            return result;
          }
        }
        return undefined;
      }
    }
    return undefined;
  }
}

class WhileBlock {
  private script: Script;
  private branch: Branch;

  constructor(script: Script, condition: Expression) {
    this.script = script;
    this.branch = {
      condition,
      commands: [],
    };
  }

  public addCommand(command: Command | Block) {
    this.branch.commands.push(command);
  }

  public async execute(vimState: VimState): Promise<CommandResult> {
    const ctx = this.script.evalContext;
    while (ctx.evaluateComparison('==', true, ctx.evaluate(this.branch.condition), bool(true))) {
      for (const command of this.branch.commands) {
        const result = await command.execute(vimState);
        if (result === 'break') {
          return undefined;
        } else if (result === 'continue') {
          break;
        }
      }
    }
    return undefined;
  }
}

class ForBlock {
  private script: Script;
  private variable: VariableExpression;
  private collection: Expression;
  private commands: Array<Command | Block>;

  constructor(script: Script, variable: VariableExpression, collection: Expression) {
    this.script = script;
    this.variable = variable;
    this.collection = collection;
    this.commands = [];
  }

  public addCommand(command: Command | Block) {
    this.commands.push(command);
  }

  public async execute(vimState: VimState): Promise<CommandResult> {
    function* iter(val: ListValue | BlobValue | StringValue): Generator<Value> {
      if (val.type === 'list') {
        for (const item of val.items) {
          yield item;
        }
      } else if (val.type === 'blob') {
        const bytes = new Uint8Array(val.data);
        for (const byte of bytes) {
          yield int(byte);
        }
      } else if (val.type === 'string') {
        for (const char of val.value) {
          yield str(char);
        }
      } else {
        const guard: never = val;
      }
    }

    const ctx = this.script.evalContext;

    const collection = ctx.evaluate(this.collection);
    if (
      !(collection.type === 'list' || collection.type === 'blob' || collection.type === 'string')
    ) {
      throw VimError.StringListOrBlobRequired();
    }

    for (const item of iter(collection)) {
      ctx.setVariable(this.variable, item, false);
      for (const command of this.commands) {
        const result = await command.execute(vimState);
        if (result === 'break') {
          return undefined;
        } else if (result === 'continue') {
          break;
        }
      }
    }
    return undefined;
  }
}

class FunctionBlock {
  private script: Script;
  private commands: Array<Command | Block>;

  constructor(script: Script) {
    this.script = script;
    this.commands = [];
  }

  public addCommand(command: Command | Block) {
    this.commands.push(command);
  }

  public async execute(vimState: VimState): Promise<CommandResult> {
    // TODO
    return undefined;
  }
}

type Block = IfElseBlock | WhileBlock | ForBlock | FunctionBlock;

export class Script {
  constructor(lines: readonly string[]) {
    this.lines = lines;
  }

  private _evalContext = new EvaluationContext(undefined, this); // TODO: Take VimState?
  public get evalContext(): EvaluationContext {
    return this._evalContext;
  }

  public readonly lines: readonly string[];

  public variables: VariableStore = new Map();

  static async fromFile(uri: Uri) {
    const file = await workspace.openTextDocument(uri);
    const lines: string[] = [];
    for (let i = 0; i < file.lineCount; ++i) {
      lines.push(file.lineAt(i).text);
    }
    return new Script(lines);
  }

  private parse(): Array<Command | Block> {
    const parsed: Array<Command | Block> = [];
    const currentBlocks: Block[] = [];

    const finishBlock = () => {
      const block = currentBlocks.pop()!;
      const outerBlock = currentBlocks.at(-1);
      if (outerBlock !== undefined) {
        outerBlock.addCommand(block);
      } else {
        parsed.push(block);
      }
    };

    for (const line of this.lines) {
      if (line.trim().length === 0) {
        continue;
      }

      const { command, lineRange } = exCommandParser.tryParse(line);
      command.setScript(this);

      const block = currentBlocks.at(-1);

      if (command instanceof NoOpCommand) {
        continue;
      } else if (command instanceof IfCommand) {
        currentBlocks.push(new IfElseBlock(this, command.condition));
      } else if (command instanceof ElseIfCommand) {
        if (!(block instanceof IfElseBlock)) {
          throw VimError.ElseIfWithoutIf();
        }
        block.addBranch(command.condition);
      } else if (command instanceof ElseCommand) {
        if (!(block instanceof IfElseBlock)) {
          throw VimError.ElseWithoutIf();
        }
        block.addBranch(bool(true));
      } else if (command instanceof EndIfCommand) {
        if (!(block instanceof IfElseBlock)) {
          throw VimError.EndIfWithoutIf();
        }
        finishBlock();
      } else if (command instanceof WhileCommand) {
        currentBlocks.push(new WhileBlock(this, command.condition));
      } else if (command instanceof EndWhileCommand) {
        if (!(block instanceof WhileBlock)) {
          throw VimError.EndLoopWithoutLoop('while');
        }
        finishBlock();
      } else if (command instanceof ForCommand) {
        currentBlocks.push(new ForBlock(this, command.variable, command.collection));
      } else if (command instanceof EndForCommand) {
        if (!(block instanceof ForBlock)) {
          throw VimError.EndLoopWithoutLoop('for');
        }
        finishBlock();
      } else if (command instanceof FunctionCommand) {
        currentBlocks.push(new FunctionBlock(this));
      } else if (command instanceof EndFunctionCommand) {
        if (!(block instanceof FunctionBlock)) {
          throw VimError.EndFunctionNotInsideFunction();
        }
        finishBlock();
      } else {
        // Not a control flow or otherwise special command
        if (!block) {
          parsed.push(new Command(command, lineRange));
        } else {
          currentBlocks.at(-1)!.addCommand(new Command(command, lineRange));
        }
      }
    }

    const notClosed = currentBlocks.at(-1);
    if (notClosed instanceof IfElseBlock) {
      throw VimError.MissingEndIf();
    } else if (notClosed instanceof WhileBlock) {
      throw VimError.MissingEndLoop('while');
    } else if (notClosed instanceof ForBlock) {
      throw VimError.MissingEndLoop('for');
    } else if (notClosed instanceof FunctionBlock) {
      throw VimError.MissingEndFunction();
    }
    const guard: undefined = notClosed;

    return parsed;
  }

  async execute(vimState: VimState): Promise<void> {
    this._evalContext = new EvaluationContext(vimState, this);
    const parsed = this.parse();
    for (const command of parsed) {
      const result = await command.execute(vimState);
      if (result === `break`) {
        throw VimError.BreakWithoutWhileOrFor();
      } else if (result === 'continue') {
        throw VimError.ContinueWithoutWhileOrFor();
      } else if (result === 'finish') {
        break; // TODO: Respect `finally`
      }
    }
  }
}
