# Integrating Neovim into VSCode

## Things we will not port over from Vim (for now). As in, we will have our own implementations that do not try to match vim behavior
1. Folds
2. Splits
3. Intellisense/autocomplete (this includes go to definition, autocomplete, etc.)
4. Syntax highlighting
These are all things that I see no benefit in including from vim.

## Philosophy
As much as possible, we need to pretend like we're in neovim. That means that when we override `gd`, it needs to look exactly like we just did a `gd`. When we're doing autocomplete, it needs to look like the user typed in the text to neovim.

## Overarching strategy
1. Pass all relevant input to neovim.
2. Get all relevant information back (text, cursor position, mode, tabline)
Simple enough.

## Things I need to figure out
1. Multicursor.
  * How do I ensure that some commands are only performed once?
  For example, undo.
  * How do I handle operations that are local to each cursor. For example, copy and paste.
  * Maybe we can use this? https://github.com/terryma/vim-multiple-cursors
  * Will be handled by core neovim (eventually, says @justinmk http://i.imgur.com/jPQtHoU.jpg).

2. Handling operators properly
  * https://github.com/neovim/neovim/issues/6166
  * Done through a hack right now
  * This is annoying. We don't want to need to maintain state on the vscode side. This is why commands like 2dd or gqq don't work in ActualVim.

3. Ensuring that actions coming in are performed in the correct order.
  * Transformation queue?
  * I don't think this is an issue if we don't do multiple cursors? nvim.input() isn't blocking, but I'm not sure.

4. Handling cross file jumping for commands that we're overriding (gd for example)
  * Just open files regularly on editor side, feed it back to neovim, and then handle it regularly.
  Flow of events:
    1. "gd" (or other) is pressed in neovim.
    2. A RPC request is made to VSCode.
    3. VSCode receives the request, opens up the necessary file on the neovim side.
    4. nvim.eval("m'") and then make the right jumps through setpos() and such.

5. Handling splits/folds.
  * All of this should be handled through editor commands.
  * We can override in vimrc through a map to a rpc call.
  * We need some kind of API for this though, to handle keybindings properly.
  * Maybe folds are possible to play nice, but they both seem like fundamental ui incompatibilities.

6. Handling settings that must be handled on the vscode side.
  * I wonder whether there are some things that won't play nice that we might want to lint for.
  * Sync them up either with a .vimrc or at startup. I'm leaning towards in the .vimrc (to maintain transparency)

7. Snippets?
  * no clue how these are implemented.

8. Insert mode autocomplete and such.
  * This is tricky. There's a lot of things that mess up the autocompletion engine.

9. Editor inserted text
  * If we can get a diff we can insert it on the vim side as another action?

10. Handling opening files and other such things.
  * Autocommands that sync up VSCode and neovim state

11. Handling commands that we want vscode to handle.
  * Don't pass anything that's not a single character/<C-char>/<S-char>.
  * Have an "ignore this" array.

12. Mouse