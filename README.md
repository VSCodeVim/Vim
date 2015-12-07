# Vim

[![Build Status](https://travis-ci.org/VSCodeVim/Vim.svg?branch=master)](https://travis-ci.org/VSCodeVim/Vim) [![Build status](https://ci.appveyor.com/api/projects/status/github/vscodevim/vim?branch=master&svg=true&retina=true)](https://ci.appveyor.com/project/guillermooo/vim/branch/master) [![Slack Status](http://slackin.westus.cloudapp.azure.com/badge.svg)](http://slackin.westus.cloudapp.azure.com)

Vim (aka. VSCodeVim) is a [Visual Studio Code](https://code.visualstudio.com/) extension that enables the power of the Vim keybinding experience within Visual Studio Code. 

![Screenshot](images/screen.png)

## Install

1. Within Visual Studio Code, open the command palette (`Ctrl-Shift-P` / `Cmd-Shift-P`)
2. Select `Install Extension` and search for 'vim' *or* run `ext install vim`

## Project Status

See our [release notes](https://github.com/VSCodeVim/Vim/releases) for full details.

### Completed

* Switching Modes:
    * Visual: `v`, `V`
    * Command: `Esc`, `Ctrl+[`
	* Insert: `i`, `I`, `a`, `A`, `o`, `O`
	* Current Mode displayed in the status bar in the bottom left

* Commands:
	* Command Palette: `:`
	* Navigation: `h`, `j`, `k`, `l`, `w`, `b`, `gg`, `G`, `$`, `^`, `w`, `b`
	* Indentation: `>>`, `<<`
	* Deletion: `dd`, `dw`, `db`
	* Editing: `u`, `ctrl+r`
	* File Operations: `:q`, `:w`

## Developing and Debugging

To get started developing, you will need node installed and on your `$PATH`.  Run `npm install` at the repository root.  With the project open in VSCode, pressing F5 will launch the extension host.

You can find more detailed instructions [here](https://code.visualstudio.com/docs/extensions/debugging-extensions).

## License

[MIT](LICENSE.txt)
