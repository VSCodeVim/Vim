import * as vscode from 'vscode';

import { VimState } from '../../state/vimState';
import { AllDigraphs } from '../../actions/commands/digraphs';
import * as node from '../node';

export interface IDigraphsCommandArguments extends node.ICommandArgs {
  arg?: string;
}

export class DigraphsCommand extends node.CommandBase {
  protected _arguments: IDigraphsCommandArguments;

  constructor(args: IDigraphsCommandArguments) {
    super();
    this._name = 'digraphs';
    this._arguments = args;
  }

  get arguments(): IDigraphsCommandArguments {
    return this._arguments;
  }

  async execute(vimState: VimState): Promise<void> {
    if (this.arguments.arg !== undefined && this.arguments.arg.length > 2) {
      // TODO: Register digraphs in args in state
    }
    const digraphKeyAndContent = new Array<any>();

    for (let digraphKey of Object.keys(AllDigraphs)) {
      let [char, charCode] = AllDigraphs[digraphKey];
      digraphKeyAndContent.push({
        label: digraphKey,
        description: `${char} [${charCode}]`,
      });
    }

    vscode.window.showQuickPick(digraphKeyAndContent).then(async val => {
      if (val) {
        // TODO: Can we insert the selected digraph at cursor position?
        vscode.window.showInformationMessage(`${val.label} ${val.description}`);
      }
    });
  }
}