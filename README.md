<h1 align="center"><img src="https://raw.githubusercontent.com/VSCodeVim/Vim/master/images/icon.png" height="128"><br>VSCodeVim</h1>
<p align="center"><strong>Vim emulation for Visual Studio Code.</strong></p>

![http://aka.ms/vscodevim](https://vsmarketplacebadge.apphb.com/version/vscodevim.vim.svg)
![https://travis-ci.org/VSCodeVim/Vim]( https://travis-ci.org/VSCodeVim/Vim.svg?branch=master)


<hr>

VSCodeVim is a [Visual Studio Code](https://code.visualstudio.com/) extension that enables Vim keybindings, including:

* Modes: normal, insert, command-line, visual, visual line, visual block
* Command combinations (`c3w`, `daw`, `2dd`, etc)
* Highly versatile command remapping (`jj` to `<Esc>`, `:` to command panel, etc.)
* Highly versatile command remapping (`jj` to `<Esc>`, `:` to command panel, etc.)
* Incremental search with `/` and `?`
* Marks
* Popular vim plugin features built-in (easymotion, surround, commentary)
* Vim settings similar to those found in .vimrc
* Multi-cursor support, run vim commands everywhere!
* And much more! Refer to the [roadmap](ROADMAP.md) for everything we support.

Please [report missing features/bugs on GitHub](https://github.com/VSCodeVim/Vim/issues), which will help us get to them faster.

Ask us questions, talk about contributing, or just say hi on [Slack](https://vscodevim-slackin.azurewebsites.net)!

## Donations

[![Donate](https://www.paypalobjects.com/webstatic/en_US/i/btn/png/btn_donate_92x26.png)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=FNUBXQADN5VG4)

[Make a donation to VSCodeVim here!](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=FNUBXQADN5VG4)

Donations help convince me to work on this project rather than my other (non-open-source) projects. I'd love to work on VSCodeVim full time, but I need money to live!

## Contents

* [Getting Started](#getting-started)
    * [Mac setup](#mac-setup)
    * [Windows setup](#windows-setup)
* [Settings](#settings)
    * [VSCodeVim settings](#vscodevim-settings)
    * [Neovim Integration](#neovim-integration)
    * [Key remapping](#key-remapping)
    * [Vim settings](#vim-settings)
    * [Status bar colors (vim-airline)](#status-bar-color-settings)
* [Multi-cursor mode](#multi-cursor-mode)
* [Emulated plugins](#emulated-plugins)
    * [vim-easymotion](#vim-easymotion)
    * [vim-surround](#vim-surround)
    * [vim-commentary](#vim-commentary)
    * [vim-indent-object](#vim-indent-object)
* [VSCodeVim tricks](#vscodevim-tricks)
* [F.A.Q / Troubleshooting](#faq)
* [Contributing](#contributing)
* [Release notes](https://github.com/VSCodeVim/Vim/releases)

## Getting started

The plugin will be automatically enabled after [installing](https://marketplace.visualstudio.com/items?itemName=vscodevim.vim) it and reloading VSCode. The plugin can only be disabled from the Extension manager in VSCode, with no quick way to switch between modal and modeless editing.

Just like real vim, your editor will now be in Normal mode, which is reported to VSCode's status bar. From here, all your regular vim commands will work as normal, hooray!

### Vim compatibility

All common Vim commands are supported. For an in-depth look at what Vim features are supported, check out the [roadmap](ROADMAP.md). Vimscript isn't supported, so you aren't able to load your `.vimrc` or use `.vim` plugins. You have to replicated these using our [Settings](#settings) and [Emulated plugins](#emulated-plugins).

### Mac setup

If key repeating isn't working for you, execute this in your Terminal.

```sh
defaults write com.microsoft.VSCode ApplePressAndHoldEnabled -bool false         # For VS Code
defaults write com.microsoft.VSCodeInsiders ApplePressAndHoldEnabled -bool false # For VS Code Insider
```

We also recommend going into *System Preferences -> Keyboard* and cranking up the Key Repeat and Delay Until Repeat settings to improve your speed.

### Windows setup

VSCodeVim will take over your control keys, just like real vim, so you get the _full_ vim experience. This behaviour can be adjusted with the [`useCtrlKeys`](#vimusectrlkeys) and [`handleKeys`](#vimhandlekeys) settings.

## Settings

### Quick example settings

Below is an example of a [settings.json](https://code.visualstudio.com/Docs/customization/userandworkspace) file for VSCode settings applicable to this extension. Continue on below for more in-depth documentation.

```json
{
    "vim.easymotion": true,
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
    "vim.otherModesKeyBindingsNonRecursive": [
        {
            "before": ["<leader>","d"],
            "after": ["d", "d"]
        },
        {
            "before":["<C-n>"],
            "after":[],
            "commands": [
                {
                    "command": ":nohl"
                }
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

The following is a subset of the supported settings; the full list is described in the `Contributions` tab for this extension, or in our [package.json](https://github.com/VSCodeVim/Vim/blob/master/package.json#L175).

### VSCodeVim settings

These settings are specific to VSCodeVim.

#### `"vim.startInInsertMode"`
* Have VSCodeVim start in Insert Mode rather than Normal Mode.
* We would be remiss in our duties as Vim users not to say that you should really be staying in Normal mode as much as you can, but hey, who are we to stop you?

#### `"vim.overrideCopy"`
* Override VSCode's copy command with our own, which works correctly with VSCodeVim.
* If cmd-c or ctrl-c is giving you issues, set this to false and complain at https://github.com/Microsoft/vscode/issues/217.
* Type: Boolean (Default: `true`)

#### `"vim.useSystemClipboard"`
* Enable yanking to the system clipboard by default
* Type: Boolean (Default: `false`)

#### `"vim.searchHighlightColor"`
* Set the color of search highlights.
* Type: Color String (Default: `rgba(150, 150, 150, 0.3)`)

#### `"vim.useSolidBlockCursor"`
We have removed this option, due to it making VSCodeVim's performance suffer immensely.

#### `"vim.useCtrlKeys"`
* Enable Vim ctrl keys overriding common VS Code operations (eg. copy, paste, find, etc). Enabling this setting will:
    * `ctrl+c`, `ctrl+[` => `<Esc>`
    * `ctrl+f` => Full Page Forward
    * `ctrl+d` => Half Page Back
    * `ctrl+b` => Half Page Forward
    * `ctrl+v` => Visual Block Mode
    * etc.
* Type: Boolean (Default: `true`)

#### `"vim.handleKeys"`
* Allows user to select certain modifier keybindings and delegate them back to VSCode so that VSCodeVim does not process them.
* Complete list of keys that can be delegated back to VSCode can be found in our [package.json](https://github.com/VSCodeVim/Vim/blob/master/package.json#L44). Each key that has a vim.use<C-...> in the when argument can be delegated back to vscode by doing "<C-...>":false.
* An example would be if a user wanted to continue to use ctrl + f for find, but wants to have [`useCtrlKeys`](#vimusectrlkeys) set to true so that other vim bindings work.

```json
    "vim.handleKeys": {
        "<C-a>": false,
        "<C-f>": false
    }
```

#### `"vim.visualstar"`
* In visual mode, start a search with * or # using the current selection
* Type: Boolean (Default: `false`)

### Neovim Integration

We now have neovim integration for Ex-commands. If you want to take advantage of this integration, set `"vim.enableNeovim"` to `true`, and set your `"vim.neovimPath"`. If you don't have neovim installed, [install neovim here](https://github.com/neovim/neovim/wiki/Installing-Neovim). If you don't want to install neovim, all of the old functionality should still work as is (we would really suggest neovim installing though. The new Ex support is super cool, and we'd like to integrate neovim more in the future).

Please leave feedback on neovim [here](https://github.com/VSCodeVim/Vim/issues/1735).

Here's some ideas on what you can do with your newfound neovim integration!

* [The power of g](http://vim.wikia.com/wiki/Power_of_g)
* [The :normal command](https://vi.stackexchange.com/questions/4418/execute-normal-command-over-range)
* Faster search and replace!

### Key remapping

There's several different settings you can use to define custom remappings. Also related are the [`useCtrlKeys`](#vimusectrlkeys) and [`handleKeys`](#vimhandlekeys) settings.

#### `"vim.insertModeKeyBindings"`/`"vim.otherModesKeyBindings"`
* Keybinding overrides to use for insert and other (non-insert) modes.

Bind `jj` to `<Esc>` in insert mode:

```json
    "vim.insertModeKeyBindings": [
        {
            "before": ["j", "j"],
            "after": ["<Esc>"]
        }
    ]
```

Bind `:` to show the command palette:

```json
"vim.otherModesKeyBindingsNonRecursive": [
    {
        "before": [":"],
        "after": [],
        "commands": [
            {
                "command": "workbench.action.showCommands",
                "args": []
            }
        ]
    }
]
```

Bind `ZZ` to save and close the current file:

```json
    "vim.otherModesKeyBindingsNonRecursive": [
        {
            "before": ["Z", "Z"],
            "after": [],
            "commands": [
                {
                    "command": "workbench.action.files.save",
                    "args": []
                },
                {
                    "command": "workbench.action.closeActiveEditor",
                    "args": []
                }
            ]
        }
    ]
```

Or bind ctrl+n to turn off search highlighting and `<leader>w` to save the current file:

```json
    "vim.otherModesKeyBindingsNonRecursive": [
        {
            "before":["<C-n>"],
            "after":[],
            "commands": [
                {
                    "command": ":nohl",
                    "args": []
                }
            ]
        },
        {
            "before": ["leader", "w"],
            "after": [],
            "commands": [
                {
                    "command": "workbench.action.files.save",
                    "args": []
                }
            ]
        }
    ]
```


#### `"vim.insertModeKeyBindingsNonRecursive"`/`"otherModesKeyBindingsNonRecursive"`
* Non-recursive keybinding overrides to use for insert and other (non-insert) modes (similar to `:noremap`)
* *Example:* Bind `j` to `gj`. Notice that if you attempted this binding normally, the j in gj would be expanded into gj, on and on forever. Stop this recursive expansion using insertModeKeyBindingsNonRecursive and/or otherModesKeyBindingNonRecursive.

```json
    `"vim.otherModesKeyBindingsNonRecursive": [
        {
            "before": ["j"],
            "after": ["g", "j"]
        }
    ]
```

### Status bar color settings

Almost like vim-airline in VSCode!

#### `"vim.statusBarColorControl"`
* Control status bar color based on current mode
* Type: Boolean (Default: `false`)
* Notes: Experimental feature, currently due to VSCode API limitations, this function MUST modify settings.json in the workspace. This causes a slight amount of latency and a constant changing diff in your working directory. [Issue #1565](https://github.com/VSCodeVim/Vim/issues/1565)

Once this is set, you need to set `"vim.statusBarColors"` as well with these exact strings for modenames. The colors can be adjusted to suit the user.

```json
    "vim.statusBarColorControl": true,
    "vim.statusBarColors" : {
        "normal": "#005f5f",
        "insert": "#5f0000",
        "visual": "#5f00af",
        "visualline": "#005f87",
        "visualblock": "#86592d",
        "replace": "#000000"
    }
```

### Vim settings

Configuration settings that have been copied from vim.

Vim settings are loaded in the following sequence:

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

#### `"vim.textwidth"`
* Width to word-wrap to when using `gq`.
* Type: number (Default: `80`)

#### `"vim.leader"`
* What key should `<leader>` map to in key remappings?
* Type: string (Default: `\`)

## Multi-Cursor mode

> ⚡ Multi-Cursor mode is currently in beta. Please report things you expected to work but didn't [to our feedback thread.](https://github.com/VSCodeVim/Vim/issues/824)

### Getting into multi-cursor mode

You can enter multi-cursor mode by:

* Pressing cmd-d on OSX.
* Running "Add Cursor Above/Below" or the shortcut on any platform.
* Pressing `gb`, a new shortcut we added which is equivalent to cmd-d on OSX or ctrl-d on Windows. (It adds another cursor at the next word that matches the word the cursor is currently on.)

### Doing stuff

Now that you have multiple cursors, you should be able to use Vim commands as you see fit. Most of them should work. There is a list of things I know of which don't [here](https://github.com/VSCodeVim/Vim/pull/587). If you find yourself wanting one of these, please [add it to our feedback thread.](https://github.com/VSCodeVim/Vim/issues/824)

Each cursor has its own clipboard.

Pressing Escape in Multi-Cursor Visual Mode will bring you to Multi-Cursor Normal mode. Pressing it again will return you to Normal mode.

## Emulated plugins

### vim-easymotion

Easymotion is based on [vim-easymotion](https://github.com/easymotion/vim-easymotion). To activate easymotion, you need to make sure that `easymotion` is set to `true` in settings.json (as the default is `false`).

Once easymotion is active, you can initiate motions using the following commands. After you initiate the motion, text decorators/markers will be displayed and you can press the keys displayed to jump to that position. `leader` is configurable and is `\` by default.

Motion Command | Description
---|--------
`<leader> <leader> s <char>`|Search character
`<leader> <leader> f <char>`|Find character forwards
`<leader> <leader> F <char>`|Find character backwards
`<leader> <leader> t <char>`|Til character forwards
`<leader> <leader> T <char>`|Til character backwards
`<leader> <leader> w`|Start of word forwards
`<leader> <leader> b`|Start of word backwards
`<leader> <leader> e`|End of word forwards
`<leader> <leader> g e`|End of word backwards

You can customize the appearance of your easymotion markers (the boxes with letters) using the following settings:

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

### vim-surround

Surround plugin based on tpope's [surround.vim](https://github.com/tpope/vim-surround) plugin is used to work with surrounding characters like parenthesis, brackets, quotes, and XML tags.

`t` or `<` as `<desired char>` or `<existing char>` will do tags and enter tag entry mode.

Surround can be disabled by setting vim.surround : false

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

Commentary in VSCodeVim works similarly to tpope's [vim-commentary](https://github.com/tpope/vim-commentary) but uses the VSCode native "Toggle Line Comment" and "Toggle Block Comment" features.

Usage examples:
* `gc` - toggles line comment. For example `gcc` to toggle line comment for current line and `gc2j` to toggle line comments for the current line and the next line.
* `gC` - toggles block comment. For example `gCi)` to comment out everything within parenthesis.


### vim-indent-object

Indent Objects in VSCodeVim are identical to [michaeljsmith/vim-indent-object](https://github.com/michaeljsmith/vim-indent-object) and allow you to treat blocks of code at the current indentation level as text objects. This is very useful in languages that don't use braces around statements, like Python.

Provided there is a new line between the opening and closing braces / tag, it can be considered an agnostic `cib`/`ci{`/`ci[`/`cit`.

Command | Description
---|--------
`<operator>ii`|This indentation level
`<operator>ai`|This indentation level and the line above (think `if` statements in Python)
`<operator>aI`|This indentation level, the line above, and the line after (think `if` statements in C/C++/Java/etc)

## VSCodeVim tricks!

**Awesome Features You Might Not Know About**

Vim has a lot of nooks and crannies. VSCodeVim preserves some of the coolest nooks and crannies of Vim. And then we add some of our own! Some of our favorite include:

* `gd` - jump to definition. _Astoundingly_ useful in any language that VSCode provides definition support for. I use this one probably hundreds of times a day.
* `gq` - on a visual selection - Reflow and wordwrap blocks of text, preserving commenting style. Great for formatting documentation comments.
* `gb` - which adds another cursor on the next word it finds which is the same as the word under the cursor.
* `af` - a command that I added in visual mode, which selects increasingly large blocks of text. e.g. if you had "blah (foo [bar 'ba|z'])" then it would select 'baz' first. If you pressed `af` again, it'd then select [bar 'baz'], and if you did it a third time it would select "(foo [bar 'baz'])".
* `gh` - another custom VSCodeVim command. This one is equivalent to hovering your mouse over wherever the cursor is. Handy for seeing types and error messages without reaching for the mouse!

(The mnemonic: selecting blocks is fast af! :wink:)

## F.A.Q.

### Help! None of the vim `ctrl` (e.g. `ctrl+f`, `ctrl+v`) commands work

Set the [`useCtrlKeys` setting](#vimusectrlkeys) to `true`.

### Moving j and k over folds opens up the folds! This extension is unusable!

You can try setting `vim.foldfix` to `true`. Note, however, that it is a hack. It works fine, but there are side effects. We are unable to fix this issue properly due to VSCode API limitations. Go to [here](https://github.com/Microsoft/vscode/issues/22276) for updates on the issue.

### Key repeat doesn't work! And I'm on Mac!

Take a look [here](#mac-setup).

### There are annoying intellisense/notifications/popups that I can't close with `<esc>`! Or I'm in a snippet and I want to close intellisense!

Press `shift+<esc>` to close all of those boxes.

## Contributing

This project is maintained by a group of awesome [people](https://github.com/VSCodeVim/Vim/graphs/contributors) and contributions are extremely welcome :heart:. For a quick tutorial on how you can help, see our [contributing guide](/.github/CONTRIBUTING.md).

### Special shoutouts to cool contributors

* Thanks to @xconverge for making over 100 commits to the repo. If you're wondering why your least favorite bug packed up and left, it was probably him.
* Thanks to @Metamist for implementing EasyMotion!
* Thanks to @sectioneight for implementing text objects!
* Special props to [Kevin Coleman](http://kevincoleman.io), who created our awesome logo!

