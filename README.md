# Vim

[![Build Status](https://travis-ci.org/VSCodeVim/Vim.svg?branch=master)](https://travis-ci.org/VSCodeVim/Vim) [![Build status](https://ci.appveyor.com/api/projects/status/0t6ljij7g5h0ddx8?svg=true)](https://ci.appveyor.com/project/guillermooo/vim) [![Slack Status](http://slackin.westus.cloudapp.azure.com/badge.svg)](http://slackin.westus.cloudapp.azure.com)

Vim (aka. VSCodeVim) is a [Visual Studio Code](https://code.visualstudio.com/) extension that enabling the use of the Vim keybinding experience within Visual Studio Code. 

![Screenshot](images/screen.png)

## Install

1. Within Visual Studio Code, open the command palette (`Ctrl-Shift-P` / `Cmd-Shift-P`)
2. Select `Install Extension` and search for 'vim' *or* run `ext install vim`

## Project Status

See our [release notes](https://github.com/VSCodeVim/Vim/releases) for full details.

### Completed

* Modes:
    * Visual: `v`, `V`
    * Command: `Esc`, `Ctrl+[`
	* Insert: `i`, `I`, `a`, `A`, `o`, `O`
	* Current Mode displayed in the status bar in the bottom left

* Commands:
	* Command Palette: `:`
	* Navigation: `h`, `j`, `k`, `l`, `w`, `b`, `gg`, `G`
	* Indentation: `>>`, `<<`
	* Deletion: `dd`, `dw`, `db`
	* Editing: `u`, `ctrl+r`
	* File Operations: `:q`, `:w`

## Contributing

Contributions are extremely welcomed! 
Take a look at [Extension API](https://code.visualstudio.com/docs/extensionAPI/overview) on how to get started and our current [issues](https://github.com/VSCodeVim/Vim/issues) to see what we are working on next.

### Developing

1. Install prerequisites:
   * latest [Visual Studio Code](https://code.visualstudio.com/)
   * [Node.js](https://nodejs.org/) v4.0.0 or higher
2. Fork and clone the repo, then

	```bash
	$ npm install
	$ npm install -g gulp
	$ gulp init
	```

3. Open the folder in VS Code

#### Submitting a PR

You've made some changes, and you are ready to submit a PR? Please make sure:

1. Tests pass:
	* `gulp`: run tslint and tests
	* [Launch tests within VS Code](https://code.visualstudio.com/docs/extensions/testing-extensions)
2. Commits are squashed

## License

[MIT](LICENSE.txt)
