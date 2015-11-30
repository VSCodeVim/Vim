[![Build Status](https://travis-ci.org/VSCodeVim/Vim.svg?branch=master)](https://travis-ci.org/VSCodeVim/Vim) [![Build status](https://ci.appveyor.com/api/projects/status/0t6ljij7g5h0ddx8?svg=true)](https://ci.appveyor.com/project/guillermooo/vim) [![Slack Status](http://slackin.westus.cloudapp.azure.com/badge.svg)](http://slackin.westus.cloudapp.azure.com)

# Vim

Vim emulation for Visual Studio Code. 

![Screenshot](images/screen.png)

## Installation and Usage

1. Install [Visual Studio Code](https://code.visualstudio.com/)
2. In the command palette (`Ctrl-Shift-P` or `Cmd-Shift-P`) select `Install Extension` and search for **vim**. Alternatively, run `ext install vim`

## Project Status

### Completed

* Modes:
    * Visual: `v`, `V`
    * Command: `Esc`, `Ctrl+[`
	* Insert: `i`, `I`, `a`, `A`, `o`, `O`
	* Current Mode displayed in the status bar in the bottom left

* Commands:
	* Command Palette: `:`
	* Navigation: `h`, `j`, `k`, `l`
	* Indentation: `>>`, `<<`
	* Deletion: `dd`, `dw`, `db`
	* Editing: `u`, `ctrl+r`
	* File Operations: `:q`, `:w`

### Planned

In no particular order:

* Search: `/`	
* Support Macros
* Buffers
* Neovim Integration

## Contributions

Contributions are extremely welcomed! 
Take a look at [Extension API](https://code.visualstudio.com/docs/extensionAPI/overview) on how to get started and our current [issues](https://github.com/VSCodeVim/Vim/issues) to see what we are working on next.

### Getting started

1. Install [Visual Studio Code](https://code.visualstudio.com/).
2. Fork the repo.
3. Run `npm install` to install all the dependencies.
4. Create a topic branch.
5. Run tests: 
	* Ensure tslint passes by running: `gulp`
	* Ensure tests pass by running extension tests within Visual Studio Code
5. Squash your commits.
6. Submit your PR

## License

[MIT](LICENSE.txt)
