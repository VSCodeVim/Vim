import { readFileAsync } from 'platform/fs';
import { SUPPORT_READ_COMMAND } from 'platform/constants';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { fileNameParser, FileOpt, fileOptParser } from '../../vimscript/parserUtils';
import { all, alt, optWhitespace, Parser, seq, string, whitespace } from 'parsimmon';

export type IReadCommandArguments = {
  opt: FileOpt;
} & ({ cmd: string } | { file: string } | {});

//
//  Implements :read and :read!
//  http://vimdoc.sourceforge.net/htmldoc/insert.html#:read
//  http://vimdoc.sourceforge.net/htmldoc/insert.html#:read!
//
export class ReadCommand extends ExCommand {
  public static readonly argParser: Parser<ReadCommand> = seq(
    whitespace.then(fileOptParser).fallback([]),
    optWhitespace
      .then(
        alt<{ cmd: string } | { file: string }>(
          string('!')
            .then(all)
            .map((cmd) => {
              return { cmd };
            }),
          fileNameParser.map((file) => {
            return { file };
          }),
        ),
      )
      .fallback(undefined),
  ).map(([opt, other]) => new ReadCommand({ opt, ...other }));

  private readonly arguments: IReadCommandArguments;
  constructor(args: IReadCommandArguments) {
    super();
    this.arguments = args;
  }

  public override neovimCapable(): boolean {
    return true;
  }

  async execute(vimState: VimState): Promise<void> {
    const textToInsert = await this.getTextToInsert(vimState);
    if (textToInsert) {
      vimState.recordedState.transformer.insert(
        vimState.cursorStopPosition.getLineEnd(),
        '\n' + textToInsert,
      );
    }
  }

  // TODO: executeWithRange()

  async getTextToInsert(vimState: VimState): Promise<string> {
    if ('file' in this.arguments) {
      return readFileAsync(this.arguments.file, 'utf8');
    } else if ('cmd' in this.arguments) {
      if (this.arguments.cmd.length > 0) {
        if (SUPPORT_READ_COMMAND) {
          const cmd = this.arguments.cmd;
          return new Promise<string>(async (resolve, reject) => {
            const { exec } = await import('child_process');
            exec(cmd, (err, stdout, stderr) => {
              if (err) {
                reject(err);
              } else {
                resolve(stdout);
              }
            });
          });
        } else {
          return '';
        }
      } else {
        // TODO: error message?
        return '';
      }
    } else {
      return vimState.document.getText();
    }
  }
}
