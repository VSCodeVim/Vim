/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as vscode from 'vscode';

import * as error from '../../error';
import { VimState } from '../../state/vimState';
import { Pattern, SearchDirection } from '../../vimscript/pattern';
import { StatusBar } from '../../statusBar';
import { ExCommand } from '../../vimscript/exCommand';
import { Parser, seq, regexp, optWhitespace, whitespace } from 'parsimmon';
import { fileNameParser } from '../../vimscript/parserUtils';

interface IGrepCommandArguments {
  pattern: Pattern;
  files: string[];
}

// Implements :grep
// http://vimdoc.sourceforge.net/htmldoc/quickref.html#:grep
export class GrepCommand extends ExCommand {
  public static readonly argParser: Parser<GrepCommand> = optWhitespace.then(
    seq(
      Pattern.parser({ direction: SearchDirection.Backward, delimiter: ' ' }),
      fileNameParser.sepBy(whitespace),
    ).map(([pattern, files]) => new GrepCommand({ pattern, files })),
  );

  public readonly arguments: IGrepCommandArguments;
  constructor(args: IGrepCommandArguments) {
    super();
    this.arguments = args;
  }

  async execute(vimState: VimState): Promise<void> {
    const { pattern, files } = this.arguments;
    console.log('GrepCommand', pattern.patternString, files);
    if (files.length === 0) {
      throw error.VimError.fromCode(error.ErrorCode.NoFileName);
    }
    const listOfCommands = await vscode.commands.getCommands();
    const filteredCommands = listOfCommands.filter(
      (cmd) => cmd.toLowerCase().includes('search') || cmd.toLowerCase().includes('find'),
    );
    console.log('Filtered commands:', filteredCommands);
    // workbench.view.search is one of the commands that can be used to search
    const grepResults = await vscode.commands.executeCommand(
      'search.action.getSearchResults',
      pattern.patternString,
      files,
    );

    if (!grepResults) {
      throw error.VimError.fromCode(error.ErrorCode.PatternNotFound);
    }
  }
}
