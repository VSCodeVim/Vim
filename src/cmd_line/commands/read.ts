import { exec } from 'child_process';
import { readFileAsync } from '../../util/fs';

import { TextEditor } from '../../textEditor';
import * as node from '../node';

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

  async execute(): Promise<void> {
    const textToInsert = await this.getTextToInsert();
    if (textToInsert) {
      await TextEditor.insert(textToInsert);
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
    return new Promise<string>((resolve, reject) => {
      try {
        exec(this.arguments.cmd as string, (err, stdout, stderr) => {
          if (err) {
            reject(err);
          } else {
            resolve(stdout);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
