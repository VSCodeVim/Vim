<h2 align="center"><img src="https://raw.githubusercontent.com/VSCodeVim/Vim/master/images/icon.png" height="128"><br>VSCodeVim</h2>
<p align="center"><strong>Vim emulation for Visual Studio Code</strong></p>

[![http://aka.ms/vscodevim](https://vsmarketplacebadge.apphb.com/version/vscodevim.vim.svg)](http://aka.ms/vscodevim)
[![https://travis-ci.org/VSCodeVim/Vim](https://travis-ci.org/VSCodeVim/Vim.svg?branch=master)](https://travis-ci.org/VSCodeVim/Vim)

VSCodeVim is a Vim emulator for [Visual Studio Code](https://code.visualstudio.com/).

* 🚚 For a full list of supported Vim features, please refer to our [roadmap](ROADMAP.md).
* 📃 Our [change log](CHANGELOG.md) outlines the breaking/major/minor updates between releases.
* ❓ If you need to ask any questions, join us on [Slack](https://vscodevim-slackin.azurewebsites.net)
* :octocat: Report missing features/bugs on [GitHub](https://github.com/VSCodeVim/Vim/issues).

<details>
 <summary><strong>Table of Contents</strong> (click to expand)</summary>

* [Installation](#-Installation)
    * [Vim Compatibility](#vim-compatibility)
    * [Mac setup](#mac-setup)
    * [Windows setup](#windows-setup)
    * [Linux setup](#linux-setup)
* [Settings](#-settings)
    * [VSCodeVim settings](#vscodevim-settings)
    * [Neovim Integration](#neovim-integration)
    * [Key remapping](#key-remapping)
    * [Vim settings](#vim-settings)
* [Multi-Cursor mode](#-multi-cursor-mode)
* [Emulated plugins](#emulated-plugins)
    * [vim-airline](#vim-airline)
    * [vim-easymotion](#vim-easymotion)
    * [vim-surround](#vim-surround)
    * [vim-commentary](#vim-commentary)
    * [vim-indent-object](#vim-indent-object)
    * [vim-sneak](#vim-sneak)
* [VSCodeVim tricks](#-vscodevim-tricks)
* [F.A.Q / Troubleshooting](#-faq)
* [Contributing](#️-contributing)

</details>

## 💾 Installation

VSCodeVim is automatically enabled following [installation](https://marketplace.visualstudio.com/items?itemName=vscodevim.vim) and the reloading of VSCode.

### Vim Compatibility

Vimscript is *not* supported, so we are *not* able to load your `.vimrc` or use `.vim` plugins. You have to replicate these using our [Settings](#settings) and [Emulated plugins](#emulated-plugins).

### Mac Setup

If key repeating isn't working for you, execute this in your Terminal, then restart VS Code.

```sh
defaults write com.microsoft.VSCode ApplePressAndHoldEnabled -bool false         # For VS Code
defaults write com.microsoft.VSCodeInsiders ApplePressAndHoldEnabled -bool false # For VS Code Insider
defaults delete -g ApplePressAndHoldEnabled                                      # If necessary, reset global default

```

We also recommend going into *System Preferences -> Keyboard* and increasing the Key Repeat and Delay Until Repeat settings to improve your speed.

### Windows Setup

VSCodeVim will take over your control keys, just like real vim, so you get the _full_ vim experience. This behaviour can be adjusted with the [`useCtrlKeys`](#vimusectrlkeys) and [`handleKeys`](#vimhandlekeys) settings.

### Linux Setup

If you have configured `vim.useSystemClipboard: "true"`, we rely on [clipboardy](https://github.com/sindresorhus/clipboardy) for cross-platform copy/paste operations. This library is dependent on `xsel`:

```sh
apt install xsel
```

## ⚙️ Settings

### Quick Example

Below is an example of a [settings.json](https://code.visualstudio.com/Docs/customization/userandworkspace) file for VSCode settings applicable to this extension:

```json
{
    "vim.easymotion": true,
    "vim.sneak": true,
    "vim.incsearch": true,
    "vim.useSystemClipboard": true,
    "vim.useCtrlKeys": true,
    "vim.hlsearch": true,
    "vim.insertModeKeyBindings": [
        {
            "before": ["j","j"],
            "after": ["<Esc>"]
        }
    ],
    "vim.normalModeKeyBindingsNonRecursive": [
        {
            "before": ["<leader>","d"],
            "after": ["d", "d"]
        },
        {
            "before":["<C-n>"],
            "commands": [
                ":nohl"
            ]
        }
    ],
    "vim.leader": "<space>",
    "vim.handleKeys":{
        "<C-a>": false,
        "<C-f>": false
    }
}
```

The following is a subset of the supported settings; the full list is described in the `Contributions` tab in the extensions menu of VSCode.

### VSCodeVim settings

These settings are specific to VSCodeVim.

#### `"vim.startInInsertMode"`

* Have VSCodeVim start in Insert Mode rather than Normal Mode.
* We would be remiss in our duties as Vim users not to say that you should really be staying in Normal mode as much as you can, but hey, who are we to stop you?

#### `"vim.overrideCopy"`

* Override VSCode's copy command with our own, which works correctly with VSCodeVim.
* If cmd-c or ctrl-c is giving you issues, set this to false and complain [here](https://github.com/Microsoft/vscode/issues/217).
* Type: Boolean (Default: `true`)

#### `"vim.useSystemClipboard"`

* Enable yanking to the system clipboard by default
* Type: Boolean (Default: `false`)

#### `"vim.searchHighlightColor"`

* Set the color of search highlights.
* Type: Color String (Default: `rgba(150, 150, 150, 0.3)`)

#### `"vim.substituteGlobalFlag"`

* Similar to Vim's `gdefault` setting.
* `/g` flag in a substitute command replaces all occurrences in the line.
  Without this argument, replacement occurs only for the first occurrence in each line.
* When `"vim.substituteGlobalFlag"` is `true`, the 'g' is default on.
  This means that all matches in a line are substituted instead of one.
  When a 'g' flag is given to a ":substitute" command, this will toggle the substitution
  of all or one match.

#### `"vim.useCtrlKeys"`

* Enable Vim ctrl keys thus overriding common VSCode operations such as copy, paste, find, etc. Enabling this setting will result in the following keybindings:
    * `ctrl+c`, `ctrl+[` => `<Esc>`
    * `ctrl+f` => Full Page Forward
    * `ctrl+d` => Half Page Back
    * `ctrl+b` => Half Page Forward
    * `ctrl+v` => Visual Block Mode
    * etc.
* Type: Boolean (Default: `true`)

#### `"vim.handleKeys"`

* Delegate certain keybindings to be handled natively by VSCode instead of by the VSCodeVim extension
* Complete list of key combinations supported by this setting can be found under the `keybindings` section of our [package.json](https://github.com/VSCodeVim/Vim/blob/master/package.json). Each key that has a `vim.use<C-...>` in the when argument can be delegated back to vscode by setting `"<C-...>": false`.
* Example: you want to use `ctrl+f` for find (native VSCode behaviour), but also wants to have [`useCtrlKeys`](#vimusectrlkeys) set to true so that other vim bindings work:

```json
    "vim.handleKeys": {
        "<C-f>": false
    }
```

#### `"vim.visualstar"`

* In visual mode, start a search with `*` or `#` using the current selection
* Type: Boolean (Default: `false`)

#### `"vim.cursorStylePerMode"`

* Configure a specific cursor style per mode; omitted modes will use default cursor type
* Supported modes: normal, insert, replace, visual, visualline, and visualblock
* Supported cursors: line, block, underline, line-thin, block-outline, and underline-thin

```json
    "vim.cursorStylePerMode" : {
        "normal": "underline",
        "insert": "line-thin",
        "replace": "block-outline"
    }
```

#### `"vim.disableExtension"`

* Disable VSCodeVim (Note: this is different from disabling extension through VSCode)
* This setting can be changed through the settings or via `toggleVim` command in the Command Palette
* Type: Boolean (Default: `false`)

#### `"vim.debug.loggingLevel"`

* Extension logging level. Maximum level of messages to log.
* Logs will be visible in the [developer tools](https://code.visualstudio.com/docs/extensions/developing-extensions#_profiling-your-extension).
* Type: String (Default: 'error'). Supported values: 'error', 'warn', 'info', 'verbose', 'debug'.

### Neovim Integration

> :warning: Experimental feature. Please leave feedback on neovim integration [here](https://github.com/VSCodeVim/Vim/issues/1735).

You can leverage neovim for Ex-commands. To enable:

1. Install [neovim](https://github.com/neovim/neovim/wiki/Installing-Neovim)
2. Add the following configurations:

```json
"vim.enableNeovim": true
"vim.neovimPath": <path to neovim>
```

Here's some ideas on what you can do with neovim integration:

* [The power of g](http://vim.wikia.com/wiki/Power_of_g)
* [The :normal command](https://vi.stackexchange.com/questions/4418/execute-normal-command-over-range)
* Faster search and replace!

### Key Remapping

Custom remappings are defined on a per-mode basis.

#### `"vim.insertModeKeyBindings"`/`"vim.normalModeKeyBindings"`/`"vim.visualModeKeyBindings"`

* Keybinding overrides to use for insert, normal, and visual modes.
* Bind `jj` to `<Esc>` in insert mode:

```json
    "vim.insertModeKeyBindings": [
        {
            "before": ["j", "j"],
            "after": ["<Esc>"]
        }
    ]
```

* Bind `:` to show the command palette:

```json
    "vim.normalModeKeyBindingsNonRecursive": [
        {
            "before": [":"],
            "commands": [
                "workbench.action.showCommands",
            ]
        }
    ]
```

* Bind `<leader>m` to add a bookmark and `<leader>b` to open the list of all bookmarks (using the [Bookmarks](https://github.com/alefragnani/vscode-bookmarks) extension):

```json
    "vim.normalModeKeyBindingsNonRecursive": [
        {
            "before": ["<leader>", "m"],
            "commands": [
                "bookmarks.toggle"
            ]
        },
        {
            "before": ["<leader>", "b"],
            "commands": [
                "bookmarks.list"
            ]
        }
    ]
```

* Bind `ZZ` to the vim command `:wq` (save and close the current file):

```json
    "vim.normalModeKeyBindingsNonRecursive": [
        {
            "before": ["Z", "Z"],
            "commands": [
                ":wq"
            ]
        }
    ]
```

* Bind `ctrl+n` to turn off search highlighting and `<leader>w` to save the current file:

```json
    "vim.normalModeKeyBindingsNonRecursive": [
        {
            "before":["<C-n>"],
            "commands": [
                ":nohl",
            ]
        },
        {
            "before": ["leader", "w"],
            "commands": [
                "workbench.action.files.save",
            ]
        }
    ]
```

* Bind `p` in visual mode to paste without overriding the current register

```json
    "vim.visualModeKeyBindingsNonRecursive": [
        {
            "before": [
                "p",
            ],
            "after": [
                "p",
                "g",
                "v",
                "y"
            ]
        }
    ],
```

* Bind `>` and `<` in visual mode to indent/outdent lines (repeatable)

```json
    "vim.visualModeKeyBindingsNonRecursive": [
        {
            "before": [
                ">"
            ],
            "commands": [
                "editor.action.indentLines"
            ]
        },
        {
            "before": [
                "<"
            ],
            "commands": [
                "editor.action.outdentLines"
            ]
        },
    ]
```

* Bind `<leader>vim` to clone this repository to the selected location.

```json
    "vim.visualModeKeyBindingsNonRecursive": [
        {
            "before": [
                "<leader>", "v", "i", "m"
            ],
            "commands": [
                {
                    "command": "git.clone",
                    "args": [ "https://github.com/VSCodeVim/Vim.git" ]
                }
            ]
        }
    ]
```

#### `"vim.insertModeKeyBindingsNonRecursive"`/`"normalModeKeyBindingsNonRecursive"`/`"visualModeKeyBindingsNonRecursive"`

* Non-recursive keybinding overrides to use for insert, normal, and visual modes
* *Example:* Bind `j` to `gj`. Notice that if you attempted this binding normally, the j in gj would be expanded into gj, on and on forever. Stop this recursive expansion using insertModeKeyBindingsNonRecursive and/or normalModeKeyBindingNonRecursive.

```json
    "vim.normalModeKeyBindingsNonRecursive": [
        {
            "before": ["j"],
            "after": ["g", "j"]
        }
    ]
```

### Vim settings

Configuration settings that have been copied from vim. Vim settings are loaded in the following sequence:

1. `:set {setting}`
2. `vim.{setting}` from user/workspace settings.
3. VSCode settings
4. VSCodeVim default values

#### `"vim.ignorecase"`

* Ignore case in search patterns
* Type: Boolean (Default: `true`)

#### `"vim.smartcase"`

* Override the 'ignorecase' setting if the search pattern contains upper case characters
* Type: Boolean (Default: `true`)

#### `"vim.hlsearch"`

* When there is a previous search pattern, highlight all its matches
* Type: Boolean (Default: `false`)

#### `"vim.incsearch"`

* Show the next search match while you're searching.
* Type: Boolean (Default: `true`)

#### `"vim.autoindent"`

* Copy indent from current line when starting a new line
* Type: Boolean (Default: `true`)

#### `"vim.timeout"`

* Timeout in milliseconds for remapped commands
* Type: Number (Default: `1000`)

#### `"vim.showcmd"`

* Show the text of any command you are in the middle of writing.
* Type: Boolean (Default: `true`)

#### `"vim.showmodename"`

* Show the name of the current mode in the statusbar.
* Type: Boolean (Default: `true`)

#### `"vim.textwidth"`

* Width to word-wrap to when using `gq`.
* Type: number (Default: `80`)

#### `"vim.leader"`

* What key should `<leader>` map to in key remappings?
* Type: string (Default: `\`)

## 🖱️ Multi-Cursor Mode

> :warning: Multi-Cursor mode is experimental. Please report issues in our [feedback thread.](https://github.com/VSCodeVim/Vim/issues/824)

Enter multi-cursor mode by:

* On OSX, `cmd-d`. On Windows, `ctrl-d`.
* `gb`, a new shortcut we added which is equivalent to `cmd-d` (OSX) or `ctrl-d` (Windows). It adds another cursor at the next word that matches the word the cursor is currently on.
* Running "Add Cursor Above/Below" or the shortcut on any platform.

Once you have multiple cursors, you should be able to use Vim commands as you see fit. Most should work; some are unsupported (ref [PR#587](https://github.com/VSCodeVim/Vim/pull/587)).

* Each cursor has its own clipboard.
* Pressing Escape in Multi-Cursor Visual Mode will bring you to Multi-Cursor Normal mode. Pressing it again will return you to Normal mode.

## 🔌 Emulated Plugins

### vim-airline

> :warning: Experimental feature. Due to VSCode API limitations, this function modifies settings.json in the workspace resulting in latency and a constant changing diff in your working directory (see [issue#2124](https://github.com/VSCodeVim/Vim/issues/2124)).

Change the color of the status bar based on the current mode. Once enabled, configure `"vim.statusBarColors"`. Colors can be defined for each mode either as `string` (background only), or `string[]` (background, foreground).

```json
    "vim.statusBarColorControl": true,
    "vim.statusBarColors": {
        "normal": ["#8FBCBB", "#434C5E"],
        "insert": "#BF616A",
        "visual": "#B48EAD",
        "visualline": "#B48EAD",
        "visualblock": "#A3BE8C",
        "replace": "#D08770"
    }
```

### vim-easymotion

Based on [vim-easymotion](https://github.com/easymotion/vim-easymotion). To activate easymotion, you need to make sure that `easymotion` is set to `true` in settings.json (default is `false`).

Once easymotion is active, initiate motions using the following commands. After you initiate the motion, text decorators/markers will be displayed and you can press the keys displayed to jump to that position. `leader` is configurable and is `\` by default.

Motion Command | Description
---|--------
`<leader><leader> s <char>`|Search character
`<leader><leader> f <char>`|Find character forwards
`<leader><leader> F <char>`|Find character backwards
`<leader><leader> t <char>`|Til character forwards
`<leader><leader> T <char>`|Til character backwards
`<leader><leader> w`|Start of word forwards
`<leader><leader> b`|Start of word backwards
`<leader><leader> l`|matches beginning & ending of word, camelCase, after _ and after # forwards
`<leader><leader> h`|matches beginning & ending of word, camelCase, after _ and after # backwards
`<leader><leader> e`|End of word forwards
`<leader><leader> ge`|End of word backwards
`<leader><leader> j`|Start of line forwards
`<leader><leader> k`|Start of line backwards
`<leader><leader> / <char>... <CR>`|Search n-character
`<leader><leader><leader> bdt`|Til character
`<leader><leader><leader> bdw`|Start of word
`<leader><leader><leader> bde`|End of word
`<leader><leader><leader> bdjk`|Start of line
`<leader><leader><leader> j`|JumpToAnywhere motion; default behavior matches beginning & ending of word, camelCase, after _ and after #

`<leader><leader> (2s|2f|2F|2t|2T) <char><char>` and `<leader><leader><leader> bd2t <char>char>` are also available.
The difference is character count required for search.
For example, `<leader><leader> 2s <char><char>` requires two characters, and search by two characters.
This mapping is not a standard mapping, so it is recommended to use your custom mapping.

You can customize the appearance of easymotion markers (the boxes with letters) using the following settings:

Setting | Description
---|--------
`vim.easymotionMarkerBackgroundColor`|The background color of the marker box.
`vim.easymotionMarkerForegroundColorOneChar`|The font color for one-character markers.
`vim.easymotionMarkerForegroundColorTwoChar`|The font color for two-character markers, used to differentiate from one-character markers.
`vim.easymotionMarkerWidthPerChar`|The width in pixels allotted to each character.
`vim.easymotionMarkerHeight`|The height of the marker.
`vim.easymotionMarkerFontFamily`|The font family used for the marker text.
`vim.easymotionMarkerFontSize`|The font size used for the marker text.
`vim.easymotionMarkerFontWeight`|The font weight used for the marker text.
`vim.easymotionMarkerYOffset`|The distance between the top of the marker and the text (will typically need some adjusting if height or font size have been changed).
`vim.easymotionKeys`|The characters used for jump marker name
`vim.easymotionJumpToAnywhereRegex`| Custom regex to match for JumpToAnywhere motion (analogous to `Easymotion_re_anywhere`). Example setting (which also matches start & end of line, as well as Javascript comments in addition to the regular behavior (note the double escaping required): ^\\s*.|\\b[A-Za-z0-9]|[A-Za-z0-9]\\b|_.|\\#.|[a-z][A-Z]|//|.$"

### vim-surround

Based on [surround.vim](https://github.com/tpope/vim-surround), the plugin is used to work with surrounding characters like parenthesis, brackets, quotes, and XML tags.

`t` or `<` as `<desired char>` or `<existing char>` will do tags and enter tag entry mode.

Surround is enabled by default, but can be disabled by setting `"vim.surround": false`.

Surround Command | Description
---|--------
`d s <existing char>`|Delete existing surround
`c s <existing char> <desired char>`|Change surround existing to desired
`y s <motion> <desired char>`|Surround something with something using motion (as in "you surround")
`S <desired char>`|Surround when in visual modes (surrounds full selection)

Some examples:

* `"test"` with cursor inside quotes type cs"' to end up with `'test'`
* `"test"` with cursor inside quotes type ds" to end up with `test`
* `"test"` with cursor inside quotes type cs"t and enter 123> to end up with `<123>test</123>`
* `test` with cursor on word test type ysaw) to end up with `(test)`

### vim-commentary

Similar to [vim-commentary](https://github.com/tpope/vim-commentary), but uses the VSCode native "Toggle Line Comment" and "Toggle Block Comment" features.

Usage examples:

* `gc` - toggles line comment. For example `gcc` to toggle line comment for current line and `gc2j` to toggle line comments for the current line and the next two lines.
* `gC` - toggles block comment. For example `gCi)` to comment out everything within parenthesis.

### vim-indent-object

Based on [vim-indent-object](https://github.com/michaeljsmith/vim-indent-object), it allows for treating blocks of code at the current indentation level as text objects. Useful in languages that don't use braces around statements (e.g. Python).

Provided there is a new line between the opening and closing braces / tag, it can be considered an agnostic `cib`/`ci{`/`ci[`/`cit`.

Command | Description
---|--------
`<operator>ii`|This indentation level
`<operator>ai`|This indentation level and the line above (think `if` statements in Python)
`<operator>aI`|This indentation level, the line above, and the line after (think `if` statements in C/C++/Java/etc)

### vim-sneak

Based on [vim-sneak](https://github.com/justinmk/vim-sneak). To activate sneak, you need to make sure that `sneak` is set to `true` in settings.json (default is `false`).

Once sneak is active, initiate motions using the following commands. For operators sneak uses `z` instead of `s` because `s` is already taken by the surround plugin.

Motion Command | Description
---|--------
`s<char><char>`|Move forward to the first occurence of `<char><char>`
`S<char><char>`|Move backward to the first occurence of `<char><char>`
`<operator>z<char><char>`|Perform `<operator>` forward to the first occurence of `<char><char>`
`<operator>Z<char><char>`|Perform `<operator>` backward to the first occurence of `<char><char>`

## 🎩 VSCodeVim tricks!

Vim has a lot of nifty tricks and we try to preserve some of them:

* `gd` - jump to definition.
* `gq` - on a visual selection reflow and wordwrap blocks of text, preserving commenting style. Great for formatting documentation comments.
* `gb` - adds another cursor on the next word it finds which is the same as the word under the cursor.
* `af` - visual mode command which selects increasingly large blocks of text. For example, if you had "blah (foo [bar 'ba|z'])" then it would select 'baz' first. If you pressed `af` again, it'd then select [bar 'baz'], and if you did it a third time it would select "(foo [bar 'baz'])".
* `gh` - equivalent to hovering your mouse over wherever the cursor is. Handy for seeing types and error messages without reaching for the mouse!

## 📚 F.A.Q.

### None of the vim `ctrl` (e.g. `ctrl+f`, `ctrl+v`) commands work

Set the [`useCtrlKeys` setting](#vimusectrlkeys) to `true`.

### Moving `j`/`k` over folds opens up the folds

Try setting `vim.foldfix` to `true`. This is a hack; it works fine, but  there are side effects (see [issue#22276](https://github.com/Microsoft/vscode/issues/22276)).

### Key repeat doesn't work

Are you on a Mac? Did you go through our [mac-setup](#mac-setup) instructions?

### There are annoying intellisense/notifications/popups that I can't close with `<esc>`! Or I'm in a snippet and I want to close intellisense

Press `shift+<esc>` to close all of those boxes.

### How can I use the commandline when in Zen mode or when the status bar is disabled?

This extension exposes a remappable command to show a vscode style quick-pick, limited functionality, version of the commandline. This can be remapped as follows in visual studio keybindings.json settings file.
```
{
    "key": "shift+;",
    "command": "vim.showQuickpickCmdLine",
    "when": "editorTextFocus && vim.mode != 'Insert'"
}
```
Or for Zen mode only:
```
{
    "key": "shift+;",
    "command": "vim.showQuickpickCmdLine",
    "when": "inZenMode && vim.mode != 'Insert'"
}
```

## ❤️ Contributing

This project is maintained by a group of awesome [people](https://github.com/VSCodeVim/Vim/graphs/contributors) and contributions are extremely welcome :heart:. For a quick tutorial on how you can help, see our [contributing guide](/.github/CONTRIBUTING.md).

### Special shoutouts to cool contributors

* Thanks to @xconverge for making over 100 commits to the repo. If you're wondering why your least favorite bug packed up and left, it was probably him.
* Thanks to @Metamist for implementing EasyMotion!
* Thanks to @sectioneight for implementing text objects!
* Special props to [Kevin Coleman](http://kevincoleman.io), who created our awesome logo!
* Shoutout to @chillee aka Horace He for his contributions and hard work.
