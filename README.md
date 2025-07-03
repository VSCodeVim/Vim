<h2 align="center"><img src="https://raw.githubusercontent.com/VSCodeVim/Vim/master/images/icon.png" height="128"><br>VSCodeVim</h2>
<p align="center"><strong>Vim emulation for Visual Studio Code</strong></p>

<!-- TODO: use pgns or something; otherwise vsce won't package it
[![](https://vsmarketplacebadge.apphb.com/version/vscodevim.vim.svg)](http://aka.ms/vscodevim)
[![](https://vsmarketplacebadge.apphb.com/installs-short/vscodevim.vim.svg)](https://marketplace.visualstudio.com/items?itemName=vscodevim.vim)
[![](https://github.com/VSCodeVim/Vim/workflows/build/badge.svg?branch=master)](https://github.com/VSCodeVim/Vim/actions?query=workflow%3Abuild+branch%3Amaster)
-->

VSCodeVim is a Vim emulator for [Visual Studio Code](https://code.visualstudio.com/).

- ℹ️ For documentation, visit [the wiki](https://github.com/VSCodeVim/Vim/wiki)!
- 📃 Our [change log](CHANGELOG.md) outlines the breaking/major/minor updates between releases.
- 🐛 Report missing features/bugs on [GitHub](https://github.com/VSCodeVim/Vim/issues).

<details>
 <summary><strong>Table of Contents</strong> (click to expand)</summary>

- [💾 Installation](#-installation)
  - [Mac](#mac)
  - [Windows](#windows)
- [⚙️ Settings](#️-settings)
  - [Quick Example](#quick-example)
  - [VSCodeVim settings](#vscodevim-settings)
  - [Neovim Integration](#neovim-integration)
  - [Key Remapping](#key-remapping)
  - [Vim modes](#vim-modes)
  - [Vim settings](#vim-settings)
- [.vimrc support](#vimrc-support)
- [🖱️ Multi-Cursor Mode](#️-multi-cursor-mode)
- [🔌 Emulated Plugins](#-emulated-plugins)
- [🎩 VSCodeVim tricks!](#-vscodevim-tricks)
- [❤️ Contributing](#️-contributing)

</details>

## 💾 Installation

VSCodeVim can be installed via the VS Code [Marketplace](https://marketplace.visualstudio.com/items?itemName=vscodevim.vim).

### Mac

To enable key-repeating, execute the following in your Terminal, log out and back in, and then restart VS Code:

```sh
defaults write com.microsoft.VSCode ApplePressAndHoldEnabled -bool false              # For VS Code
defaults write com.microsoft.VSCodeInsiders ApplePressAndHoldEnabled -bool false      # For VS Code Insider
defaults write com.vscodium ApplePressAndHoldEnabled -bool false                      # For VS Codium
defaults write com.microsoft.VSCodeExploration ApplePressAndHoldEnabled -bool false   # For VS Codium Exploration users
defaults delete -g ApplePressAndHoldEnabled                                           # If necessary, reset global default
```

We also recommend increasing Key Repeat and Delay Until Repeat settings in _System Settings/Preferences -> Keyboard_.

### Windows

Like real vim, VSCodeVim will take over your control keys. This behavior can be adjusted with the [`useCtrlKeys`](#vscodevim-settings) and [`handleKeys`](#vscodevim-settings) settings.

## ⚙️ Settings

The settings documented here are a subset of the supported settings; the full list is described in the `FEATURES` -> `Settings` tab of VSCodeVim's [extension details page](https://code.visualstudio.com/docs/editor/extension-marketplace#_extension-details), which can be found in the [extensions view](https://code.visualstudio.com/docs/editor/extension-marketplace) of VS Code.

### Quick Example

Below is an example of a [settings.json](https://code.visualstudio.com/Docs/customization/userandworkspace) file with settings relevant to VSCodeVim:

```json
{
  "vim.easymotion": true,
  "vim.incsearch": true,
  "vim.useSystemClipboard": true,
  "vim.useCtrlKeys": true,
  "vim.hlsearch": true,
  "vim.insertModeKeyBindings": [
    {
      "before": ["j", "j"],
      "after": ["<Esc>"]
    }
  ],
  "vim.normalModeKeyBindingsNonRecursive": [
    {
      "before": ["<leader>", "d"],
      "after": ["d", "d"]
    },
    {
      "before": ["<C-n>"],
      "commands": [":nohl"]
    },
    {
      "before": ["K"],
      "commands": ["lineBreakInsert"],
      "silent": true
    }
  ],
  "vim.leader": "<space>",
  "vim.handleKeys": {
    "<C-a>": false,
    "<C-f>": false
  },
  // To improve performance
  "extensions.experimental.affinity": {
    "vscodevim.vim": 1
  }
}
```

### VSCodeVim settings

These settings are specific to VSCodeVim.

| Setting                          | Description                                                                                                                                                                                                                                                                                                                                                                                                                        | Type    | Default Value                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------- |
| vim.changeWordIncludesWhitespace | Include trailing whitespace when changing word. This configures the <kbd>cw</kbd> action to act consistently as its siblings (<kbd>yw</kbd> and <kbd>dw</kbd>) instead of acting as <kbd>ce</kbd>.                                                                                                                                                                                                                                 | Boolean | false                                                         |
| vim.cursorStylePerMode._{Mode}_  | Configure a specific cursor style for _{Mode}_. Omitted modes will use [default cursor type](https://github.com/VSCodeVim/Vim/blob/4a6fde6dbd4d1fac1f204c0dc27c32883651ef1a/src/mode/mode.ts#L34) Supported cursors: line, block, underline, line-thin, block-outline, and underline-thin.                                                                                                                                         | String  | None                                                          |
| vim.digraphs._{shorthand}_       | Set custom digraph shorthands that can override the default ones. Entries should map a two-character shorthand to a descriptive string and one or more UTF16 code points. Example: `"R!": ["🚀", [55357, 56960]]`                                                                                                                                                                                                                  | Object  | `{"R!": ["🚀", [0xD83D, 0xDE80]]`                             |
| vim.disableExtension             | Disable VSCodeVim extension. This setting can also be toggled using `toggleVim` command in the Command Palette                                                                                                                                                                                                                                                                                                                     | Boolean | false                                                         |
| vim.handleKeys                   | Delegate configured keys to be handled by VS Code instead of by the VSCodeVim extension. Any key in `keybindings` section of the [package.json](https://github.com/VSCodeVim/Vim/blob/master/package.json) that has a `vim.use<C-...>` in the `when` argument can be delegated back to VS Code by setting `"<C-...>": false`. Example: to use `ctrl+f` for find (native VS Code behavior): `"vim.handleKeys": { "<C-f>": false }`. | String  | `"<C-d>": true`<br /> `"<C-s>": false`<br /> `"<C-z>": false` |
| vim.overrideCopy                 | Override VS Code's copy command with our own, which works correctly with VSCodeVim. If cmd-c/ctrl-c is giving you issues, set this to false and complain [here](https://github.com/Microsoft/vscode/issues/217).                                                                                                                                                                                                                   | Boolean | false                                                         |
| vim.useSystemClipboard           | Use the system clipboard register (`*`) as the default register                                                                                                                                                                                                                                                                                                                                                                    | Boolean | false                                                         |
| vim.searchHighlightColor         | Background color of non-current search matches                                                                                                                                                                                                                                                                                                                                                                                     | String  | `findMatchHighlightBackground` ThemeColor                     |
| vim.searchHighlightTextColor     | Foreground color of non-current search matches                                                                                                                                                                                                                                                                                                                                                                                     | String  | None                                                          |
| vim.searchMatchColor             | Background color of current search match                                                                                                                                                                                                                                                                                                                                                                                           | String  | `findMatchBackground` ThemeColor                              |
| vim.searchMatchTextColor         | Foreground color of current search match                                                                                                                                                                                                                                                                                                                                                                                           | String  | None                                                          |
| vim.substitutionColor            | Background color of substitution text when `vim.inccommand` is enabled                                                                                                                                                                                                                                                                                                                                                             | String  | "#50f01080"                                                   |
| vim.substitutionTextColor        | Foreground color of substitution text when `vim.inccommand` is enabled                                                                                                                                                                                                                                                                                                                                                             | String  | None                                                          |
| vim.startInInsertMode            | Start in Insert mode instead of Normal Mode                                                                                                                                                                                                                                                                                                                                                                                        | Boolean | false                                                         |
| vim.useCtrlKeys                  | Enable Vim ctrl keys overriding common VS Code operations such as copy, paste, find, etc.                                                                                                                                                                                                                                                                                                                                          | Boolean | true                                                          |
| vim.visualstar                   | In visual mode, start a search with `*` or `#` using the current selection                                                                                                                                                                                                                                                                                                                                                         | Boolean | false                                                         |
| vim.highlightedyank.enable       | Enable highlighting when yanking                                                                                                                                                                                                                                                                                                                                                                                                   | Boolean | false                                                         |
| vim.highlightedyank.color        | Set the color of yank highlights                                                                                                                                                                                                                                                                                                                                                                                                   | String  | rgba(250, 240, 170, 0.5)                                      |
| vim.highlightedyank.duration     | Set the duration of yank highlights                                                                                                                                                                                                                                                                                                                                                                                                | Number  | 200                                                           |

### Neovim Integration

> :warning: Experimental feature likely to be removed at some point. Please leave feedback [here](https://github.com/VSCodeVim/Vim/issues/1735).

See [the wiki](https://github.com/VSCodeVim/Vim/wiki/Neovim-integration) for how to use Neovim integration.

### Key Remapping

See [the wiki](https://github.com/VSCodeVim/Vim/wiki/Remapping-keys) for instructions on how to remap keys.

### Vim modes

Here are all the modes used by VSCodeVim:

| Mode                  |
| --------------------- |
| Normal                |
| Insert                |
| Visual                |
| VisualBlock           |
| VisualLine            |
| SearchInProgressMode  |
| CommandlineInProgress |
| Replace               |
| EasyMotionMode        |
| EasyMotionInputMode   |
| SurroundInputMode     |
| OperatorPendingMode   |
| Disabled              |

When rebinding keys in [keybindings.json](https://code.visualstudio.com/docs/getstarted/keybindings) using ["when clause context"](https://code.visualstudio.com/api/references/when-clause-contexts), it can be useful to know in which mode vim currently is. For example to write a "when clause" that checks if vim is currently in normal mode or visual mode it is possible to write the following:

```json
"when": "vim.mode == 'Normal' || vim.mode == 'Visual'",
```

### Vim settings

Configuration settings that have been copied from vim. Vim settings are loaded in the following sequence:

1.  `:set {setting}`
2.  `vim.{setting}` from user/workspace settings.
3.  VS Code settings
4.  VSCodeVim default values

| Setting          | Description                                                                                                                                                                                                                                                   | Type    | Default Value                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------- |
| vim.autoindent   | Copy indent from current line when starting a new line                                                                                                                                                                                                        | Boolean | true                                                           |
| vim.gdefault     | When on, the `:substitute` flag `g` is default on. This means that all matches in a line are substituted instead of one. When a `g` flag is given to a `:substitute` command, this will toggle the substitution of all or one match.                          | Boolean | false                                                          |
| vim.hlsearch     | Highlights all text matching current search                                                                                                                                                                                                                   | Boolean | false                                                          |
| vim.ignorecase   | Ignore case in search patterns                                                                                                                                                                                                                                | Boolean | true                                                           |
| vim.incsearch    | Show the next match while entering a search                                                                                                                                                                                                                   | Boolean | true                                                           |
| vim.inccommand   | Show the effects of the `:substitute` command while typing                                                                                                                                                                                                    | String  | `replace`                                                      |
| vim.joinspaces   | Add two spaces after '.', '?', and '!' when joining or reformatting                                                                                                                                                                                           | Boolean | true                                                           |
| vim.leader       | Defines key for `<leader>` to be used in key remappings                                                                                                                                                                                                       | String  | `\`                                                            |
| vim.maxmapdepth  | Maximum number of times a mapping is done without resulting in a character to be used. This normally catches endless mappings, like ":map x y" with ":map y x". It still does not catch ":map g wg", because the 'w' is used before the next mapping is done. | Number  | 1000                                                           |
| vim.report       | Threshold for reporting number of lines changed.                                                                                                                                                                                                              | Number  | 2                                                              |
| vim.shell        | Path to the shell to use for `!` and `:!` commands.                                                                                                                                                                                                           | String  | `/bin/sh` on Unix, `%COMSPEC%` environment variable on Windows |
| vim.showcmd      | Show (partial) command in status bar                                                                                                                                                                                                                          | Boolean | true                                                           |
| vim.showmodename | Show name of current mode in status bar                                                                                                                                                                                                                       | Boolean | true                                                           |
| vim.smartcase    | Override the 'ignorecase' setting if search pattern contains uppercase characters                                                                                                                                                                             | Boolean | true                                                           |
| vim.textwidth    | Width to word-wrap when using `gq`                                                                                                                                                                                                                            | Number  | 80                                                             |
| vim.timeout      | Timeout in milliseconds for remapped commands                                                                                                                                                                                                                 | Number  | 1000                                                           |
| vim.whichwrap    | Allow specified keys that move the cursor left/right to move to the previous/next line when the cursor is on the first/last character in the line. See [:help whichwrap](https://vimhelp.org/options.txt.html#%27whichwrap%27).                               | String  | `b,s`                                                          |

## .vimrc support

> :warning: .vimrc support is currently experimental. Only remaps are supported, and you may experience bugs. Please [report them](https://github.com/VSCodeVim/Vim/issues/new?template=bug_report.md)!

Set `vim.vimrc.enable` to `true` and set `vim.vimrc.path` appropriately.

## 🔌 Emulated Plugins

Many popular Vim plugins are supported. See [the wiki](https://github.com/VSCodeVim/Vim/wiki/Plugins) for more information.

## 🎩 VSCodeVim tricks!

VS Code has a lot of nifty tricks and we try to preserve some of them:

- `gd` - jump to definition.
- `gq` - on a visual selection reflow and wordwrap blocks of text, preserving commenting style. Great for formatting documentation comments.
- `gb` - adds another cursor on the next word it finds which is the same as the word under the cursor.
- `af` - visual mode command which selects increasingly large blocks of text. For example, if you had "blah (foo [bar 'ba|z'])" then it would select 'baz' first. If you pressed `af` again, it'd then select [bar 'baz'], and if you did it a third time it would select "(foo [bar 'baz'])".
- `gh` - equivalent to hovering your mouse over wherever the cursor is. Handy for seeing types and error messages without reaching for the mouse!

## ❤️ Contributing

Contributions are extremely welcome! If you're interested, see our [contributing guide](/.github/CONTRIBUTING.md).
