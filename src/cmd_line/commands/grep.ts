import * as vscode from 'vscode';

import * as error from '../../error';
import { VimState } from '../../state/vimState';
import { Pattern, SearchDirection } from '../../vimscript/pattern';
import { ExCommand } from '../../vimscript/exCommand';
import { Parser, seq, optWhitespace, whitespace } from 'parsimmon';
import { fileNameParser } from '../../vimscript/parserUtils';

// Still missing:
// When a number is put before the command this is used
// as the maximum number of matches to find.  Use
// ":1vimgrep pattern file" to find only the first.
// Useful if you only want to check if there is a match
// and quit quickly when it's found.

// Without the 'j' flag Vim jumps to the first match.
// With 'j' only the quickfix list is updated.
// With the [!] any changes in the current buffer are
// abandoned.
interface IGrepCommandArguments {
  pattern: Pattern;
  files: string[];
}

// Implements :grep
// https://vimdoc.sourceforge.net/htmldoc/quickfix.html#:vimgrep
export class GrepCommand extends ExCommand {
  // TODO: parse the pattern for flags to notify the user that they are not supported yet
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

  async execute(): Promise<void> {
    const { pattern, files } = this.arguments;
    if (files.length === 0) {
      throw error.VimError.fromCode(error.ErrorCode.NoFileName);
    }
    // There are other arguments that can be passed, but probably need to dig into the VSCode source code, since they are not listed in the API reference
    // https://code.visualstudio.com/api/references/commands
    // This link on the other hand has the commands and I used this as a reference
    // https://stackoverflow.com/questions/62251045/search-find-in-files-keybinding-can-take-arguments-workbench-view-search-can
    await vscode.commands.executeCommand('workbench.action.findInFiles', {
      query: pattern.patternString,
      filesToInclude: files.join(','),
      triggerSearch: true,
      isRegex: true,
    });
    await vscode.commands.executeCommand('search.action.focusSearchList');
    // TODO: Only if there's no [j] flag
    await vscode.commands.executeCommand('search.action.focusNextSearchResult');
  }
}
