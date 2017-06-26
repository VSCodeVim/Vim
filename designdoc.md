# Integrating Neovim into VSCode
## Things I need to figure out
1. Multicursor.
  1. How do I ensure that some commands are only performed once?
  For example, undo.
  2. How do I handle operations that are local to each cursor. For example, copy and paste.
  Will be handled by core neovim (eventually, says @justinmk http://i.imgur.com/jPQtHoU.jpg)

2. Handling operators properly
  https://github.com/neovim/neovim/issues/6166
  Done through a hack right now

3. Ensuring that actions coming in are performed in the correct order.
  * Transformation queue? I guess?

4. Handling cross file jumping.
