import * as vscode from 'vscode';

import { configuration } from './../../configuration/configuration';
import { VimState } from '../../state/vimState';
import { DefaultDigraphs } from '../../actions/commands/digraphs';
import { TextEditor } from '../../textEditor';
import { ExCommand } from '../../vimscript/exCommand';
import { any, Parser, seq, whitespace } from 'parsimmon';
import { bangParser, numberParser } from '../../vimscript/parserUtils';
import { Digraph } from '../../configuration/iconfiguration';

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

  private makeQuickPicks(digraphs: Array<[string, Digraph]>): DigraphQuickPickItem[] {
    return digraphs.map(([shortcut, [charDesc, charCodes]]) => {
      if (!Array.isArray(charCodes)) {
        charCodes = [charCodes];
      }
      return {
        label: shortcut,
        description: `${charDesc} (user)`,
        charCodes,
      };
    });
  }

  async execute(vimState: VimState): Promise<void> {
    // TODO: use arguments

    const digraphKeyAndContent = this.makeQuickPicks(Object.entries(configuration.digraphs)).concat(
      this.makeQuickPicks([...DefaultDigraphs.entries()])
    );

    vscode.window.showQuickPick(digraphKeyAndContent).then(async (val) => {
      if (val) {
        const char = String.fromCharCode(...val.charCodes);
        await TextEditor.insert(vimState.editor, char);
      }
    });
  }
}
