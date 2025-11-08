import * as vscode from 'vscode';

// eslint-disable-next-line id-denylist
import { any, Parser, seq, whitespace } from 'parsimmon';
import { DefaultDigraphs } from '../../actions/commands/digraphs';
import { Digraph } from '../../configuration/iconfiguration';
import { VimState } from '../../state/vimState';
import { TextEditor } from '../../textEditor';
import { ExCommand } from '../../vimscript/exCommand';
import { bangParser, numberParser } from '../../vimscript/parserUtils';
import { configuration } from './../../configuration/configuration';

export interface IDigraphsCommandArguments {
  bang: boolean;
  newDigraph: [string, string, number[]] | undefined;
}

interface DigraphQuickPickItem extends vscode.QuickPickItem {
  charCodes: number[];
}

export class DigraphsCommand extends ExCommand {
  public static readonly argParser: Parser<DigraphsCommand> = seq(
    bangParser,
    whitespace.then(seq(any, any, whitespace.then(numberParser).atLeast(1))).fallback(undefined),
  ).map(([bang, newDigraph]) => new DigraphsCommand({ bang, newDigraph }));

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
    if (this.arguments.newDigraph) {
      const digraph = this.arguments.newDigraph[0] + this.arguments.newDigraph[1];
      const charCodes = this.arguments.newDigraph[2];
      DefaultDigraphs.set(digraph, [String.fromCharCode(...charCodes), charCodes]);
    } else {
      const digraphKeyAndContent = this.makeQuickPicks(
        Object.entries(configuration.digraphs),
      ).concat(this.makeQuickPicks([...DefaultDigraphs.entries()]));

      void vscode.window.showQuickPick(digraphKeyAndContent).then(async (val) => {
        if (val) {
          const char = String.fromCharCode(...val.charCodes);
          await TextEditor.insert(vimState.editor, char);
        }
      });
    }
  }
}
