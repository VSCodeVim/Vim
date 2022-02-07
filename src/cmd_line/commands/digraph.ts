import * as vscode from 'vscode';

import { configuration } from './../../configuration/configuration';
import { VimState } from '../../state/vimState';
import { DefaultDigraphs } from '../../actions/commands/digraphs';
import { TextEditor } from '../../textEditor';
import { ExCommand } from '../../vimscript/exCommand';
import { any, Parser, seq, whitespace } from 'parsimmon';
import { bangParser, numberParser } from '../../vimscript/parserUtils';

export interface IDigraphsCommandArguments {
  bang: boolean;
  newDigraphs: Array<[string, string, number]>;
}

interface DigraphQuickPickItem extends vscode.QuickPickItem {
  charCodes: number[];
}

export class DigraphsCommand extends ExCommand {
  public static readonly argParser: Parser<DigraphsCommand> = seq(
    bangParser,
    whitespace.then(seq(any, any, whitespace.then(numberParser))).many()
  ).map(([bang, newDigraphs]) => new DigraphsCommand({ bang, newDigraphs }));

  private readonly arguments: IDigraphsCommandArguments;
  constructor(args: IDigraphsCommandArguments) {
    super();
    this.arguments = args;
  }

  // TODO: replace 'any' with sensible index signature
  private makeQuickPicks(digraphs: any): DigraphQuickPickItem[] {
    const quickPicks = new Array<DigraphQuickPickItem>();
    for (const digraphKey of Object.keys(digraphs)) {
      const [charDesc, charCodes] = digraphs[digraphKey];
      quickPicks.push({
        label: digraphKey,
        description: `${charDesc} (user)`,
        charCodes,
      });
    }
    return quickPicks;
  }

  async execute(vimState: VimState): Promise<void> {
    // TODO: use arguments

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
