## [v0.7.1 Quizzing Quotient](https://github.com/VSCodeVim/Vim/releases/tag/v0.7.1)  (May 10, 2017)
* @mspaulding06: Add :close support based on :quit
* @Chillee: Added <C-w> j and <C-w> k
* @rebornix Fixes #1657
* @Chillee Fixes #1280
* @Chillee Fixes  keybindings
* @vinicio Changes tabs to navigate inside the same split
* @Chillee Fixes #1535, #1467, #1311: D-d doesn't work in insert mode
## [v0.7.0 Procrastinating Potato](https://github.com/VSCodeVim/Vim/releases/tag/v0.7.0)  (May 5, 2017)
A major release! Wow! Lots of new features and bug fixes this iteration.

Huge props especially to @Chillee this time, who fixed a huge number of outstanding issues and bugs. He also wrote these entire release notes - except this line praising him, because that would have been awkward (that was me, @johnfn).

...and we finally split up actions.ts into separate files! Get at us, contributors! ❤️

* Tag matching across multiple lines. Thanks @jrenton for implementing it and @Chillee for fixing the remaining bugs. #971 #1108 #1232 #1300
* Toggle Vim on and off.
* VisualStar plugin implemented. Thanks @mikew!
* Indent-Object plugins implemented. Thanks @mikew!
* Added support for multiline searching.  #1575 Thanks @Chillee!
* Navigate between different VSCode panes with ctrl+w h/j/k/l. #1375 Thanks @lyup!
* z- and z keybindings added. #1637 #1638 Thanks @Chillee!
* Added new remapping options to remap any key. #1543 As an example, this functionality can cover #1505 and #1452.
* Fixed history being dropped when switching tabs. #1503 Thanks @Chillee!
* Fixed lots of wonky gj/gk visual behavior. #890 #1377 Thanks @Chillee!
* Fixed Ctrl-c dropping a character when selecting from right to left in insert mode. #1441 #1355 Thanks @Chillee!
* Fixed Ctrl-w in insert mode deleting through whitespace at the beginning of the line. #1137 Thanks @Chillee!
* Fixed Ctrl-a breaking in certain circumstances. #1588 Thanks @Chillee!
* Fixed gd not setting the desired column properly. #1532 Thanks @Chillee!
* Fixed gq adding an extra space to beginning of selection. #1251 Thanks @Chillee!
* Fixed dot command not working in macros. #1595 Thanks @Chillee!
* Fixed Ctrl-c dropping top and bottom lines when selecting in visual line from the bottom up. #1594 Thanks @Chillee!
* Updated workbench theming for new release of VSCode. Thanks @zelphir!
* Enabled Easymotion to work for larger files. #1627
* Made statusBarColors modify user settings.json instead of workspace. #1565
* Enabled ranges for :sort. #1592
* Made the command line persistent when switching windows. Thanks @Chillee!
## [v0.6.20 Careful Carrot](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.20)  (Apr 26, 2017)
* Fix issue with gq reflow cursor position from previous release
## [v0.6.19 Blushing Beet](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.19)  (Apr 26, 2017)
* Fixes insert mode backspace at first character causing no op #1573 Thanks @Chillee
* Fixes gq incorrectly handles triple-slash doc-comments #1449 Thanks @azngeoffdog!
* Surround doing weird things #1570 #1562 #1562
* Fixes Va{ not working #1235
* Reformatting long lines with "gq" now resets horizontal scroll #1252
* :x (write and close), :xa, :wqa implemented #1486
* Added support for _ register (blackhole) #1357
## [v0.6.18 Chillen Chives](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.18)  (Apr 24, 2017)
* Fixes to "reg" command #1539 Thanks @Chillee
* Fixes to aw and aW motions #1350 #1193 #1553 #1554 Thanks @Chillee
* Fixes to ctrl+c #1533 Thanks @Chillee
* @cobbweb Refactored the entire README! Thanks!
* Updated clipboard library for UTF-8 windows fixes. #1284, #1299, #1125
## [v0.6.17 Color Consortium](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.17)  (Apr 20, 2017)
* Fix repeated insert 5i= impacting 5s #1519
* Change status bar color based on mode similar to lightline plugin #1056
* Fix UTF-8 character copy/paste for macOS and Linux #1392
* Make surround repeatable with dot #1244
## [v0.6.16 Rugged Raspberries](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.16)  (Apr 16, 2017)
* Commentary plugin functionality (Thanks @fiedler)
* Customize easymotion decorations (Thanks @edasaki)
* Repeat insert char eg. 5i= #1122
* Easymotion j/k motions fixed #1448
* Allow user to remap : commands like :nohl #1166
* Fix case sensitivity in remapping arrow keys #1507
* Added z. #1475
* Fixes double clicking word with mouse not displaying correct selection
## [0.6.15 0.6.15 Multi Madness](https://github.com/VSCodeVim/Vim/releases/tag/0.6.15)  (Apr 8, 2017)
Fix for gc and Cmd-D multicursor not working correctly

## [0.6.14 Bingo Blocky](https://github.com/VSCodeVim/Vim/releases/tag/0.6.14)  (Apr 8, 2017)
* Fix for visual block mode
* Fix type suggestion for handleKeys object #1465 (thanks @abhiranjankumar00)
## [v0.6.13 Fixy Fish](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.13)  (Apr 4, 2017)
The previous release had a bug with ..

