## [0.7.0](https://github.com/VSCodeVim/Vim/releases/tag/v0.7.0)
A major release! Wow! Lots of new features and bug fixes this iteration.

Huge props especially to @chillee this time, who fixed a huge number of outstanding issues and bugs. He also wrote these entire release notes - except this line praising him, because that would have been awkward (that was me, @johnfn).

# New Features:
- Tag matching across multiple lines. Thanks @jrenton for implementing it and @chillee for fixing the remaining bugs. #971 #1108 #1232 #1300
- Toggle Vim on and off.
- [VisualStar](https://github.com/bronson/vim-visual-star-search) plugin implemented. Thanks @mikew!
- [Indent-Object](https://github.com/michaeljsmith/vim-indent-object) plugins implemented. Thanks @mikew!
- Added support for multiline searching.  #1575 Thanks @chillee!
- Navigate between different VSCode panes with ctrl+w h/j/k/l. #1375 Thanks @lyup!
- z- and z<CR> keybindings added. #1637 #1638 Thanks @chillee!
- Added new remapping options to remap any key. #1543 As an example, this functionality can cover #1505 and #1452.

# Bugfixes/enhancements
- Fixed history being dropped when switching tabs. #1503 Thanks @chillee!
- Fixed lots of wonky gj/gk visual behavior. #890 #1377 Thanks @chillee!
- Fixed Ctrl-c dropping a character when selecting from right to left in insert mode. #1441 #1355 Thanks @chillee!
- Fixed Ctrl-w in insert mode deleting through whitespace at the beginning of the line. #1137 Thanks @chillee!
- Fixed Ctrl-a breaking in certain circumstances. #1588 Thanks @chillee!
- Fixed gd not setting the desired column properly. #1532 Thanks @chillee!
- Fixed gq adding an extra space to beginning of selection. #1251 Thanks @chillee!
- Fixed dot command not working in macros. #1595 Thanks @chillee!
- Fixed Ctrl-c dropping top and bottom lines when selecting in visual line from the bottom up. #1594 Thanks @chillee!
- Updated workbench theming for new release of VSCode. Thanks @zelphir!
- Enabled Easymotion to work for larger files. #1627
- Made `statusBarColors` modify user `settings.json` instead of workspace. #1565
- Enabled ranges for :sort. #1592
- Made the command line persistent when switching windows. Thanks @chillee!

and we finally split up actions.ts into separate files!

Also view changelog [here](https://github.com/VSCodeVim/Vim/releases).
