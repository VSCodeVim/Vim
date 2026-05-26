import { Parser } from 'parsimmon';
import { configuration, optionAliases } from '../../configuration/configuration';
import { VimError } from '../../error';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { ExCommand } from '../../vimscript/exCommand';
import {
  applyOperationToConfig,
  setCommandListeners,
  SetOperation,
  setOperationParser,
} from './setOperation';

export { SetOperation } from './setOperation';

export class SetCommand extends ExCommand {
  public static readonly argParser: Parser<SetCommand> = setOperationParser.map(
    (operation) => new SetCommand(operation),
  );

  private readonly operation: SetOperation;
  constructor(operation: SetOperation) {
    super();
    this.operation = operation;
  }

  // Listeners for options that need to be updated when they change
  static addListener(option: string, listener: () => void) {
    if (!(option in setCommandListeners)) {
      setCommandListeners[option] = [];
    }
    setCommandListeners[option].push(listener);
  }

  async execute(vimState: VimState): Promise<void> {
    if (this.operation.option === undefined) {
      // TODO: Show all options that differ from their default value
      return;
    }

    const option = optionAliases.get(this.operation.option) ?? this.operation.option;
    const currentValue = configuration[option] as string | number | boolean | undefined;
    if (currentValue === undefined) {
      throw VimError.UnknownOption(option);
    }

    // `show` and `show_or_set` on a non-boolean option need a VimState to
    // write to the status bar, so handle those here before delegating the
    // mutation to `applyOperationToConfig`.
    if (this.operation.type === 'show') {
      this.showOption(vimState, option, currentValue);
      return;
    }
    if (
      this.operation.type === 'show_or_set' &&
      typeof currentValue !== 'boolean' &&
      this.operation.option !== 'all'
    ) {
      this.showOption(vimState, option, currentValue);
      return;
    }

    applyOperationToConfig(configuration, this.operation);
  }

  private showOption(vimState: VimState, option: string, value: boolean | string | number) {
    if (typeof value === 'boolean') {
      StatusBar.setText(vimState, value ? option : `no${option}`);
    } else {
      StatusBar.setText(vimState, `${option}=${value}`);
    }
  }
}
