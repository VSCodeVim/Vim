import { TextEditor } from '../../textEditor';
import * as node from '../node';
import { readFileAsync } from 'platform/fs';
import { SUPPORT_READ_COMMAND } from 'platform/constants';
import { VimState } from '../../state/vimState';

export interface IReadCommandArguments extends node.ICommandArgs {
  file?: string;
  cmd?: string;
}

//
//  Implements :read and :read!
//  http://vimdoc.sourceforge.net/htmldoc/insert.html#:read
//  http://vimdoc.sourceforge.net/htmldoc/insert.html#:read!
//
export class ReadCommand extends node.CommandBase {
  protected _arguments: IReadCommandArguments;

  constructor(args: IReadCommandArguments) {
    super();
    this._arguments = args;
  }

  get arguments(): IReadCommandArguments {
    return this._arguments;
  }

  public neovimCapable(): boolean {
    return true;
  }

  async execute(vimState: VimState): Promise<void> {
    const textToInsert = await this.getTextToInsert();
    if (textToInsert) {
      await TextEditor.insert(vimState.editor, textToInsert);
    }
  }

  async getTextToInsert(): Promise<string> {
    if (this.arguments.file && this.arguments.file.length > 0) {
      return this.getTextToInsertFromFile();
    } else if (this.arguments.cmd && this.arguments.cmd.length > 0) {
      return this.getTextToInsertFromCmd();
    } else {
      throw Error('Invalid arguments');
    }
  }

  async getTextToInsertFromFile(): Promise<string> {
    // TODO: Read encoding from ++opt argument.
    try {
      const data = await readFileAsync(this.arguments.file as string, 'utf8');
      return data;
    } catch (e) {
      throw e;
    }
  }

  async getTextToInsertFromCmd(): Promise<string> {
    if (SUPPORT_READ_COMMAND) {
      return new Promise<string>((resolve, reject) => {
        try {
          import('child_process').then((cp) => {
            return cp.exec(this.arguments.cmd as string, (err, stdout, stderr) => {
              if (err) {
                reject(err);
              } else {
                resolve(stdout);
              }
            });
          });
        } catch (e) {
          reject(e);
        }
      });
    } else {
      return '';
    }
  }
}
