import { Parser, whitespace } from 'parsimmon';
import { VimError } from '../../error';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { fileNameParser } from '../../vimscript/parserUtils';
import { Uri } from 'vscode';

export class SourceCommand extends ExCommand {
  public static readonly argParser: Parser<SourceCommand> = whitespace
    .then(fileNameParser)
    .map((file) => new SourceCommand(file));

  private readonly file: string;
  constructor(file: string) {
    super();
    this.file = file;
  }

  override async execute(vimState: VimState): Promise<void> {
    vimState.recordedState.transformer.vscodeCommand('vim.runVimscript', Uri.file(this.file));
  }

  // TODO: ExecuteWithRange?
}

export class FinishCommand extends ExCommand {
  public override async execute(vimState: VimState): Promise<void> {
    throw VimError.FinishUsedOutsideOfASourcedFile();
  }
}
