[![Build Status](https://travis-ci.org/VSCodeVim/Vim.svg?branch=master)](https://travis-ci.org/VSCodeVim/Vim) [![Slack Status](https://vscodevim-slackin.azurewebsites.net/badge.svg)](https://vscodevim-slackin.azurewebsites.net)

# Vim

VSCodeVim is a [Visual Studio Code](https://code.visualstudio.com/) extension that provides Vim keybindings within Visual Studio Code.

Please do **[report your issues on GitHub](https://github.com/VSCodeVim/Vim/issues)**. We've added a lot of functionality, but everyone uses Vim in their own special way, so let us know if we're missing your favorite obscure command. :wink:

We're also super friendly people if you want to drop by and talk to us on our [Slack channel](https://vscodevim-slackin.azurewebsites.net)!

![Screenshot](images/screen.png)

## Features We Support 

* All basic modes
* Most typical commands, including command combinations like `c3w`, `daw`, `2dd`, etc. (Check the [roadmap](ROADMAP.md) for details.)
* Command remapping (jj to esc)
* Repeating actions with `.`
* Incremental search with `/` and `?` that works like Vim (doesn't just open the search box!)
* Correct undo/redo state
* Marks

## Roadmap

See our [Github Milestone page](https://github.com/VSCodeVim/Vim/milestones) for an idea of what we plan to implement next.

## Install

1. Within Visual Studio Code, open the command palette (`Ctrl-Shift-P` / `Cmd-Shift-P`)
2. Select `Install Extension` and search for 'vim' *or* run `ext install vim`

## Configure

Adjust configurations through user settings (File -> Preferences -> User Settings).

* vim.keyboardLayout: 
    * Supported Values: `en-US (QWERTY)` (default), `es-ES (QWERTY)`, `de-DE (QWERTZ)`, `da-DK (QWERTY)`

## F.A.Q.

* `j`, `k` and others don't repeat when I hold them down.

On OSX, the fix is to run this in the terminal:

`defaults write com.microsoft.VSCode ApplePressAndHoldEnabled -bool false`

* How can I bind `jj` to `<esc>`?

1. Open the Command palette (cmd-p on OSX, probably ctrl-shift-p on Windows), and add the following:
   
   ```
      "vim.insertModeKeyBindings": [
           {
               "before": ["j", "j"],
               "after": ["<esc>"]
           }
      ]
   ```

2. If you want to press `jj` in modes which are not Insert Mode and still have it trigger `<esc>`, do the following as well:

   ```
      "vim.otherModesKeyBindings": [
           {
               "before": ["j", "j"],
               "after": ["<esc>"]
           }
      ]
```

3. Restart VSCode!

## Contributing

This project is maintained by a group of awesome [contributors](https://github.com/VSCodeVim/Vim/graphs/contributors) and contributions are extremely welcome :heart:. If you are having trouble thinking of how you can help, check out our [roadmap](ROADMAP.md).

For a quick tutorial on how to get started, see our [contributing guide](/.github/CONTRIBUTING.md).

## License

MIT, please see [License](LICENSE) for more information.
