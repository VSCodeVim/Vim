import { Parser } from 'parsimmon';
import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { bangParser } from '../../vimscript/parserUtils';

//
//  Implements :wall (write all)
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:wall
//
export class WallCommand extends ExCommand {
  public static readonly argParser: Parser<WallCommand> = bangParser.map(
    (bang) => new WallCommand(bang),
  );

  private readonly bang: boolean;
  constructor(bang?: boolean) {
    super();
    this.bang = bang ?? false;
  }

  async execute(vimState: VimState): Promise<void> {
    // TODO : overwrite readonly files when bang? == true
    await vscode.workspace.saveAll(false);
  }
}
