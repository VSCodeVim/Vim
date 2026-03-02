// eslint-disable-next-line id-denylist
import { all, alt, optWhitespace, Parser, regexp, seq, string } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { Address, LineRange } from '../../vimscript/lineRange';
import { Pattern, SearchDirection } from '../../vimscript/pattern';

export class GlobalCommand extends ExCommand {
  public static argParser(invert: boolean): Parser<GlobalCommand> {
    const patternAndCmd = regexp(/[^\w\s\\|"]{1}/).chain((delimiter) =>
      seq(Pattern.parser({ direction: SearchDirection.Forward, delimiter }), all),
    );

    if (invert) {
      // :v — always inverted, no ! prefix
      return optWhitespace.then(
        patternAndCmd.map(
          ([pattern, commandText]) => new GlobalCommand(pattern, true, commandText),
        ),
      );
    } else {
      // :g — optionally accept ! prefix for inverted matching
      return optWhitespace.then(
        alt(
          string('!').then(
            patternAndCmd.map(
              ([pattern, commandText]) => new GlobalCommand(pattern, true, commandText),
            ),
          ),
          patternAndCmd.map(
            ([pattern, commandText]) => new GlobalCommand(pattern, false, commandText),
          ),
        ),
      );
    }
  }

  public readonly pattern: Pattern;
  public readonly invert: boolean;
  public readonly commandText: string;

  constructor(pattern: Pattern, invert: boolean, commandText: string) {
    super();
    this.pattern = pattern;
    this.invert = invert;
    this.commandText = commandText;
  }

  async execute(vimState: VimState): Promise<void> {
    // Default range for :g is % (entire file), unlike most Ex commands
    await this.executeWithRange(vimState, new LineRange(new Address({ type: 'entire_file' })));
  }

  override async executeWithRange(vimState: VimState, lineRange: LineRange): Promise<void> {
    vimState.recordedState.transformer.addTransformation({
      type: 'executeGlobal',
      pattern: this.pattern,
      invert: this.invert,
      commandText: this.commandText,
      range: lineRange,
    });
  }
}
