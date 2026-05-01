import { Parser, succeed } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { ExCommand } from '../../vimscript/exCommand';
import { Address, LineRange } from '../../vimscript/lineRange';

type PrintArgs = {
  printNumbers: boolean;
  printText: boolean;
};

// TODO: `:l[ist]` is more than an alias
// TODO: `:z`
export class PrintCommand extends ExCommand {
  // TODO: Print {count} and [flags]
  public static readonly argParser = (args: {
    printNumbers: boolean;
    printText: boolean;
  }): Parser<PrintCommand> => succeed(new PrintCommand(args));

  private args: PrintArgs;
  constructor(args: PrintArgs) {
    super();
    this.args = args;
  }

  async execute(vimState: VimState): Promise<void> {
    // TODO: Wrong default for `:=`
    void this.executeWithRange(vimState, new LineRange(new Address({ type: 'current_line' })));
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    const { end } = range.resolve(vimState);

    // For now, we just print the last line.
    // TODO: Create a dynamic document if there's more than one line?
    const line = vimState.document.lineAt(end);
    let output: string;
    if (this.args.printNumbers) {
      if (this.args.printText) {
        output = `${line.lineNumber + 1} ${line.text}`;
      } else {
        output = `${line.lineNumber + 1}`;
      }
    } else {
      if (this.args.printText) {
        output = `${line.text}`;
      } else {
        output = '';
      }
    }
    StatusBar.setText(vimState, output);
  }
}
