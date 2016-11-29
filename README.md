# Vim [![Version](http://vsmarketplacebadge.apphb.com/version/vscodevim.vim.svg)](http://aka.ms/vscodevim) [![Build Status](https://travis-ci.org/VSCodeVim/Vim.svg?branch=master)](https://travis-ci.org/VSCodeVim/Vim) [![Slack Status](https://vscodevim-slackin.azurewebsites.net/badge.svg)](https://vscodevim-slackin.azurewebsites.net)

A [Visual Studio Code](https://code.visualstudio.com/) extension that enables Vim keybindings including:

* Modes (normal, insert, command, visual block)
* Command combinations (`c3w`, `daw`, `2dd`, etc) and remapping (jj to esc)
* Incremental search with `/` and `?`
* Marks
* Vim settings (like .vimrc)
* Multi-cursor support. Allows multiple simultaneous cursors to receive Vim commands (e.g. allows `/` search, each cursor has independent clipboards, etc.).
* And much more! Refer to the [roadmap](ROADMAP.md) or everything we support.

Please [report missing features/bugs on GitHub](https://github.com/VSCodeVim/Vim/issues). Everyone uses Vim in their own special way, so let us know if we're missing your favourite command. Drop by and say hi on [Slack](https://vscodevim-slackin.azurewebsites.net).

## Configure

Vim options are loaded in the following sequence:

1. `:set {option}`
2. `vim.{option}` from user/workspace settings.
3. VSCode configuration
4. VSCodeVim default values

**Note:** changes to the user/workspace settings require a restart of VS Code to take effect.

### Supported Options

The following is a subset of the supported configurations; the full list is described in [package.json](https://github.com/VSCodeVim/Vim/blob/master/package.json#L175):

#### insertModeKeyBindings/otherModesKeyBindings
  * Keybinding overrides to use for insert and other (non-insert) modes
  * *Example:* Bind `jj` to `<Esc>` while in insert mode

    ```
      "vim.insertModeKeyBindings": [
           {
               "before": ["j", "j"],
               "after": ["<Esc>"]
           }
      ]
    ```

    Similarly for `otherModesKeyBindings`, bind `jj` to `<Esc>` for modes which are not insert mode

    ```
      "vim.otherModesKeyBindings": [
           {
               "before": ["j", "j"],
               "after": ["<Esc>"]
           }
      ]
    ```

#### insertModeKeyBindingsNonRecursive/otherModesKeyBindingsNonRecursive
  * Non-recursive keybinding overrides to use for insert and other (non-insert) modes (similar to `:noremap`)
  * *Example:* Bind `j` to `gj`. Notice that if you attempted this binding normally, the j in gj would be expanded into gj, on and on forever. Stop this recursive expansion using insertModeKeyBindingsNonRecursive and/or otherModesKeyBindingNonRecursive.

    ```
    "vim.otherModesKeyBindingsNonRecursive": [
    {
        "before": ["j"],
        "after": ["g", "j"]
    }]
    ```

#### useCtrlKeys
  * Enable Vim ctrl keys overriding common VS Code operations (eg. copy, paste, find, etc). Setting this option to true will enable:
    * `ctrl+c`, `ctrl+[` => `<Esc>`
    * `ctrl+f` => Page Forward
    * `ctrl+v` => Visual Block Mode
    * etc.
  * Type: Boolean (Default: `false`)
  * *Example:*

    ```
    "vim.useCtrlKeys": true
    ```

#### useSystemClipboard
  * Enable yanking to the system clipboard by default
  * Type: Boolean (Default: `false`)
  * Note: Linux users must have xclip installed

#### useSolidBlockCursor
  * Use a non-blinking block cursor
  * Type: Boolean (Default: `false`)

#### ignorecase
  * Ignore case in search patterns
  * Type: Boolean (Default: `true`)

#### smartcase
  * Override the 'ignorecase' option if the search pattern contains upper case characters
  * Type: Boolean (Default: `true`)

#### hlsearch
  * When there is a previous search pattern, highlight all its matches
  * Type: Boolean (Default: `false`)

#### incsearch
  * Show the next search match while you're searching.
  * Type: Boolean (Default: `true`)

#### autoindent
  * Copy indent from current line when starting a new line
  * Type: Boolean (Default: `true`)

## Multi-Cursor Mode

Multi-Cursor mode is currently in beta. Please report things you expected to work but didn't [to our feedback thread.](https://github.com/VSCodeVim/Vim/issues/824)

#### Getting into multi-cursor mode

You can enter multi-cursor mode by:

* Pressing cmd-d on OSX.
* Runing "Add Cursor Above/Below" or the shortcut on any platform.
* Pressing `gc`, a new shortcut we added which is equivalent to cmd-d on OSX or ctrl-d on Windows. (It adds another cursor at the next word that matches the word the cursor is currently on.)

#### Doing stuff

Now that you have multiple cursors, you should be able to use Vim commands as you see fit. Most of them should work. There is a list of things I know of which don't [here](https://github.com/VSCodeVim/Vim/pull/587). If you find yourself wanting one of these, please [add it to our feedback thread.](https://github.com/VSCodeVim/Vim/issues/824)

Each cursor has its own clipboard.

Pressing Escape in Multi-Cursor Visual Mode will bring you to Multi-Cursor Normal mode. Pressing it again will return you to Normal mode.

## F.A.Q.

#### `j`, `k` and others don't repeat when I hold them down.

On OS X, open Terminal and run the following command:

```
defaults write com.microsoft.VSCode ApplePressAndHoldEnabled -bool false         // For VS Code
defaults write com.microsoft.VSCodeInsiders ApplePressAndHoldEnabled -bool false // For VS Code Insider
```

#### Halp! None of the vim `ctrl` (e.g. `ctrl+f`, `ctrl+v`) commands work

Configure the `useCtrlKeys` option (see [configurations#useCtrlKeys](#usectrlkeys)) to true.

## Contributing

This project is maintained by a group of awesome [people](https://github.com/VSCodeVim/Vim/graphs/contributors) and contributions are extremely welcome :heart:. For a quick tutorial on how you can help, see our [contributing guide](/.github/CONTRIBUTING.md).

Special props to [Kevin Coleman](http://kevincoleman.io), who created our awesome logo!

## Release Notes

Our recent releases and update notes are available [here](https://github.com/VSCodeVim/Vim/releases).
