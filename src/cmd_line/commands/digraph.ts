import * as vscode from 'vscode';

import { configuration } from './../../configuration/configuration';
import { VimState } from '../../state/vimState';
import { DefaultDigraphs } from '../../actions/commands/digraphs';
import * as node from '../node';
import { TextEditor } from '../../textEditor';

export interface IDigraphsCommandArguments extends node.ICommandArgs {
  arg?: string;
}

interface DigraphQuickPickItem extends vscode.QuickPickItem {
  charCodes: number[];
}

export class DigraphsCommand extends node.CommandBase {
  protected _arguments: IDigraphsCommandArguments;

  constructor(args: IDigraphsCommandArguments) {
    super();
    this._arguments = args;
  }

  get arguments(): IDigraphsCommandArguments {
    return this._arguments;
  }

  private makeQuickPicks(digraphs): Array<DigraphQuickPickItem> {
    const quickPicks = new Array<DigraphQuickPickItem>();
    for (let digraphKey of Object.keys(digraphs)) {
      let [charDesc, charCodes] = digraphs[digraphKey];
      quickPicks.push({
        label: digraphKey,
        description: `${charDesc} (user)`,
        charCodes,
      });
    }
    return quickPicks;
  }

  async execute(vimState: VimState): Promise<void> {
    if (this.arguments.arg !== undefined && this.arguments.arg.length > 2) {
      // TODO: Register digraphs in args in state
    }
    const digraphKeyAndContent = this.makeQuickPicks(configuration.digraphs).concat(
      this.makeQuickPicks(DefaultDigraphs)
    );

    vscode.window.showQuickPick(digraphKeyAndContent).then(async (val) => {
      if (val) {
        const char = String.fromCharCode(...val.charCodes);
        await TextEditor.insert(vimState.editor, char);
      }
    });
  }
}
