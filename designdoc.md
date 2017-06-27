# Integrating Neovim into VSCode
## Things I need to figure out
1. Multicursor.
  * How do I ensure that some commands are only performed once?
  For example, undo.
  * How do I handle operations that are local to each cursor. For example, copy and paste.
  * Will be handled by core neovim (eventually, says @justinmk http://i.imgur.com/jPQtHoU.jpg)

2. Handling operators properly
  https://github.com/neovim/neovim/issues/6166
  Done through a hack right now

3. Ensuring that actions coming in are performed in the correct order.
  * Transformation queue?

4. Handling cross file jumping.
  * Just open files regularly, feed it back to neovim, and then handle it regularly.
  * We will need to capture file-open events and feed them back to VSCode.

5. Handling splits/folds.
  * All of this should be handled through editor commands

6. Listening to RPC events?
  * How do I do this???

7. Snippets?
  * no clue

8. Insert mode autocomplete and such.

9. Editor inserted text

10. Handling buffers and other such tomfoolery
  * Autocommands that sync up VSCode and neovim state