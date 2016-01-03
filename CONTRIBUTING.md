# Contribution Guide

The following is a set of guidelines for contributing to Vim for VSCode.
These are just guidelines, not rules, use your best judgment and feel free to propose changes to this document in a pull request.
If you need help with Vim for VSCode, come visit our [Slack](http://slackin.westus.cloudapp.azure.com/) community. 
Thanks for helping us make Vim for VSCode better!

## Submitting Issues

The [GitHub issue tracker](https://github.com/VSCodeVim/Vim/issues) is the preferred channel for tracking bugs and enhancement suggestions.
When creating a new bug report do:

* Search against existing issues to check if somebody else has already reported your problem or requested your idea
* Include as many details as possible. Include screenshots/gifs and repro steps where applicable.

## Submitting Pull Requests

Pull requests are *awesome*. 
If you're looking to raise a PR for something which doesn't have an open issue, consider creating an issue first. 
When submitting a PR, ensure:

1. Tests pass:
	* `gulp`: run tslint
	* [Launch tests within VS Code](https://code.visualstudio.com/docs/extensions/testing-extensions)
2. Commits are squashed

### Installation/Setup

1. Install prerequisites:
   * latest [Visual Studio Code](https://code.visualstudio.com/)
   * [Node.js](https://nodejs.org/) v4.0.0 or higher
2. Fork and clone the repo, then

	```bash
	$ npm install -g gulp
	$ npm install
	```

3. Open the folder in VS Code

### Developer Tips

1. Refer to Visual Studio Code [extension documentation](https://code.visualstudio.com/docs/extensions/overview)
2. Debug the extension in VS Code by adding breakpoints or `console.log("MY-MESSAGE");`.
3. If you find issues or missing functionality with the VSCode Extensions API, try reporting the issue at [VSCode Issues](https://github.com/microsoft/vscode/issues).

## Styleguides

We are adhering to VSCode's [coding guidelines](https://github.com/Microsoft/vscode/wiki/Coding-Guidelines).
