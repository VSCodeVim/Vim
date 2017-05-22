# Change Log

## [Unreleased](https://github.com/VSCodeVim/Vim/tree/HEAD)

[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.7.1...HEAD)

**Closed issues:**

- VSCode Zen Mode Shortcut not working [\#1720](https://github.com/VSCodeVim/Vim/issues/1720)
- Multicursor paste is broken [\#1715](https://github.com/VSCodeVim/Vim/issues/1715)
- Last character in selection [\#1711](https://github.com/VSCodeVim/Vim/issues/1711)
- Vim refactor and enhancement [\#1706](https://github.com/VSCodeVim/Vim/issues/1706)
- Refactor the delete operator [\#1701](https://github.com/VSCodeVim/Vim/issues/1701)
- chinese input bugs [\#1699](https://github.com/VSCodeVim/Vim/issues/1699)
- Vim visual mode background color confusing on character under cursor [\#1697](https://github.com/VSCodeVim/Vim/issues/1697)
- Go to previous jump '' [\#1690](https://github.com/VSCodeVim/Vim/issues/1690)
- \[feature request\]disselect "'\<,'\>" in command mode with selection [\#1687](https://github.com/VSCodeVim/Vim/issues/1687)
- Bug with gq [\#1684](https://github.com/VSCodeVim/Vim/issues/1684)
- ctrl-w, ctrl-w no longer cycles panes [\#1679](https://github.com/VSCodeVim/Vim/issues/1679)
- Surround not working on 0.7.0 [\#1678](https://github.com/VSCodeVim/Vim/issues/1678)
- dot command does not work properly when inserting \<Tab\>/"/'/\(/{/\[ [\#1674](https://github.com/VSCodeVim/Vim/issues/1674)
- Tag matching self closing tag issue [\#1668](https://github.com/VSCodeVim/Vim/issues/1668)
- could not save the file which only trim the new line at the end of file [\#1661](https://github.com/VSCodeVim/Vim/issues/1661)
- gf doesn't work with filepath:linenumber paths [\#1655](https://github.com/VSCodeVim/Vim/issues/1655)
- macro playback does not insert tab [\#1634](https://github.com/VSCodeVim/Vim/issues/1634)
- Multicursor insertion is slow  [\#1626](https://github.com/VSCodeVim/Vim/issues/1626)
- Shortcut to keep preview table open [\#1580](https://github.com/VSCodeVim/Vim/issues/1580)
- ^E stops scrolling down when the cursor reaches the top of the page [\#1544](https://github.com/VSCodeVim/Vim/issues/1544)
- Cannot search in visual mode [\#1520](https://github.com/VSCodeVim/Vim/issues/1520)
- Inserting keywords on pressing arrow keys in visual mode [\#1458](https://github.com/VSCodeVim/Vim/issues/1458)
- Change configuration updates to monitor relevant changes instead of all changes [\#1438](https://github.com/VSCodeVim/Vim/issues/1438)
- This extension prevents 'find all reference' pop-up from closing using ESC key [\#1436](https://github.com/VSCodeVim/Vim/issues/1436)
- Visual block mode doesn't respect remapped navigation keys [\#1403](https://github.com/VSCodeVim/Vim/issues/1403)
- Tab in visual block mode applies to first line only [\#1400](https://github.com/VSCodeVim/Vim/issues/1400)
- Ctrl-a and Ctrl-x works not correctly when a word has more than one number [\#1376](https://github.com/VSCodeVim/Vim/issues/1376)
- Highlighted character jumps around when highlighting text. [\#1247](https://github.com/VSCodeVim/Vim/issues/1247)
- Pasting after deleting a line leaves cursor in wrong position [\#1218](https://github.com/VSCodeVim/Vim/issues/1218)
- y}p handles newlines incorrectly [\#1197](https://github.com/VSCodeVim/Vim/issues/1197)
- d} deletes extra \(empty\) line [\#1196](https://github.com/VSCodeVim/Vim/issues/1196)
- Actions after visual line indent are relative to where cursor started [\#1143](https://github.com/VSCodeVim/Vim/issues/1143)
- Wrong cursor placement after indenting multiple lines [\#1135](https://github.com/VSCodeVim/Vim/issues/1135)
- gt/T doesn't take editor groups in account [\#1131](https://github.com/VSCodeVim/Vim/issues/1131)
- Visual Block Mode & Multi Cursor Mode should use the same code base [\#776](https://github.com/VSCodeVim/Vim/issues/776)
- cc on end of line eats currentline [\#727](https://github.com/VSCodeVim/Vim/issues/727)
- Improve tests [\#700](https://github.com/VSCodeVim/Vim/issues/700)
- Repeated commands that insert white space at from of line doesn't work [\#612](https://github.com/VSCodeVim/Vim/issues/612)
- Marks across files [\#389](https://github.com/VSCodeVim/Vim/issues/389)

**Merged pull requests:**

- Actually readded \<c-j\> and \<c-k\> [\#1730](https://github.com/VSCodeVim/Vim/pull/1730) ([Chillee](https://github.com/Chillee))
- Revert "Unfixes \#1720" [\#1729](https://github.com/VSCodeVim/Vim/pull/1729) ([Chillee](https://github.com/Chillee))
- Unfixes \#1720 [\#1728](https://github.com/VSCodeVim/Vim/pull/1728) ([Chillee](https://github.com/Chillee))
- Fixes \#1720: Removed unused \<c- \> bindings from package.json [\#1722](https://github.com/VSCodeVim/Vim/pull/1722) ([Chillee](https://github.com/Chillee))
- Fixes \#1376: \<C-a\> doesn't work correctly when a word has more than 1 number [\#1721](https://github.com/VSCodeVim/Vim/pull/1721) ([Chillee](https://github.com/Chillee))
- Fixes \#1715: Adds multicursor paste [\#1717](https://github.com/VSCodeVim/Vim/pull/1717) ([Chillee](https://github.com/Chillee))
- Fixes \#1520: search in visual/visualLine/visualBlock mode [\#1710](https://github.com/VSCodeVim/Vim/pull/1710) ([Chillee](https://github.com/Chillee))
- Fixes \#1403: VisualBlock doesn't respect keybindings. [\#1709](https://github.com/VSCodeVim/Vim/pull/1709) ([Chillee](https://github.com/Chillee))
- Fixes \#1655: Extends gf to line numbers [\#1708](https://github.com/VSCodeVim/Vim/pull/1708) ([Chillee](https://github.com/Chillee))
- Fixes \#1436: extension prevents 'find all references' pop-up from closing through \<esc\> if it's empty. [\#1707](https://github.com/VSCodeVim/Vim/pull/1707) ([Chillee](https://github.com/Chillee))
- Fixes \#1668: Self closing tags not properly handled. [\#1702](https://github.com/VSCodeVim/Vim/pull/1702) ([Chillee](https://github.com/Chillee))
- Fixes \#1674: repeating . with characters like " or \) leaves cursor in wrong place [\#1700](https://github.com/VSCodeVim/Vim/pull/1700) ([Chillee](https://github.com/Chillee))
- remove system clipboard hack for UTF-8 [\#1695](https://github.com/VSCodeVim/Vim/pull/1695) ([xconverge](https://github.com/xconverge))
- Fixes \#1684: Fixed gq spacing issues [\#1686](https://github.com/VSCodeVim/Vim/pull/1686) ([Chillee](https://github.com/Chillee))
- Fixed some regressions I introduced [\#1681](https://github.com/VSCodeVim/Vim/pull/1681) ([Chillee](https://github.com/Chillee))
- feat\(surround\): support complex tags surround [\#1680](https://github.com/VSCodeVim/Vim/pull/1680) ([admosity](https://github.com/admosity))
- Fixes \#1400, \#612, \#1632, \#1634, \#1531, \#1458: Tab isn't handled properly for insert and visualblockinsert modes [\#1663](https://github.com/VSCodeVim/Vim/pull/1663) ([Chillee](https://github.com/Chillee))
- Fixes \#792: Selecting range before Ex-commands highlights initial text [\#1659](https://github.com/VSCodeVim/Vim/pull/1659) ([Chillee](https://github.com/Chillee))
- Fixes \#1256 and \#394: Fixes delete key and adds functionality [\#1644](https://github.com/VSCodeVim/Vim/pull/1644) ([Chillee](https://github.com/Chillee))
- Fixes \#1196, \#1197: d}/y} not working correctly [\#1621](https://github.com/VSCodeVim/Vim/pull/1621) ([Chillee](https://github.com/Chillee))
- Fixing the automatic fold expansion \(\#1004\) [\#1552](https://github.com/VSCodeVim/Vim/pull/1552) ([Chillee](https://github.com/Chillee))

## [v0.7.1](https://github.com/VSCodeVim/Vim/tree/v0.7.1) (2017-05-10)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.7.0...v0.7.1)

**Closed issues:**

- Surround: cs\<x\>\<y\> broken [\#1676](https://github.com/VSCodeVim/Vim/issues/1676)
- Up/down motion with gj and gk does not retain cursor position [\#1675](https://github.com/VSCodeVim/Vim/issues/1675)
- Problem in keymapings default. [\#1669](https://github.com/VSCodeVim/Vim/issues/1669)
- Bug \(MacOS only\): Several commands do not work when vscode opened from command line [\#1660](https://github.com/VSCodeVim/Vim/issues/1660)
- Surround plugin appears broken in 0.7.0 [\#1657](https://github.com/VSCodeVim/Vim/issues/1657)
- registered data cannot paste. [\#1646](https://github.com/VSCodeVim/Vim/issues/1646)
- ctrl + c in insert mode does not copy line. [\#1639](https://github.com/VSCodeVim/Vim/issues/1639)
- CTRL-w w doesn't move between groups [\#1585](https://github.com/VSCodeVim/Vim/issues/1585)
-  INSERT MODE ctrl+d don't  add Selection To Next Find Match [\#1535](https://github.com/VSCodeVim/Vim/issues/1535)
- o Doesn't accept range [\#1531](https://github.com/VSCodeVim/Vim/issues/1531)
- command not found after opening settings.json [\#1527](https://github.com/VSCodeVim/Vim/issues/1527)
- incsearch does not work in visual mode [\#1498](https://github.com/VSCodeVim/Vim/issues/1498)
- Add next occurence in insert and normal mode is limited to a maximum of 2 cursors [\#1467](https://github.com/VSCodeVim/Vim/issues/1467)
- It would be really awesome if c-w h and c-w l would navigate between other panes [\#1375](https://github.com/VSCodeVim/Vim/issues/1375)
- This extension breaks the `Add Next Occurrence` command and shortcut [\#1311](https://github.com/VSCodeVim/Vim/issues/1311)
- Putting over selection in visual mode does not yank deleted selection [\#1280](https://github.com/VSCodeVim/Vim/issues/1280)
- Inconsistencies with visual mode deletion [\#1256](https://github.com/VSCodeVim/Vim/issues/1256)
- insert after paste-before broken [\#1215](https://github.com/VSCodeVim/Vim/issues/1215)
- one file two pane is unusable, cursor reset to  [\#1205](https://github.com/VSCodeVim/Vim/issues/1205)
- Ctrl-W-h/l randomly switches cursors location [\#1051](https://github.com/VSCodeVim/Vim/issues/1051)
- Range mode for visual selection is highlighted in vim command line [\#792](https://github.com/VSCodeVim/Vim/issues/792)
- v/ [\#298](https://github.com/VSCodeVim/Vim/issues/298)

**Merged pull requests:**

- Changes tabs to navigate inside the same split [\#1677](https://github.com/VSCodeVim/Vim/pull/1677) ([vinicio](https://github.com/vinicio))
- clean up tests. increase timeout [\#1672](https://github.com/VSCodeVim/Vim/pull/1672) ([jpoon](https://github.com/jpoon))
- Fixes \#1585: Added \<C-w\> j and \<C-w\> k [\#1666](https://github.com/VSCodeVim/Vim/pull/1666) ([Chillee](https://github.com/Chillee))
- Add :close support based on :quit [\#1665](https://github.com/VSCodeVim/Vim/pull/1665) ([mspaulding06](https://github.com/mspaulding06))
- Fixes \#1280: Pasting over selection doesn't yank deleted section [\#1651](https://github.com/VSCodeVim/Vim/pull/1651) ([Chillee](https://github.com/Chillee))
- Fixes \#1535, \#1467, \#1311: D-d doesn't work in insert mode [\#1631](https://github.com/VSCodeVim/Vim/pull/1631) ([Chillee](https://github.com/Chillee))

## [v0.7.0](https://github.com/VSCodeVim/Vim/tree/v0.7.0) (2017-05-05)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.6.20...v0.7.0)

**Closed issues:**

- set { "vim.statusBarColorControl": true } does not work in vscode 1.12.1 [\#1650](https://github.com/VSCodeVim/Vim/issues/1650)
- BUG: ctrl-e / ctrl-y stop working when cursor is at top/bottom of file [\#1645](https://github.com/VSCodeVim/Vim/issues/1645)
- Command Mode z- does not work [\#1638](https://github.com/VSCodeVim/Vim/issues/1638)
- Command mode z\<CR\> does not work [\#1637](https://github.com/VSCodeVim/Vim/issues/1637)
- Circumflex key does not move the cursor to the first non blank character of the current line. [\#1636](https://github.com/VSCodeVim/Vim/issues/1636)
- diw on trailing whitespace deletes newline [\#1630](https://github.com/VSCodeVim/Vim/issues/1630)
- easymotion 'b' start of word backwords shows undefined marker for large files [\#1627](https://github.com/VSCodeVim/Vim/issues/1627)
- Search for visual mode selected text [\#1623](https://github.com/VSCodeVim/Vim/issues/1623)
- Unknown configuaration setting when visualstar [\#1622](https://github.com/VSCodeVim/Vim/issues/1622)
- Don't scroll right when visually selecting and moving to long lines [\#1609](https://github.com/VSCodeVim/Vim/issues/1609)
- TypeError: Cannot read property 'selections' of undefined when running my own extension tests [\#1607](https://github.com/VSCodeVim/Vim/issues/1607)
- Can't comment with Ctrl+k, Ctrl+c on Visual Mode [\#1606](https://github.com/VSCodeVim/Vim/issues/1606)
- . doesn't work in a macro [\#1599](https://github.com/VSCodeVim/Vim/issues/1599)
- Undo is lost when switch tab [\#1597](https://github.com/VSCodeVim/Vim/issues/1597)
- First and last line are not copied when selecting a line and then moving upward, then hitting Cmd+C [\#1594](https://github.com/VSCodeVim/Vim/issues/1594)
- Linewise visual mode `:sort` not supported [\#1592](https://github.com/VSCodeVim/Vim/issues/1592)
- Ctrl+A and Ctrl+X when cursor placed after only number [\#1588](https://github.com/VSCodeVim/Vim/issues/1588)
- Not to Open the folding when I move cross with j/k [\#1587](https://github.com/VSCodeVim/Vim/issues/1587)
- Search doesn't match new lines [\#1575](https://github.com/VSCodeVim/Vim/issues/1575)
- `statusBarColors` modifies workspace `settings.json` [\#1565](https://github.com/VSCodeVim/Vim/issues/1565)
- column not set properly after goto definition [\#1532](https://github.com/VSCodeVim/Vim/issues/1532)
- ctrl+m or ctrl+j to insert \<enter\> with insert mode. [\#1505](https://github.com/VSCodeVim/Vim/issues/1505)
- 'u' cannot undo changes if the foucs on the current tab has been switched out and back. [\#1503](https://github.com/VSCodeVim/Vim/issues/1503)
- Copying text by selecting it from right to left drops the last letter from the copied text [\#1441](https://github.com/VSCodeVim/Vim/issues/1441)
- Issue with visual line select mode and 'gj' [\#1377](https://github.com/VSCodeVim/Vim/issues/1377)
- Multi line remove with backspace is only removing first occurrence [\#1358](https://github.com/VSCodeVim/Vim/issues/1358)
- Copying backwards in insert mode doesn't work. [\#1355](https://github.com/VSCodeVim/Vim/issues/1355)
- cit for embedded html tag [\#1300](https://github.com/VSCodeVim/Vim/issues/1300)
- Reformatting with "gq" always adds 1 column of whitespace before formatted block [\#1251](https://github.com/VSCodeVim/Vim/issues/1251)
- tag movement commands are single line only [\#1232](https://github.com/VSCodeVim/Vim/issues/1232)
- Toggle activity bar visibility will change `normal` mode to `insert` mode [\#1230](https://github.com/VSCodeVim/Vim/issues/1230)
- Support U/u in visual modes [\#1229](https://github.com/VSCodeVim/Vim/issues/1229)
- Using "." in a macro causes the macro to execute forever [\#1216](https://github.com/VSCodeVim/Vim/issues/1216)
- i\_CTRL-W should delete Tabs at first [\#1137](https://github.com/VSCodeVim/Vim/issues/1137)
- \[cd\]it inside of tag which includes another empty tag [\#1108](https://github.com/VSCodeVim/Vim/issues/1108)
- Deleting or changing multi-line tag blocks does not work [\#971](https://github.com/VSCodeVim/Vim/issues/971)
- Visual Movement does very weird things with visual selection [\#890](https://github.com/VSCodeVim/Vim/issues/890)
- Blank lines created by o then esc are filled with trailing whitespace [\#849](https://github.com/VSCodeVim/Vim/issues/849)

**Merged pull requests:**

- Join HTML on single line to prevent extraneous \<br\>s [\#1643](https://github.com/VSCodeVim/Vim/pull/1643) ([cobbweb](https://github.com/cobbweb))
- Refactor [\#1642](https://github.com/VSCodeVim/Vim/pull/1642) ([rebornix](https://github.com/rebornix))
- Fixes \#1637, \#1638: z- and z\<CR\> movements [\#1640](https://github.com/VSCodeVim/Vim/pull/1640) ([Chillee](https://github.com/Chillee))
- Fixes \#1503: Undo history isn't kept when switching tabs [\#1629](https://github.com/VSCodeVim/Vim/pull/1629) ([Chillee](https://github.com/Chillee))
- Fixes \#1441: Ctrl-c dropping a character when selecting from right to left in insert mode [\#1628](https://github.com/VSCodeVim/Vim/pull/1628) ([Chillee](https://github.com/Chillee))
- Fixes \#1300: Fixed bug with recently submitted tag PR [\#1625](https://github.com/VSCodeVim/Vim/pull/1625) ([Chillee](https://github.com/Chillee))
- Fixes \#1137: i\_\<C-w\> deletes through whitespace at beginning of line [\#1624](https://github.com/VSCodeVim/Vim/pull/1624) ([Chillee](https://github.com/Chillee))
- Further work on tag matching \(based off of \#1454\) [\#1620](https://github.com/VSCodeVim/Vim/pull/1620) ([Chillee](https://github.com/Chillee))
- Toggle vim [\#1619](https://github.com/VSCodeVim/Vim/pull/1619) ([rebornix](https://github.com/rebornix))
- Fixes \#1588: \<C-a\> does wrong things if cursor is to the right of a number \(and there's a number on the next line\) [\#1617](https://github.com/VSCodeVim/Vim/pull/1617) ([Chillee](https://github.com/Chillee))
- Visualstar [\#1616](https://github.com/VSCodeVim/Vim/pull/1616) ([mikew](https://github.com/mikew))
- outfiles needs to be globbed [\#1615](https://github.com/VSCodeVim/Vim/pull/1615) ([jpoon](https://github.com/jpoon))
- Upgrade typescript 2.2.1-\>2.3.2. tslint 3.10.2-\>2.3.2. Fix errors [\#1614](https://github.com/VSCodeVim/Vim/pull/1614) ([jpoon](https://github.com/jpoon))
- Fix warning [\#1613](https://github.com/VSCodeVim/Vim/pull/1613) ([jpoon](https://github.com/jpoon))
- Stopped getLineMaxColumn from erroring on line 0 [\#1610](https://github.com/VSCodeVim/Vim/pull/1610) ([Chillee](https://github.com/Chillee))
- use editor from event fixes \#1607 [\#1608](https://github.com/VSCodeVim/Vim/pull/1608) ([brandoncc](https://github.com/brandoncc))
- Fixes \#1532: gd doesn't set desiredColumn properly [\#1605](https://github.com/VSCodeVim/Vim/pull/1605) ([Chillee](https://github.com/Chillee))
- Fixes \#1594: \<Copy\> drops the first and last line when selecting in visual line mode from the bottom up [\#1604](https://github.com/VSCodeVim/Vim/pull/1604) ([Chillee](https://github.com/Chillee))
- Fixes \#1575: Adds support for searching for strings with newlines [\#1603](https://github.com/VSCodeVim/Vim/pull/1603) ([Chillee](https://github.com/Chillee))
- Fix status bar color when change mode [\#1602](https://github.com/VSCodeVim/Vim/pull/1602) ([zelphir](https://github.com/zelphir))
- Made command line persistent when switching windows [\#1601](https://github.com/VSCodeVim/Vim/pull/1601) ([Chillee](https://github.com/Chillee))
- Fixes \#890, \#1377: Selection \(both visual/visualline\) is very wonky with gj and gk [\#1600](https://github.com/VSCodeVim/Vim/pull/1600) ([Chillee](https://github.com/Chillee))
- Fixes \#1251: gq always adds an extra space to beginning of block. [\#1596](https://github.com/VSCodeVim/Vim/pull/1596) ([Chillee](https://github.com/Chillee))
- Fixes \#1599: dot command doesn't work in macros [\#1595](https://github.com/VSCodeVim/Vim/pull/1595) ([Chillee](https://github.com/Chillee))
- Fixes \#1369: Change on a selection where endpoint was at beginning of line misses last character [\#1560](https://github.com/VSCodeVim/Vim/pull/1560) ([Chillee](https://github.com/Chillee))
- Add support for indent objects [\#1550](https://github.com/VSCodeVim/Vim/pull/1550) ([mikew](https://github.com/mikew))
- Navigate between view [\#1504](https://github.com/VSCodeVim/Vim/pull/1504) ([lyup](https://github.com/lyup))

## [v0.6.20](https://github.com/VSCodeVim/Vim/tree/v0.6.20) (2017-04-26)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.6.19...v0.6.20)

## [v0.6.19](https://github.com/VSCodeVim/Vim/tree/v0.6.19) (2017-04-26)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.6.18...v0.6.19)

**Closed issues:**

- Insert mode backspace in empty document causes subsequent operation to no-op [\#1573](https://github.com/VSCodeVim/Vim/issues/1573)
- yank command is surround mode with tag prompt \(yl, yw, yy, etc\) [\#1570](https://github.com/VSCodeVim/Vim/issues/1570)
- \[question\] how to jump back after 'gd' commond [\#1566](https://github.com/VSCodeVim/Vim/issues/1566)
- In Surround mode, b outputs as "\(" [\#1563](https://github.com/VSCodeVim/Vim/issues/1563)
- In Surround Mode, r outputs as "\[" [\#1562](https://github.com/VSCodeVim/Vim/issues/1562)
- Unable to unmap / unbind ctrl+shift+2 [\#1489](https://github.com/VSCodeVim/Vim/issues/1489)
- :x \(write and close\) does not work [\#1486](https://github.com/VSCodeVim/Vim/issues/1486)
- gq incorrectly handles triple-slash doc-comments [\#1449](https://github.com/VSCodeVim/Vim/issues/1449)
- Change inside with multiple pairs of brackets [\#1369](https://github.com/VSCodeVim/Vim/issues/1369)
- Debugger overrides cursor style [\#1363](https://github.com/VSCodeVim/Vim/issues/1363)
- Better support for \_ register [\#1357](https://github.com/VSCodeVim/Vim/issues/1357)
- Reformatting long lines with "gq" should reset horizontal scroll [\#1252](https://github.com/VSCodeVim/Vim/issues/1252)
- Remapped otherModes keys occasionally still do old functions instead [\#1236](https://github.com/VSCodeVim/Vim/issues/1236)
- Va{ does not work [\#1235](https://github.com/VSCodeVim/Vim/issues/1235)
- Pressing ctrl+k ctrl+s does not execute default behavior [\#1221](https://github.com/VSCodeVim/Vim/issues/1221)
- Deleting a word at the end of line might delete the EOL [\#967](https://github.com/VSCodeVim/Vim/issues/967)

**Merged pull requests:**

- Fixes \#1573: Backspace at beginning of file causes subsequent operation to nop [\#1577](https://github.com/VSCodeVim/Vim/pull/1577) ([Chillee](https://github.com/Chillee))
- Fix logo src so logo displays inside VSCode [\#1572](https://github.com/VSCodeVim/Vim/pull/1572) ([cobbweb](https://github.com/cobbweb))
- fixes \#1449 [\#1571](https://github.com/VSCodeVim/Vim/pull/1571) ([azngeoffdog](https://github.com/azngeoffdog))
- fixes \#1252 [\#1569](https://github.com/VSCodeVim/Vim/pull/1569) ([xconverge](https://github.com/xconverge))
- fixes \#1486 :wqa command [\#1568](https://github.com/VSCodeVim/Vim/pull/1568) ([xconverge](https://github.com/xconverge))
- fixes \#1357 [\#1567](https://github.com/VSCodeVim/Vim/pull/1567) ([xconverge](https://github.com/xconverge))
- Fix surround aliases [\#1564](https://github.com/VSCodeVim/Vim/pull/1564) ([xconverge](https://github.com/xconverge))

## [v0.6.18](https://github.com/VSCodeVim/Vim/tree/v0.6.18) (2017-04-24)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.6.17...v0.6.18)

**Closed issues:**

- daW breaks around word at end of line [\#1554](https://github.com/VSCodeVim/Vim/issues/1554)
- daW breaks when the cursor is on the beginning of the word [\#1553](https://github.com/VSCodeVim/Vim/issues/1553)
- Specifying CTRL keys to allow [\#1545](https://github.com/VSCodeVim/Vim/issues/1545)
- Cannot open a new untitled file with CTRL-N [\#1541](https://github.com/VSCodeVim/Vim/issues/1541)
- Reg command show Promise object instead user input [\#1539](https://github.com/VSCodeVim/Vim/issues/1539)
- Tab show indent the space according to user setting [\#1538](https://github.com/VSCodeVim/Vim/issues/1538)
- `d' in visual mode [\#1537](https://github.com/VSCodeVim/Vim/issues/1537)
- Copy after vi' is incorrect \(last character missing\) [\#1533](https://github.com/VSCodeVim/Vim/issues/1533)
- "daw" op should delete the world along with the space" [\#1528](https://github.com/VSCodeVim/Vim/issues/1528)
- :g command doesn't work as expected [\#1526](https://github.com/VSCodeVim/Vim/issues/1526)
- Deleting on a whitespace only line [\#1513](https://github.com/VSCodeVim/Vim/issues/1513)
- im extension should also follow the command dynamicly register and release patern. otherwise other extension could not use the 'type' command [\#1500](https://github.com/VSCodeVim/Vim/issues/1500)
- Copy error if the line has Chinese character  [\#1476](https://github.com/VSCodeVim/Vim/issues/1476)
- Make a big loud link to the roadmap in the readme [\#1466](https://github.com/VSCodeVim/Vim/issues/1466)
- The red circle still here after undo change [\#1464](https://github.com/VSCodeVim/Vim/issues/1464)
- Can't find file under cursor [\#1446](https://github.com/VSCodeVim/Vim/issues/1446)
- Cursor displays as in insert mode \(pipe\) after search [\#1421](https://github.com/VSCodeVim/Vim/issues/1421)
- Around Word at end of line [\#1350](https://github.com/VSCodeVim/Vim/issues/1350)
- Issue with merge conflicts in Git view and vim plugin - Cannot edit files [\#1344](https://github.com/VSCodeVim/Vim/issues/1344)
- Slow paste with useSystemClipboard [\#1299](https://github.com/VSCodeVim/Vim/issues/1299)
- Normal mode "p" command does not paste from system clipboard [\#1284](https://github.com/VSCodeVim/Vim/issues/1284)
- 'caw' at first word on line [\#1193](https://github.com/VSCodeVim/Vim/issues/1193)
- Add option to set delete to an other clipboard then yank and paste [\#1152](https://github.com/VSCodeVim/Vim/issues/1152)
- Enable key bindings in insert mode [\#1142](https://github.com/VSCodeVim/Vim/issues/1142)
- `yyp` paste garbled text when the line contains only Chinese characters and 'vim.useSystemClipboard' is on [\#1125](https://github.com/VSCodeVim/Vim/issues/1125)
- VSCode implemented manual history tracking! [\#670](https://github.com/VSCodeVim/Vim/issues/670)

**Merged pull requests:**

- update clipboardy library with windows utf-8 fix [\#1559](https://github.com/VSCodeVim/Vim/pull/1559) ([xconverge](https://github.com/xconverge))
- Fixes \#1539: Displaying values in register stops displaying anything after the newline [\#1558](https://github.com/VSCodeVim/Vim/pull/1558) ([Chillee](https://github.com/Chillee))
- Fixes \#1539: Viewing register value displays incorrectly for macros [\#1557](https://github.com/VSCodeVim/Vim/pull/1557) ([Chillee](https://github.com/Chillee))
- Fixes \#1554, \#1553: Fixed daW bugs [\#1555](https://github.com/VSCodeVim/Vim/pull/1555) ([Chillee](https://github.com/Chillee))
- Fixes \#1193, \#1350, \#967: Fixes daw bugs [\#1549](https://github.com/VSCodeVim/Vim/pull/1549) ([Chillee](https://github.com/Chillee))
- Allow users to use VSCode keybinding for remapping [\#1548](https://github.com/VSCodeVim/Vim/pull/1548) ([rebornix](https://github.com/rebornix))
- README enhancements [\#1547](https://github.com/VSCodeVim/Vim/pull/1547) ([cobbweb](https://github.com/cobbweb))
- Fixes \#1533: \<Copy\> not activating when \<C-c\> is pressed [\#1542](https://github.com/VSCodeVim/Vim/pull/1542) ([Chillee](https://github.com/Chillee))
- Fixes \#1528: daw on end of word doesn't delete properly [\#1536](https://github.com/VSCodeVim/Vim/pull/1536) ([Chillee](https://github.com/Chillee))
- Fixes \#1513: Backspace on middle of whitespace only line fails [\#1514](https://github.com/VSCodeVim/Vim/pull/1514) ([Chillee](https://github.com/Chillee))

## [v0.6.17](https://github.com/VSCodeVim/Vim/tree/v0.6.17) (2017-04-20)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.6.16...v0.6.17)

**Closed issues:**

- Counted replace broken [\#1530](https://github.com/VSCodeVim/Vim/issues/1530)
- Repeated `s` behaves incorrectly [\#1519](https://github.com/VSCodeVim/Vim/issues/1519)
- macOs copy and paste chinese will result messy code [\#1392](https://github.com/VSCodeVim/Vim/issues/1392)
- surround should be repeatable with . [\#1244](https://github.com/VSCodeVim/Vim/issues/1244)
- Multi-Cursor deletion [\#1161](https://github.com/VSCodeVim/Vim/issues/1161)
- Change status bar color based on mode [\#1056](https://github.com/VSCodeVim/Vim/issues/1056)

**Merged pull requests:**

- Allow user to change status bar color based on mode [\#1529](https://github.com/VSCodeVim/Vim/pull/1529) ([xconverge](https://github.com/xconverge))
- Fix README description for `af` [\#1522](https://github.com/VSCodeVim/Vim/pull/1522) ([esturcke](https://github.com/esturcke))
- fixes \#1519 [\#1521](https://github.com/VSCodeVim/Vim/pull/1521) ([xconverge](https://github.com/xconverge))
- make surround repeatable with dot [\#1515](https://github.com/VSCodeVim/Vim/pull/1515) ([xconverge](https://github.com/xconverge))
- \[WIP\] change system clipboard library to a newer more maintained library [\#1487](https://github.com/VSCodeVim/Vim/pull/1487) ([xconverge](https://github.com/xconverge))

## [v0.6.16](https://github.com/VSCodeVim/Vim/tree/v0.6.16) (2017-04-16)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/0.6.15...v0.6.16)

**Closed issues:**

- overrideCopy get unreadable code. [\#1510](https://github.com/VSCodeVim/Vim/issues/1510)
- It seem that there is a bug for "Insert mode". It has same appearance with the Normal mode. [\#1508](https://github.com/VSCodeVim/Vim/issues/1508)
- Keymap special keys aren't converted to lowercase [\#1507](https://github.com/VSCodeVim/Vim/issues/1507)
- EasyMotion handles are cropped [\#1501](https://github.com/VSCodeVim/Vim/issues/1501)
- Visual mode \(V\) + remapped \(j -\> gj\) doesn't select lines [\#1499](https://github.com/VSCodeVim/Vim/issues/1499)
- Remap of caps-lock to escape no longer working. [\#1497](https://github.com/VSCodeVim/Vim/issues/1497)
- The cursor will move to the end of line when select lines [\#1496](https://github.com/VSCodeVim/Vim/issues/1496)
- Add command history to VSCodeVim command line [\#1491](https://github.com/VSCodeVim/Vim/issues/1491)
- double click selection highlights extra character in visual mode [\#1488](https://github.com/VSCodeVim/Vim/issues/1488)
- Please sync rollouts and github releases [\#1483](https://github.com/VSCodeVim/Vim/issues/1483)
- Auto indent in matching brace not working in scss files [\#1482](https://github.com/VSCodeVim/Vim/issues/1482)
- Is there any way to remap the easymotion keys? [\#1481](https://github.com/VSCodeVim/Vim/issues/1481)
- Pressing 'x' multiple times freezes interface [\#1480](https://github.com/VSCodeVim/Vim/issues/1480)
- add selection to next find match \(CMD+D\) broken on macOS [\#1478](https://github.com/VSCodeVim/Vim/issues/1478)
- The multi-cursor shortcut 'gc' won't work [\#1477](https://github.com/VSCodeVim/Vim/issues/1477)
- z. command  \(redraw, current line at center of window\) does not work [\#1475](https://github.com/VSCodeVim/Vim/issues/1475)
- Holding down . completely crashes VSCodeVim [\#1463](https://github.com/VSCodeVim/Vim/issues/1463)
- 'viw' cannot select a whole word [\#1459](https://github.com/VSCodeVim/Vim/issues/1459)
- Toggle zen mode conflicts with vim commands [\#1457](https://github.com/VSCodeVim/Vim/issues/1457)
- EasyMotion up/down \(j/k\) [\#1448](https://github.com/VSCodeVim/Vim/issues/1448)
- \[Feature request\] Cut and Paste universal buffer. [\#1443](https://github.com/VSCodeVim/Vim/issues/1443)
- Remap : commands [\#1166](https://github.com/VSCodeVim/Vim/issues/1166)
- repeat inserted character/word \(e.g., 5i=\[esc\]\) not supported [\#1122](https://github.com/VSCodeVim/Vim/issues/1122)
- Actions are not being queued by TaskQueue [\#875](https://github.com/VSCodeVim/Vim/issues/875)

**Merged pull requests:**

- added cmd\_line commands to remapper [\#1516](https://github.com/VSCodeVim/Vim/pull/1516) ([xconverge](https://github.com/xconverge))
- fixes \#1507 and removes workspace settings that should not be there [\#1509](https://github.com/VSCodeVim/Vim/pull/1509) ([xconverge](https://github.com/xconverge))
- Add line comment operator [\#1506](https://github.com/VSCodeVim/Vim/pull/1506) ([fiedler](https://github.com/fiedler))
- Add 5i= or 4a- so that the previously inserted text is repeated upon exiting to normal mode [\#1495](https://github.com/VSCodeVim/Vim/pull/1495) ([xconverge](https://github.com/xconverge))
- Add ability to turn surround plugin off [\#1494](https://github.com/VSCodeVim/Vim/pull/1494) ([xconverge](https://github.com/xconverge))
- Added new style settings \(color, size, etc.\) for easymotion markers [\#1493](https://github.com/VSCodeVim/Vim/pull/1493) ([edasaki](https://github.com/edasaki))
- fixes \#1475 [\#1485](https://github.com/VSCodeVim/Vim/pull/1485) ([xconverge](https://github.com/xconverge))
- fix for double clicking a word with mouse not showing selection properly [\#1484](https://github.com/VSCodeVim/Vim/pull/1484) ([xconverge](https://github.com/xconverge))
- fix easymotion j and k [\#1474](https://github.com/VSCodeVim/Vim/pull/1474) ([xconverge](https://github.com/xconverge))

## [0.6.15](https://github.com/VSCodeVim/Vim/tree/0.6.15) (2017-04-07)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/0.6.14...0.6.15)

## [0.6.14](https://github.com/VSCodeVim/Vim/tree/0.6.14) (2017-04-07)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.6.13...0.6.14)

**Closed issues:**

- Latest update changed insert cursor [\#1473](https://github.com/VSCodeVim/Vim/issues/1473)
- Insert mode cursor is now the block instead of the pipe [\#1470](https://github.com/VSCodeVim/Vim/issues/1470)

**Merged pull requests:**

- Fix tables in roadmap [\#1469](https://github.com/VSCodeVim/Vim/pull/1469) ([xconverge](https://github.com/xconverge))
- Fix visual block mode not updating multicursor selection [\#1468](https://github.com/VSCodeVim/Vim/pull/1468) ([xconverge](https://github.com/xconverge))
- Fix type suggestion for handleKeys object [\#1465](https://github.com/VSCodeVim/Vim/pull/1465) ([abhiranjankumar00](https://github.com/abhiranjankumar00))

## [v0.6.13](https://github.com/VSCodeVim/Vim/tree/v0.6.13) (2017-04-04)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/0.6.12...v0.6.13)

**Merged pull requests:**

- fixes \#1448 [\#1462](https://github.com/VSCodeVim/Vim/pull/1462) ([xconverge](https://github.com/xconverge))
- fix multi line in 'at' and 'it' commands [\#1454](https://github.com/VSCodeVim/Vim/pull/1454) ([jrenton](https://github.com/jrenton))

## [0.6.12](https://github.com/VSCodeVim/Vim/tree/0.6.12) (2017-04-04)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.6.11...0.6.12)

**Closed issues:**

- Clicking on the active tab reverts the cursor to an i beam [\#1460](https://github.com/VSCodeVim/Vim/issues/1460)
- `ci"`, `dsb` are not repeatable with `.` [\#1456](https://github.com/VSCodeVim/Vim/issues/1456)
- g-d and g-D doesn't work. [\#1447](https://github.com/VSCodeVim/Vim/issues/1447)
- Undo/redo broke between 0.6.5 and 0.6.11 [\#1445](https://github.com/VSCodeVim/Vim/issues/1445)
- : with visual region selected should not highlight command line text [\#1444](https://github.com/VSCodeVim/Vim/issues/1444)
- `command + c` then `command + v` lead to messy words [\#1440](https://github.com/VSCodeVim/Vim/issues/1440)
- Ctrl+c in insert mode does not copy text, and unexpectedly switches to normal mode [\#1437](https://github.com/VSCodeVim/Vim/issues/1437)
- Incorrect behavior when editing with multiple cursors [\#1432](https://github.com/VSCodeVim/Vim/issues/1432)
- Inner tag "it" not working when tag has other tags in it [\#1430](https://github.com/VSCodeVim/Vim/issues/1430)
- Allow users to delegate certain keys back to vscode [\#1424](https://github.com/VSCodeVim/Vim/issues/1424)
- gUU and guu doesn't work [\#1423](https://github.com/VSCodeVim/Vim/issues/1423)
- `/` search scrolls to the top of the file even when results are found on same screen [\#1422](https://github.com/VSCodeVim/Vim/issues/1422)
- `gj` and `gk` visual lines movement operations don't preserve column place. [\#1419](https://github.com/VSCodeVim/Vim/issues/1419)
- c\[change\] d\[elete\] with f" don't work [\#1417](https://github.com/VSCodeVim/Vim/issues/1417)
- How does format work in vim plugin? [\#1415](https://github.com/VSCodeVim/Vim/issues/1415)
- How can i create custom keybindings? [\#1409](https://github.com/VSCodeVim/Vim/issues/1409)
- Count commands do not honor `otherModesKeyBindingsNonRecursive` settings [\#1378](https://github.com/VSCodeVim/Vim/issues/1378)
- Not respecting the cusor-style value [\#1356](https://github.com/VSCodeVim/Vim/issues/1356)
- This extension completely breaks the `Select All Occurrences` command [\#1312](https://github.com/VSCodeVim/Vim/issues/1312)
- Make easymotion use `searchHighlightColor` for motion placer [\#1245](https://github.com/VSCodeVim/Vim/issues/1245)
- Multi-Cursor Strange insert after deleting with Ctrl-Backspace [\#1224](https://github.com/VSCodeVim/Vim/issues/1224)
- Changing cursor position with arrows or mouse in insert does not create an undo point [\#1168](https://github.com/VSCodeVim/Vim/issues/1168)
- underline cursorstyle have no effect [\#1158](https://github.com/VSCodeVim/Vim/issues/1158)
- Simple Delete Word Does Not Work In Macros [\#1157](https://github.com/VSCodeVim/Vim/issues/1157)
- Ability to add multiple cursors with alt + mouseclick like native VSCode [\#887](https://github.com/VSCodeVim/Vim/issues/887)
- Can't add cursor above or below for multi-cursor when created with task [\#860](https://github.com/VSCodeVim/Vim/issues/860)

**Merged pull requests:**

- fixes \#1432 [\#1434](https://github.com/VSCodeVim/Vim/pull/1434) ([xconverge](https://github.com/xconverge))
- fixes \#1312 [\#1433](https://github.com/VSCodeVim/Vim/pull/1433) ([xconverge](https://github.com/xconverge))
- Change easymotion decoration colors to use searchHighlight colors [\#1431](https://github.com/VSCodeVim/Vim/pull/1431) ([xconverge](https://github.com/xconverge))
- minor cleanup to improve leader usage with \<space\> [\#1429](https://github.com/VSCodeVim/Vim/pull/1429) ([xconverge](https://github.com/xconverge))
- gUU and guu [\#1428](https://github.com/VSCodeVim/Vim/pull/1428) ([xconverge](https://github.com/xconverge))
- Allowing user to selectively disable some key combos [\#1425](https://github.com/VSCodeVim/Vim/pull/1425) ([xconverge](https://github.com/xconverge))
- Remapper cleanup key history [\#1416](https://github.com/VSCodeVim/Vim/pull/1416) ([xconverge](https://github.com/xconverge))
- fix undo points when moving around in insert with mouse or arrow keys [\#1413](https://github.com/VSCodeVim/Vim/pull/1413) ([xconverge](https://github.com/xconverge))
- update readme for plugins [\#1411](https://github.com/VSCodeVim/Vim/pull/1411) ([xconverge](https://github.com/xconverge))
- Allow users to use their own cursor style for insert from editor.cursorStyle [\#1399](https://github.com/VSCodeVim/Vim/pull/1399) ([xconverge](https://github.com/xconverge))

## [v0.6.11](https://github.com/VSCodeVim/Vim/tree/v0.6.11) (2017-03-19)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.6.10...v0.6.11)

**Closed issues:**

- Keybindings not working in 10.0.2 [\#1410](https://github.com/VSCodeVim/Vim/issues/1410)
- Motion keys {h,j,k,l} don't move more than one position upon holding down [\#1407](https://github.com/VSCodeVim/Vim/issues/1407)
- Three letter keybindings fail to match on version 0.6.6 [\#1405](https://github.com/VSCodeVim/Vim/issues/1405)
- ZZ example on the main page does not save in 1.10.2 [\#1397](https://github.com/VSCodeVim/Vim/issues/1397)
- Performance is slow [\#897](https://github.com/VSCodeVim/Vim/issues/897)

**Merged pull requests:**

- Fix comment syntax for shell commands. [\#1408](https://github.com/VSCodeVim/Vim/pull/1408) ([frewsxcv](https://github.com/frewsxcv))
- Increase timeout for some test cases in mocha [\#1379](https://github.com/VSCodeVim/Vim/pull/1379) ([xconverge](https://github.com/xconverge))

## [v0.6.10](https://github.com/VSCodeVim/Vim/tree/v0.6.10) (2017-03-18)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.6.9...v0.6.10)

**Closed issues:**

- Feature request: Support Ctrl+O Ctrl+I in command mode to navigate cursor locations [\#1253](https://github.com/VSCodeVim/Vim/issues/1253)

## [v0.6.9](https://github.com/VSCodeVim/Vim/tree/v0.6.9) (2017-03-18)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.6.7...v0.6.9)

## [v0.6.7](https://github.com/VSCodeVim/Vim/tree/v0.6.7) (2017-03-18)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.6.8...v0.6.7)

## [v0.6.8](https://github.com/VSCodeVim/Vim/tree/v0.6.8) (2017-03-18)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.6.6...v0.6.8)

**Closed issues:**

- Changing the open tab changes cursor to non-block [\#1404](https://github.com/VSCodeVim/Vim/issues/1404)

**Merged pull requests:**

- fix bracket motion behavior for use with % and a count, or \[\( and a c… [\#1406](https://github.com/VSCodeVim/Vim/pull/1406) ([xconverge](https://github.com/xconverge))
- fix for cursor not changing correctly, workaround for vscode issue [\#1402](https://github.com/VSCodeVim/Vim/pull/1402) ([xconverge](https://github.com/xconverge))

## [v0.6.6](https://github.com/VSCodeVim/Vim/tree/v0.6.6) (2017-03-17)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.6.5...v0.6.6)

**Closed issues:**

- Relative line move with remapped hjkl keys not supported [\#1233](https://github.com/VSCodeVim/Vim/issues/1233)

**Merged pull requests:**

- Use block cursor in visual & underline in replace [\#1394](https://github.com/VSCodeVim/Vim/pull/1394) ([net](https://github.com/net))
- Perform remapped commands when prefix by a number [\#1359](https://github.com/VSCodeVim/Vim/pull/1359) ([bdauria](https://github.com/bdauria))

## [v0.6.5](https://github.com/VSCodeVim/Vim/tree/v0.6.5) (2017-03-12)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.6.4...v0.6.5)

## [v0.6.4](https://github.com/VSCodeVim/Vim/tree/v0.6.4) (2017-03-12)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.6.3...v0.6.4)

**Closed issues:**

- Macro can't delete characters in some situations [\#1389](https://github.com/VSCodeVim/Vim/issues/1389)
- Macros don't repeat EscInInsertMode [\#1388](https://github.com/VSCodeVim/Vim/issues/1388)
- The 'jump to n percentage of file' function seems not working [\#1385](https://github.com/VSCodeVim/Vim/issues/1385)
- Executing a macro that runs many operators creates many undo points [\#1382](https://github.com/VSCodeVim/Vim/issues/1382)
- Find/Replace on visual block selection is not working [\#1250](https://github.com/VSCodeVim/Vim/issues/1250)

**Merged pull requests:**

- Update README.md [\#1390](https://github.com/VSCodeVim/Vim/pull/1390) ([xconverge](https://github.com/xconverge))
- fixes \#1385 % motion with a count [\#1387](https://github.com/VSCodeVim/Vim/pull/1387) ([xconverge](https://github.com/xconverge))
- fixes \#1382 [\#1386](https://github.com/VSCodeVim/Vim/pull/1386) ([xconverge](https://github.com/xconverge))

## [v0.6.3](https://github.com/VSCodeVim/Vim/tree/v0.6.3) (2017-03-11)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.6.0...v0.6.3)

**Closed issues:**

- Inserting two pairs of brackets doesn't play well with macros. [\#1384](https://github.com/VSCodeVim/Vim/issues/1384)
- Macros continue to not update cursor position [\#1383](https://github.com/VSCodeVim/Vim/issues/1383)
- Running a macro that deletes twice fails. [\#1381](https://github.com/VSCodeVim/Vim/issues/1381)
- Macro does not update cursor position [\#1380](https://github.com/VSCodeVim/Vim/issues/1380)
- Support search and replace using last search term [\#1373](https://github.com/VSCodeVim/Vim/issues/1373)
- Moving cursor across folded code should not automatically unfold [\#1371](https://github.com/VSCodeVim/Vim/issues/1371)
- when ctrl + c presses, Error copying to clipboard! [\#1365](https://github.com/VSCodeVim/Vim/issues/1365)
- Ctrl+C do not leave Insert mode [\#1354](https://github.com/VSCodeVim/Vim/issues/1354)
- Setting vim.leader in settings.json does not work: "Unknown configuration setting" [\#1353](https://github.com/VSCodeVim/Vim/issues/1353)
- collapsed code is reopened when cursor tries to move down. [\#1310](https://github.com/VSCodeVim/Vim/issues/1310)
- matching brace not deleted on backspace or ex:`x` [\#1228](https://github.com/VSCodeVim/Vim/issues/1228)
- Search history and change list navigation require an extra press at the first and last index [\#1188](https://github.com/VSCodeVim/Vim/issues/1188)
- Keybindings configuration is only active for 1 second after any other keystroke [\#1163](https://github.com/VSCodeVim/Vim/issues/1163)
- Delete command sometimes not triggering in macros [\#1091](https://github.com/VSCodeVim/Vim/issues/1091)
- o and O on indented line provide wrong indent / strip character [\#862](https://github.com/VSCodeVim/Vim/issues/862)

**Merged pull requests:**

- fixes \#1373 [\#1374](https://github.com/VSCodeVim/Vim/pull/1374) ([xconverge](https://github.com/xconverge))
- Remove log file. [\#1368](https://github.com/VSCodeVim/Vim/pull/1368) ([frewsxcv](https://github.com/frewsxcv))
- Remove our modified older typings [\#1367](https://github.com/VSCodeVim/Vim/pull/1367) ([xconverge](https://github.com/xconverge))
- \[WIP\] fix travis due to double digit version numbers [\#1366](https://github.com/VSCodeVim/Vim/pull/1366) ([xconverge](https://github.com/xconverge))
- Fixed numbered registered macros from overwriting themselves [\#1362](https://github.com/VSCodeVim/Vim/pull/1362) ([xconverge](https://github.com/xconverge))
- Update config options without restarting [\#1361](https://github.com/VSCodeVim/Vim/pull/1361) ([xconverge](https://github.com/xconverge))
- Index fixes [\#1190](https://github.com/VSCodeVim/Vim/pull/1190) ([xconverge](https://github.com/xconverge))

## [v0.6.0](https://github.com/VSCodeVim/Vim/tree/v0.6.0) (2017-03-03)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.5.3...v0.6.0)

**Closed issues:**

- Last character missing when using ve -\> copy to clipboard [\#1347](https://github.com/VSCodeVim/Vim/issues/1347)
- v\_D command is not supported [\#1345](https://github.com/VSCodeVim/Vim/issues/1345)
- Travis build fails on other branches [\#1343](https://github.com/VSCodeVim/Vim/issues/1343)
- :sort not supported [\#1341](https://github.com/VSCodeVim/Vim/issues/1341)
- vi" \(as well as others\), not selecting the last character [\#1337](https://github.com/VSCodeVim/Vim/issues/1337)
- surround adding spaces when changing from double to single quote [\#1336](https://github.com/VSCodeVim/Vim/issues/1336)
- Build fail when trying to launch extension from debugger [\#1329](https://github.com/VSCodeVim/Vim/issues/1329)
- Markdown preview jumps after every keystroke \(insert mode\). [\#1328](https://github.com/VSCodeVim/Vim/issues/1328)
- Text input between quotes is slow [\#1327](https://github.com/VSCodeVim/Vim/issues/1327)
- VisualMode selection off by one [\#1321](https://github.com/VSCodeVim/Vim/issues/1321)
- gg goes to first character in line instead of first non-blank character [\#1320](https://github.com/VSCodeVim/Vim/issues/1320)
- Clicking in Insert Mode changes view [\#1319](https://github.com/VSCodeVim/Vim/issues/1319)
- r\<tab\> inserts "\<tab\>" instead of "\t" [\#1318](https://github.com/VSCodeVim/Vim/issues/1318)
- Feature: Support ctrl-w q in normal mode to quit window [\#1315](https://github.com/VSCodeVim/Vim/issues/1315)
- The VSCodeVim ext doesn't work when launching in a tmux session via CLI [\#1314](https://github.com/VSCodeVim/Vim/issues/1314)
- Surround not work correctly if selected backwards [\#1313](https://github.com/VSCodeVim/Vim/issues/1313)
- c deletes first element of line [\#1302](https://github.com/VSCodeVim/Vim/issues/1302)
- Surround replacement of quotes adds unwanted whitespace [\#1298](https://github.com/VSCodeVim/Vim/issues/1298)
- deleting with D on visual selection doesn't work as expected [\#1294](https://github.com/VSCodeVim/Vim/issues/1294)
- Insert-Normal Mode moves cursor by one [\#1293](https://github.com/VSCodeVim/Vim/issues/1293)
- Ex commands not working as in gvim when operating over a selection [\#1292](https://github.com/VSCodeVim/Vim/issues/1292)
- Relative line number wasn't updated in Visual Line mode up direction\('k' key\) [\#1290](https://github.com/VSCodeVim/Vim/issues/1290)
- `cc` doesn't clear whitespace on a blank line [\#1285](https://github.com/VSCodeVim/Vim/issues/1285)
- Parentheses motion \(%\) does not work in VISUAL\_LINE\_MODE [\#1281](https://github.com/VSCodeVim/Vim/issues/1281)
- Surround does not behave as it should in a few cases [\#1255](https://github.com/VSCodeVim/Vim/issues/1255)
- problem with the Chinese input  [\#1243](https://github.com/VSCodeVim/Vim/issues/1243)
- Auto-deletion of brackets [\#1231](https://github.com/VSCodeVim/Vim/issues/1231)
- Inserting a single \) is not repeatable with . [\#1226](https://github.com/VSCodeVim/Vim/issues/1226)
- minor: '\<,'\> is selected when entering command mode from visual mode [\#1207](https://github.com/VSCodeVim/Vim/issues/1207)
- go to definition changes file, but then pressing motion key causes jump to last/previous cursor position in target file [\#1201](https://github.com/VSCodeVim/Vim/issues/1201)
- Go to definition \(gd\) does not update vimstate cursor correctly if you jump to another file  [\#1171](https://github.com/VSCodeVim/Vim/issues/1171)
- Deleting a line randomly jumps the cursor [\#1057](https://github.com/VSCodeVim/Vim/issues/1057)
- Highlighting text between quotes via: `vi"` thing copy/pasting cuts off last letter [\#616](https://github.com/VSCodeVim/Vim/issues/616)

**Merged pull requests:**

- Fix clipboard copy [\#1349](https://github.com/VSCodeVim/Vim/pull/1349) ([johnfn](https://github.com/johnfn))
- regex match [\#1346](https://github.com/VSCodeVim/Vim/pull/1346) ([rebornix](https://github.com/rebornix))
- Add limited support for :sort [\#1342](https://github.com/VSCodeVim/Vim/pull/1342) ([jordan-heemskerk](https://github.com/jordan-heemskerk))
- Override VSCode copy command. \#1337, \#616. [\#1339](https://github.com/VSCodeVim/Vim/pull/1339) ([johnfn](https://github.com/johnfn))
- Fix \#1318 [\#1338](https://github.com/VSCodeVim/Vim/pull/1338) ([rebornix](https://github.com/rebornix))
- Fix \#1329 failing build by removing undefined in configuration.ts [\#1332](https://github.com/VSCodeVim/Vim/pull/1332) ([misoguy](https://github.com/misoguy))
- fixes \#1327 [\#1331](https://github.com/VSCodeVim/Vim/pull/1331) ([xconverge](https://github.com/xconverge))
- fixes \#1320 [\#1325](https://github.com/VSCodeVim/Vim/pull/1325) ([xconverge](https://github.com/xconverge))
- fixes \#1313 [\#1324](https://github.com/VSCodeVim/Vim/pull/1324) ([xconverge](https://github.com/xconverge))
- Add ctrl-w q action to quit current window. [\#1317](https://github.com/VSCodeVim/Vim/pull/1317) ([tail](https://github.com/tail))
- Fix lint issue. [\#1316](https://github.com/VSCodeVim/Vim/pull/1316) ([tail](https://github.com/tail))
- Fix c on line beginning\#1302 [\#1303](https://github.com/VSCodeVim/Vim/pull/1303) ([xlaech](https://github.com/xlaech))
- fixes travis with minor hack used in tests [\#1301](https://github.com/VSCodeVim/Vim/pull/1301) ([xconverge](https://github.com/xconverge))
- D in visual mode behaves like d [\#1297](https://github.com/VSCodeVim/Vim/pull/1297) ([xlaech](https://github.com/xlaech))
- Fix for \#1293 [\#1296](https://github.com/VSCodeVim/Vim/pull/1296) ([xlaech](https://github.com/xlaech))
- Update readme for some clarity on using settings [\#1295](https://github.com/VSCodeVim/Vim/pull/1295) ([xconverge](https://github.com/xconverge))
- fixes \#1290, visual block still has the same issue though [\#1291](https://github.com/VSCodeVim/Vim/pull/1291) ([xconverge](https://github.com/xconverge))
- More surround fixes [\#1289](https://github.com/VSCodeVim/Vim/pull/1289) ([xconverge](https://github.com/xconverge))

## [v0.5.3](https://github.com/VSCodeVim/Vim/tree/v0.5.3) (2017-02-12)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.5.0...v0.5.3)

**Closed issues:**

- WARN: "command 'extension.vim\_escape' not found" after VSCode 1.9.1 upgrade [\#1288](https://github.com/VSCodeVim/Vim/issues/1288)
- Autocomplete doesn't work in Java after VSCode January update [\#1283](https://github.com/VSCodeVim/Vim/issues/1283)
- Insert Mode Binding not working as expected [\#1275](https://github.com/VSCodeVim/Vim/issues/1275)
- ds{ deletes last letter of word [\#1271](https://github.com/VSCodeVim/Vim/issues/1271)
- Search for current word is inexact [\#1266](https://github.com/VSCodeVim/Vim/issues/1266)
- jump-to-line doesn't work in visual mode [\#1265](https://github.com/VSCodeVim/Vim/issues/1265)
- Implement jumplist? [\#1260](https://github.com/VSCodeVim/Vim/issues/1260)
- visual block mode's "3j" can't act [\#1258](https://github.com/VSCodeVim/Vim/issues/1258)
- Horizontal Split with `:split` [\#1257](https://github.com/VSCodeVim/Vim/issues/1257)
- Quotes - doesn't delete both empty quotes in Insert mode. [\#1241](https://github.com/VSCodeVim/Vim/issues/1241)
- It would be awesome to have the in-editor Changelog show something for this plugin [\#1240](https://github.com/VSCodeVim/Vim/issues/1240)
- Unable to yank in 0.5.0 [\#1239](https://github.com/VSCodeVim/Vim/issues/1239)
- Relative hjkl does not work in Visual Block Mode [\#1234](https://github.com/VSCodeVim/Vim/issues/1234)
- I can't get the ZZ example on the main page to work with current VS Code. [\#1222](https://github.com/VSCodeVim/Vim/issues/1222)
- Installation error - self signed certitificate [\#1203](https://github.com/VSCodeVim/Vim/issues/1203)
- EasyMotion not usable in visual mode [\#1199](https://github.com/VSCodeVim/Vim/issues/1199)
- Three-letter otherModesKeyBindingsNonRecursive remappings fail to match [\#1145](https://github.com/VSCodeVim/Vim/issues/1145)
- Bracket pairs don't get deleted when you delete the first bracket [\#1084](https://github.com/VSCodeVim/Vim/issues/1084)
- Default useCtrlKeys to true on OSX [\#595](https://github.com/VSCodeVim/Vim/issues/595)
- Make snazzy animated gifs for README [\#465](https://github.com/VSCodeVim/Vim/issues/465)

**Merged pull requests:**

- fixes \#1258 [\#1286](https://github.com/VSCodeVim/Vim/pull/1286) ([xconverge](https://github.com/xconverge))
- avoid using user remapping in test mode [\#1278](https://github.com/VSCodeVim/Vim/pull/1278) ([rufusroflpunch](https://github.com/rufusroflpunch))
- Support exact and inexact current word search [\#1277](https://github.com/VSCodeVim/Vim/pull/1277) ([rhys-vdw](https://github.com/rhys-vdw))
- fixes \#1271 [\#1274](https://github.com/VSCodeVim/Vim/pull/1274) ([xconverge](https://github.com/xconverge))
- fixes \#1199 easymotion in visual mode [\#1273](https://github.com/VSCodeVim/Vim/pull/1273) ([xconverge](https://github.com/xconverge))
- fixes \#1145 [\#1272](https://github.com/VSCodeVim/Vim/pull/1272) ([xconverge](https://github.com/xconverge))
- Delete matching bracket upon backspace [\#1267](https://github.com/VSCodeVim/Vim/pull/1267) ([rufusroflpunch](https://github.com/rufusroflpunch))
- Clearing commandList for remapped commands [\#1263](https://github.com/VSCodeVim/Vim/pull/1263) ([rufusroflpunch](https://github.com/rufusroflpunch))
- Added tag text to status bar in surround mode [\#1254](https://github.com/VSCodeVim/Vim/pull/1254) ([xconverge](https://github.com/xconverge))
- Fix autoindent when opening a line above [\#1249](https://github.com/VSCodeVim/Vim/pull/1249) ([inejge](https://github.com/inejge))
- Fixes README spelling mistake [\#1246](https://github.com/VSCodeVim/Vim/pull/1246) ([eastwood](https://github.com/eastwood))

## [v0.5.0](https://github.com/VSCodeVim/Vim/tree/v0.5.0) (2017-01-23)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.5.1...v0.5.0)

## [v0.5.1](https://github.com/VSCodeVim/Vim/tree/v0.5.1) (2017-01-23)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.4.10...v0.5.1)

**Closed issues:**

- sectional search and replace [\#1225](https://github.com/VSCodeVim/Vim/issues/1225)
- Search/replace constrained to a visual block selection is not constrained [\#1219](https://github.com/VSCodeVim/Vim/issues/1219)
- numbered register 0 is not updated in Y [\#1214](https://github.com/VSCodeVim/Vim/issues/1214)
- Visual Block Mode: Tab does not indent [\#1210](https://github.com/VSCodeVim/Vim/issues/1210)
- "when" 'vim.mode != 'Insert' key binding doesn't work as expected after restart [\#1209](https://github.com/VSCodeVim/Vim/issues/1209)
- question: how to bind key to vim command [\#1208](https://github.com/VSCodeVim/Vim/issues/1208)
- modifies key bindings but not reflected on UI [\#1204](https://github.com/VSCodeVim/Vim/issues/1204)
- Vscode vim sometimes shows tab key  \<tab\> [\#1202](https://github.com/VSCodeVim/Vim/issues/1202)
- di` does not delete between ` [\#1198](https://github.com/VSCodeVim/Vim/issues/1198)
- Pressing \<tab\> still inserts the string "\<tab\>" sometimes [\#1195](https://github.com/VSCodeVim/Vim/issues/1195)
- Setting vim.leader is not taking effect. [\#1194](https://github.com/VSCodeVim/Vim/issues/1194)
- `%` work wrong with comment inside [\#1192](https://github.com/VSCodeVim/Vim/issues/1192)
- gf should be filepath agnostic if necessary [\#1189](https://github.com/VSCodeVim/Vim/issues/1189)
- Visual Line Selection does not follow the cursor when Ctrl+U and Ctrl+D are used [\#1178](https://github.com/VSCodeVim/Vim/issues/1178)
- After update to 0.4.9, I have several issues with visual mode and backspace [\#1164](https://github.com/VSCodeVim/Vim/issues/1164)
- Plugin proposal: Surround [\#610](https://github.com/VSCodeVim/Vim/issues/610)

**Merged pull requests:**

- Surround [\#1238](https://github.com/VSCodeVim/Vim/pull/1238) ([johnfn](https://github.com/johnfn))
- Support "gf" in es6 import statements by adding the file extension [\#1227](https://github.com/VSCodeVim/Vim/pull/1227) ([aminroosta](https://github.com/aminroosta))
- fixes \#1214 [\#1217](https://github.com/VSCodeVim/Vim/pull/1217) ([Platzer](https://github.com/Platzer))

## [v0.4.10](https://github.com/VSCodeVim/Vim/tree/v0.4.10) (2016-12-22)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.4.9...v0.4.10)

**Closed issues:**

- map 'gf' to fn+f12 \(go to declaration\) [\#1184](https://github.com/VSCodeVim/Vim/issues/1184)
- Add documentation on how to map leader bindings [\#1181](https://github.com/VSCodeVim/Vim/issues/1181)
- \[Linux\] Print info/warning if xclip not installed and useSystemClipboard is true [\#1180](https://github.com/VSCodeVim/Vim/issues/1180)
- Dot command repeats last search [\#1176](https://github.com/VSCodeVim/Vim/issues/1176)
- VSCodeVim doesn't switch to block cursor in normal mode consistently. [\#1173](https://github.com/VSCodeVim/Vim/issues/1173)
- o and O behave erratically causing failing test [\#1172](https://github.com/VSCodeVim/Vim/issues/1172)
- \<2 doesn't unindents one level, not two indent levels [\#1170](https://github.com/VSCodeVim/Vim/issues/1170)
- Select Inner '\(' not working properly [\#1165](https://github.com/VSCodeVim/Vim/issues/1165)
- cursor shown incorrectly when switching file [\#1159](https://github.com/VSCodeVim/Vim/issues/1159)
- Repeat command \(.\) is scoped to a file [\#1156](https://github.com/VSCodeVim/Vim/issues/1156)
- Multi-line visual line mode selection doesn't always work with cursor keys [\#1155](https://github.com/VSCodeVim/Vim/issues/1155)
- Visual mode multi-line selection fails after some time [\#1153](https://github.com/VSCodeVim/Vim/issues/1153)
- Broken image link on VSCode extensions page [\#1149](https://github.com/VSCodeVim/Vim/issues/1149)
- Clicking past EOL on a random line when you have a visual selection active does not exit visual mode [\#1144](https://github.com/VSCodeVim/Vim/issues/1144)
- Multi cursor doesn't work with visual mode for selection. [\#1140](https://github.com/VSCodeVim/Vim/issues/1140)
- Sidebar move/select with homerow -- feature request -- [\#1138](https://github.com/VSCodeVim/Vim/issues/1138)
- Highlighting until last last non-blank character and performing an action. [\#1136](https://github.com/VSCodeVim/Vim/issues/1136)
- leader: Can't use \<space\> in "vim.leader" setting [\#1132](https://github.com/VSCodeVim/Vim/issues/1132)
- highlighting with \* asterisk [\#1130](https://github.com/VSCodeVim/Vim/issues/1130)
- Keyboard shortcuts that worked in the past do not work any longer [\#1129](https://github.com/VSCodeVim/Vim/issues/1129)
- Normal mode mappings reverting to unmapped actions \(with weird timing\) [\#1128](https://github.com/VSCodeVim/Vim/issues/1128)
- Do not want blinking cursor in insert mode [\#1127](https://github.com/VSCodeVim/Vim/issues/1127)
- Starting mouse selection at the end of the line unselects the last character [\#1087](https://github.com/VSCodeVim/Vim/issues/1087)
- Search is unique to file [\#1081](https://github.com/VSCodeVim/Vim/issues/1081)
- \[enhancement\] Go to last edit location [\#1063](https://github.com/VSCodeVim/Vim/issues/1063)
- Arrow keys and some other motions don't work as expected in visual select modes [\#1054](https://github.com/VSCodeVim/Vim/issues/1054)
- Ability to clear search [\#1053](https://github.com/VSCodeVim/Vim/issues/1053)
- Reselect-Visual \(gv\) [\#986](https://github.com/VSCodeVim/Vim/issues/986)
- Missing support for "search history" [\#657](https://github.com/VSCodeVim/Vim/issues/657)
- Other mode keybindings used incorrectly [\#625](https://github.com/VSCodeVim/Vim/issues/625)

**Merged pull requests:**

- fixes \#1132 [\#1187](https://github.com/VSCodeVim/Vim/pull/1187) ([xconverge](https://github.com/xconverge))
- fixes \#1173 [\#1186](https://github.com/VSCodeVim/Vim/pull/1186) ([xconverge](https://github.com/xconverge))
- Fixed register tests breaking due to \#1183 [\#1185](https://github.com/VSCodeVim/Vim/pull/1185) ([vikramthyagarajan](https://github.com/vikramthyagarajan))
- fixes \#1180 [\#1183](https://github.com/VSCodeVim/Vim/pull/1183) ([xconverge](https://github.com/xconverge))
- Adds documentation for adding leader bindings [\#1182](https://github.com/VSCodeVim/Vim/pull/1182) ([eastwood](https://github.com/eastwood))
- Implements Global state [\#1179](https://github.com/VSCodeVim/Vim/pull/1179) ([vikramthyagarajan](https://github.com/vikramthyagarajan))
- fixes \#1176 [\#1177](https://github.com/VSCodeVim/Vim/pull/1177) ([xconverge](https://github.com/xconverge))
- Select inner vi\( fix [\#1175](https://github.com/VSCodeVim/Vim/pull/1175) ([xconverge](https://github.com/xconverge))
- fixes \#1170 [\#1174](https://github.com/VSCodeVim/Vim/pull/1174) ([xconverge](https://github.com/xconverge))
- Fixes travis [\#1169](https://github.com/VSCodeVim/Vim/pull/1169) ([xconverge](https://github.com/xconverge))
- control key bindings respect the useCtrlKey setting [\#1151](https://github.com/VSCodeVim/Vim/pull/1151) ([xwvvvvwx](https://github.com/xwvvvvwx))
- fixes \#657 implements search history [\#1147](https://github.com/VSCodeVim/Vim/pull/1147) ([xconverge](https://github.com/xconverge))
- More click past eol o no [\#1146](https://github.com/VSCodeVim/Vim/pull/1146) ([xconverge](https://github.com/xconverge))
- Reselect visual implemented \(gv\) [\#1141](https://github.com/VSCodeVim/Vim/pull/1141) ([xconverge](https://github.com/xconverge))
- fixes \#1136 [\#1139](https://github.com/VSCodeVim/Vim/pull/1139) ([xconverge](https://github.com/xconverge))
- minor fixes for \# and \* after using :nohl [\#1134](https://github.com/VSCodeVim/Vim/pull/1134) ([xconverge](https://github.com/xconverge))
- Updated useCtrlKeys default value [\#1126](https://github.com/VSCodeVim/Vim/pull/1126) ([Mxbonn](https://github.com/Mxbonn))
- fixes \#1063 [\#1124](https://github.com/VSCodeVim/Vim/pull/1124) ([xconverge](https://github.com/xconverge))
- Fixed "d" and "D" in multicursor mode [\#1029](https://github.com/VSCodeVim/Vim/pull/1029) ([Platzer](https://github.com/Platzer))

## [v0.4.9](https://github.com/VSCodeVim/Vim/tree/v0.4.9) (2016-12-05)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.4.8...v0.4.9)

**Closed issues:**

- o\<tab\> inserts the string "\<tab\>" [\#1121](https://github.com/VSCodeVim/Vim/issues/1121)

## [v0.4.8](https://github.com/VSCodeVim/Vim/tree/v0.4.8) (2016-12-05)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.4.7...v0.4.8)

**Closed issues:**

- Holding h,j,k or l to move around results in cursor hopping back and forth [\#1120](https://github.com/VSCodeVim/Vim/issues/1120)
- VSCodeVim keeps overwriting editor.cursorBlinking to "blink" in my User settings [\#1119](https://github.com/VSCodeVim/Vim/issues/1119)
- Selecting to end of word, then pasting to clipboard, then loses the last character [\#1118](https://github.com/VSCodeVim/Vim/issues/1118)
- Remapping navigation keys no longer work [\#1116](https://github.com/VSCodeVim/Vim/issues/1116)
- Navigation problems with arrow keys [\#1115](https://github.com/VSCodeVim/Vim/issues/1115)
- Jittery motion when holding j/k/e/n down [\#534](https://github.com/VSCodeVim/Vim/issues/534)

**Merged pull requests:**

- Update readme for easymotion [\#1114](https://github.com/VSCodeVim/Vim/pull/1114) ([xconverge](https://github.com/xconverge))

## [v0.4.7](https://github.com/VSCodeVim/Vim/tree/v0.4.7) (2016-12-05)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.4.6...v0.4.7)

**Closed issues:**

- Show command in status bar as it's being entered \(showcmd\) [\#1109](https://github.com/VSCodeVim/Vim/issues/1109)
- Blink cursor only on insert mode [\#1105](https://github.com/VSCodeVim/Vim/issues/1105)
- `dit` and `cit` do not work for multi-line [\#1078](https://github.com/VSCodeVim/Vim/issues/1078)
- \>\#k and \<\#k ignore the current line when in the left-most column. [\#1058](https://github.com/VSCodeVim/Vim/issues/1058)
- Configure highlight colour [\#1052](https://github.com/VSCodeVim/Vim/issues/1052)
- Implement nohl to disable all search highlights [\#1047](https://github.com/VSCodeVim/Vim/issues/1047)
- Delete to a mark is broken [\#1042](https://github.com/VSCodeVim/Vim/issues/1042)
- Allow binding to vscode commands [\#1031](https://github.com/VSCodeVim/Vim/issues/1031)
- Ctrl-A/X targeting the wrong number in some cases [\#1030](https://github.com/VSCodeVim/Vim/issues/1030)
- Unable to remap \<Space\> [\#1028](https://github.com/VSCodeVim/Vim/issues/1028)
- Hitting backspace don't move cursor to previous indent line [\#1018](https://github.com/VSCodeVim/Vim/issues/1018)
- Deleting or changing empty tag blocks does not work [\#970](https://github.com/VSCodeVim/Vim/issues/970)
- remapping K to i\<CR\>\<Esc\> causes K to move cursor left 1 [\#923](https://github.com/VSCodeVim/Vim/issues/923)
- Visual Movement interferes with replacement [\#889](https://github.com/VSCodeVim/Vim/issues/889)
- Remapping to multiple keys [\#725](https://github.com/VSCodeVim/Vim/issues/725)
- Vim: \<kbd\>ctrl\</kbd\> + \<kbd\>d\</kbd\> doesn't work [\#679](https://github.com/VSCodeVim/Vim/issues/679)
- gq [\#648](https://github.com/VSCodeVim/Vim/issues/648)
- gd could be used on file paths [\#585](https://github.com/VSCodeVim/Vim/issues/585)
- Vim times out for insert mode key mappings [\#396](https://github.com/VSCodeVim/Vim/issues/396)

**Merged pull requests:**

- Fix minor typo [\#1113](https://github.com/VSCodeVim/Vim/pull/1113) ([xconverge](https://github.com/xconverge))
- \[WIP\] initial leader fixes [\#1112](https://github.com/VSCodeVim/Vim/pull/1112) ([xconverge](https://github.com/xconverge))
- Added more aliases for nohl [\#1111](https://github.com/VSCodeVim/Vim/pull/1111) ([xconverge](https://github.com/xconverge))
- Turns highlighting back on after nohl if you try to go to a new searc… [\#1110](https://github.com/VSCodeVim/Vim/pull/1110) ([xconverge](https://github.com/xconverge))

## [v0.4.6](https://github.com/VSCodeVim/Vim/tree/v0.4.6) (2016-12-04)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/0.4.5...v0.4.6)

## [0.4.5](https://github.com/VSCodeVim/Vim/tree/0.4.5) (2016-12-04)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.4.5...0.4.5)

**Closed issues:**

- in visual mode type e ,not end of the word [\#1107](https://github.com/VSCodeVim/Vim/issues/1107)

**Merged pull requests:**

- \[WIP\] gq [\#1106](https://github.com/VSCodeVim/Vim/pull/1106) ([johnfn](https://github.com/johnfn))

## [v0.4.5](https://github.com/VSCodeVim/Vim/tree/v0.4.5) (2016-12-02)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.4.4...v0.4.5)

**Closed issues:**

- If you press \<esc\> in Normal Mode, we should close out of any tooltips/popups [\#1104](https://github.com/VSCodeVim/Vim/issues/1104)
- Please make InsertMode mode by default for create new file. [\#1103](https://github.com/VSCodeVim/Vim/issues/1103)
- Visual mode stops working [\#1101](https://github.com/VSCodeVim/Vim/issues/1101)
- VIM emulation - Ctrl-o in insert mode does not work as expected [\#1097](https://github.com/VSCodeVim/Vim/issues/1097)
- VS Code can't search with spaces [\#1094](https://github.com/VSCodeVim/Vim/issues/1094)
- vim.scroll setting doesnt' work [\#1093](https://github.com/VSCodeVim/Vim/issues/1093)
- Word boundaries broken [\#1090](https://github.com/VSCodeVim/Vim/issues/1090)
- setting to open files in Insert mode by default [\#1088](https://github.com/VSCodeVim/Vim/issues/1088)
- gf does not work either  [\#801](https://github.com/VSCodeVim/Vim/issues/801)
- search highlight is incorrect briefly after undo [\#614](https://github.com/VSCodeVim/Vim/issues/614)
- Fix visual block selection for text objects [\#611](https://github.com/VSCodeVim/Vim/issues/611)
- view jumps when doing /x [\#582](https://github.com/VSCodeVim/Vim/issues/582)
- Deleting by paragraph removes 1 line too many [\#477](https://github.com/VSCodeVim/Vim/issues/477)

**Merged pull requests:**

- Override home key \(for pressing home in visual for example\) [\#1100](https://github.com/VSCodeVim/Vim/pull/1100) ([xconverge](https://github.com/xconverge))
- avoid syncing style back to config [\#1099](https://github.com/VSCodeVim/Vim/pull/1099) ([rebornix](https://github.com/rebornix))
- Implement open file command - Issue \#801 [\#1098](https://github.com/VSCodeVim/Vim/pull/1098) ([jamirvin](https://github.com/jamirvin))

## [v0.4.4](https://github.com/VSCodeVim/Vim/tree/v0.4.4) (2016-11-29)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.4.3...v0.4.4)

**Closed issues:**

- When disable or uninstall, Cursor remains wide-width. [\#1092](https://github.com/VSCodeVim/Vim/issues/1092)
- Need a better highlight style for light color theme [\#1086](https://github.com/VSCodeVim/Vim/issues/1086)
- It seems UseCtrlKeys doesn't work in lastest version 0.4.3 [\#1080](https://github.com/VSCodeVim/Vim/issues/1080)
- cursor stuck by typing `ctrl+w ctrl+w` [\#1079](https://github.com/VSCodeVim/Vim/issues/1079)
- Using single 'q' character for \<ESC\> binding in Insert mode removes the last typed character [\#1076](https://github.com/VSCodeVim/Vim/issues/1076)
- Switch mode turns off word wrap. [\#1075](https://github.com/VSCodeVim/Vim/issues/1075)
- \<g\> \<Arrow-Up/Down\> doesn't work [\#1073](https://github.com/VSCodeVim/Vim/issues/1073)
- Incremental search has broken. [\#1072](https://github.com/VSCodeVim/Vim/issues/1072)
- Word wrap is not persistent [\#1070](https://github.com/VSCodeVim/Vim/issues/1070)
- Please support CTRL-O {command} [\#1065](https://github.com/VSCodeVim/Vim/issues/1065)
- Selecting a text and \<Ctrl-C\> doesn't copy it to clipboard [\#1061](https://github.com/VSCodeVim/Vim/issues/1061)
- a text objects works incorrectly in nested objects [\#1049](https://github.com/VSCodeVim/Vim/issues/1049)
- ⌘ + d for editor.action.addSelectionToNextFindMatch does not work reliably [\#1024](https://github.com/VSCodeVim/Vim/issues/1024)
- vit then native pasting includes replaced last character [\#1022](https://github.com/VSCodeVim/Vim/issues/1022)
- J can't join lines more than 2. [\#909](https://github.com/VSCodeVim/Vim/issues/909)
- Cycle through autocomplete suggestions without arrows [\#908](https://github.com/VSCodeVim/Vim/issues/908)
- shift+j should join lines selected lines [\#906](https://github.com/VSCodeVim/Vim/issues/906)

**Merged pull requests:**

- Removed debug print [\#1083](https://github.com/VSCodeVim/Vim/pull/1083) ([xconverge](https://github.com/xconverge))
- Update roadmap for ctrl-o [\#1082](https://github.com/VSCodeVim/Vim/pull/1082) ([xconverge](https://github.com/xconverge))
- fixes \#1076 [\#1077](https://github.com/VSCodeVim/Vim/pull/1077) ([xconverge](https://github.com/xconverge))
- fixes \#1073 [\#1074](https://github.com/VSCodeVim/Vim/pull/1074) ([xconverge](https://github.com/xconverge))
- fixes \#1065 [\#1071](https://github.com/VSCodeVim/Vim/pull/1071) ([xconverge](https://github.com/xconverge))
- fixes \#1023 [\#1069](https://github.com/VSCodeVim/Vim/pull/1069) ([xconverge](https://github.com/xconverge))

## [v0.4.3](https://github.com/VSCodeVim/Vim/tree/v0.4.3) (2016-11-19)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.4.2...v0.4.3)

**Closed issues:**

- Support ctrl-w ctrl-w to cycle focus between open windows/editors [\#1064](https://github.com/VSCodeVim/Vim/issues/1064)
- \<Ctrl-W\> \<Arrow-Key\> doesn't work [\#1060](https://github.com/VSCodeVim/Vim/issues/1060)
- 'q' from the editor in the right pane switches editor in the left pane [\#1050](https://github.com/VSCodeVim/Vim/issues/1050)
- Use `line` as `editor.cursorstyle` in insert mode does not work anymore [\#1036](https://github.com/VSCodeVim/Vim/issues/1036)
- Vertical split should open current document in new panel by default [\#1035](https://github.com/VSCodeVim/Vim/issues/1035)
- \[End of line\] - mouse selection skip last character [\#1034](https://github.com/VSCodeVim/Vim/issues/1034)
- va{ & va} doesn't select closing brace [\#1023](https://github.com/VSCodeVim/Vim/issues/1023)
- Cmd+s enters insert mode [\#975](https://github.com/VSCodeVim/Vim/issues/975)

**Merged pull requests:**

- fixes \#1034 [\#1068](https://github.com/VSCodeVim/Vim/pull/1068) ([xconverge](https://github.com/xconverge))
- fixes \#1035 [\#1067](https://github.com/VSCodeVim/Vim/pull/1067) ([xconverge](https://github.com/xconverge))
- fixes \#1064 [\#1066](https://github.com/VSCodeVim/Vim/pull/1066) ([xconverge](https://github.com/xconverge))
- How can I fix travis failure [\#1062](https://github.com/VSCodeVim/Vim/pull/1062) ([rebornix](https://github.com/rebornix))

## [v0.4.2](https://github.com/VSCodeVim/Vim/tree/v0.4.2) (2016-11-17)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.4.1...v0.4.2)

**Closed issues:**

- use j, k for select file up and down in explorer like atom  [\#1059](https://github.com/VSCodeVim/Vim/issues/1059)
- How to close vim mode ? [\#1055](https://github.com/VSCodeVim/Vim/issues/1055)
- gv should re-select last visual selection [\#1046](https://github.com/VSCodeVim/Vim/issues/1046)
- Prepublish build fails [\#1045](https://github.com/VSCodeVim/Vim/issues/1045)
- cursor position at wrong place [\#1043](https://github.com/VSCodeVim/Vim/issues/1043)
- Can't backspace twice at end of line [\#1040](https://github.com/VSCodeVim/Vim/issues/1040)
- A\<BS\> moves cursor immediately to 0th column [\#1039](https://github.com/VSCodeVim/Vim/issues/1039)
- When lightbulb is available, backspace jumps to beginning [\#1038](https://github.com/VSCodeVim/Vim/issues/1038)
- :e autocomplete [\#1033](https://github.com/VSCodeVim/Vim/issues/1033)
- Add ctrl-c as alternative to Esc [\#1026](https://github.com/VSCodeVim/Vim/issues/1026)
- Can Visual Studio Code use Vim Plugins? [\#1025](https://github.com/VSCodeVim/Vim/issues/1025)
- Select partial content seems not work with `ctrl + u` and `ctrl + d` [\#1021](https://github.com/VSCodeVim/Vim/issues/1021)
- '=' seems not work [\#1019](https://github.com/VSCodeVim/Vim/issues/1019)
- J doesn't join lines in Visual Line Mode [\#1016](https://github.com/VSCodeVim/Vim/issues/1016)
- `ctrl+d` does not work [\#1009](https://github.com/VSCodeVim/Vim/issues/1009)
- Multicursor-insert inserts on empty lines [\#1003](https://github.com/VSCodeVim/Vim/issues/1003)

**Merged pull requests:**

- Visual block fixes to cursor position and tests [\#1044](https://github.com/VSCodeVim/Vim/pull/1044) ([xconverge](https://github.com/xconverge))
- Hide the info line in issue template [\#1037](https://github.com/VSCodeVim/Vim/pull/1037) ([octref](https://github.com/octref))
- Implemented EasyMotion plugin functionality [\#993](https://github.com/VSCodeVim/Vim/pull/993) ([Metamist](https://github.com/Metamist))

## [v0.4.1](https://github.com/VSCodeVim/Vim/tree/v0.4.1) (2016-10-31)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.4.0...v0.4.1)

**Closed issues:**

- vi\(d is incorrect by one character [\#1013](https://github.com/VSCodeVim/Vim/issues/1013)
- Add support for up arrow key to fetch latest issued commands  [\#1011](https://github.com/VSCodeVim/Vim/issues/1011)
- In Normal Mode, command+a select all and can not type x to delete [\#1000](https://github.com/VSCodeVim/Vim/issues/1000)
- "\#" key work in wrong way [\#998](https://github.com/VSCodeVim/Vim/issues/998)
- Can't navigate overloaded function selection with arrow keys [\#985](https://github.com/VSCodeVim/Vim/issues/985)
- Cursor does not preserve width when moving to shorter lines [\#983](https://github.com/VSCodeVim/Vim/issues/983)
- Making `ci{` consistent with Vim [\#982](https://github.com/VSCodeVim/Vim/issues/982)
- Switch tab removes undo ability [\#977](https://github.com/VSCodeVim/Vim/issues/977)
- Cursor getting stuck on syntax change [\#976](https://github.com/VSCodeVim/Vim/issues/976)
- Delete until the end of line \(D\) deletes the line completely if empty [\#972](https://github.com/VSCodeVim/Vim/issues/972)
- cc on empty line does not indent properly  [\#800](https://github.com/VSCodeVim/Vim/issues/800)
- Using mouse to click on other pane does not select where you click [\#794](https://github.com/VSCodeVim/Vim/issues/794)
- yank to marker \(for example y'a\) should include current line [\#697](https://github.com/VSCodeVim/Vim/issues/697)
- p\)ut following y\)ank from marked position inserts at cursor position instead of next line [\#689](https://github.com/VSCodeVim/Vim/issues/689)
- In insert mode, should remove leading spaces if \<ESC\> or \<Ctrl-c\> is pressed [\#685](https://github.com/VSCodeVim/Vim/issues/685)
- NumericString should implement negative numbers for hex when using ctrl+x past 0x0 [\#663](https://github.com/VSCodeVim/Vim/issues/663)
- r in visual block mode should work with empty lines [\#584](https://github.com/VSCodeVim/Vim/issues/584)
- vim and vscode disagree about the end of line [\#574](https://github.com/VSCodeVim/Vim/issues/574)
- Ctrl-A Handled Incorrect [\#563](https://github.com/VSCodeVim/Vim/issues/563)
- Support numbered registers [\#500](https://github.com/VSCodeVim/Vim/issues/500)

**Merged pull requests:**

- fixes \#1013 [\#1014](https://github.com/VSCodeVim/Vim/pull/1014) ([xconverge](https://github.com/xconverge))
- Update Readme [\#1012](https://github.com/VSCodeVim/Vim/pull/1012) ([jpoon](https://github.com/jpoon))
- fixes \#983 [\#1008](https://github.com/VSCodeVim/Vim/pull/1008) ([xconverge](https://github.com/xconverge))
- Make create-multicursor commands repeatable [\#1007](https://github.com/VSCodeVim/Vim/pull/1007) ([Platzer](https://github.com/Platzer))
- fix mouse clicking past EOL [\#1006](https://github.com/VSCodeVim/Vim/pull/1006) ([xconverge](https://github.com/xconverge))
- fixes \#1000 and a minor replace issue [\#1005](https://github.com/VSCodeVim/Vim/pull/1005) ([xconverge](https://github.com/xconverge))
- Update "r" for visual modes on roadmap [\#1002](https://github.com/VSCodeVim/Vim/pull/1002) ([xconverge](https://github.com/xconverge))
- fixes \#998 [\#1001](https://github.com/VSCodeVim/Vim/pull/1001) ([xconverge](https://github.com/xconverge))
- Remove fix-whitespace gulp command.  [\#999](https://github.com/VSCodeVim/Vim/pull/999) ([jpoon](https://github.com/jpoon))
- Improved performance of visual block replace by a lot [\#997](https://github.com/VSCodeVim/Vim/pull/997) ([xconverge](https://github.com/xconverge))
- fixes \#663 [\#996](https://github.com/VSCodeVim/Vim/pull/996) ([xconverge](https://github.com/xconverge))
- No need for "i" flag on a numerical only regex [\#995](https://github.com/VSCodeVim/Vim/pull/995) ([stefanoio](https://github.com/stefanoio))
- SearchState - Fixed isRegex not set on search [\#994](https://github.com/VSCodeVim/Vim/pull/994) ([Metamist](https://github.com/Metamist))
- fix \#985 [\#992](https://github.com/VSCodeVim/Vim/pull/992) ([rebornix](https://github.com/rebornix))
- Run all tests [\#990](https://github.com/VSCodeVim/Vim/pull/990) ([xconverge](https://github.com/xconverge))
- Fix for visual line behaving funky when going from bottom up [\#989](https://github.com/VSCodeVim/Vim/pull/989) ([xconverge](https://github.com/xconverge))
- Add Keymaps category [\#987](https://github.com/VSCodeVim/Vim/pull/987) ([waderyan](https://github.com/waderyan))
- fix \#982 [\#984](https://github.com/VSCodeVim/Vim/pull/984) ([rebornix](https://github.com/rebornix))
- fix \#977 [\#981](https://github.com/VSCodeVim/Vim/pull/981) ([rebornix](https://github.com/rebornix))
- fix \#689 [\#980](https://github.com/VSCodeVim/Vim/pull/980) ([rebornix](https://github.com/rebornix))
- Numbered, upper case and multicursor register [\#974](https://github.com/VSCodeVim/Vim/pull/974) ([Platzer](https://github.com/Platzer))
- remove leading spaces when \<Esc\>... is pressed \#685 [\#962](https://github.com/VSCodeVim/Vim/pull/962) ([Zzzen](https://github.com/Zzzen))
- Fix replace in visual, visual line, and visual block mode [\#953](https://github.com/VSCodeVim/Vim/pull/953) ([xconverge](https://github.com/xconverge))
- Add some tests and fix some exceptions during the tests [\#914](https://github.com/VSCodeVim/Vim/pull/914) ([xconverge](https://github.com/xconverge))

## [v0.4.0](https://github.com/VSCodeVim/Vim/tree/v0.4.0) (2016-10-24)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.3.8...v0.4.0)

**Closed issues:**

- Ctrl-v does not enter visual-block mode on macOS [\#973](https://github.com/VSCodeVim/Vim/issues/973)
- CTRL-F doe not move screen as stated in the documentation [\#969](https://github.com/VSCodeVim/Vim/issues/969)
- Readme is not showing up in the extension page or in VSCode [\#968](https://github.com/VSCodeVim/Vim/issues/968)
- Arrow keys in suggestion menu alter cursor position not the selected menu item [\#965](https://github.com/VSCodeVim/Vim/issues/965)
- Can't paste with 'p' for text copied outside of the application with ctrl-c [\#963](https://github.com/VSCodeVim/Vim/issues/963)
- No longer works in insider [\#961](https://github.com/VSCodeVim/Vim/issues/961)
- Is there a way to make yank use system clipboard [\#956](https://github.com/VSCodeVim/Vim/issues/956)
- gh keybinding doesn't seem to activate tool tip  [\#955](https://github.com/VSCodeVim/Vim/issues/955)
- Do not revealing cursor while just switching tabs [\#947](https://github.com/VSCodeVim/Vim/issues/947)
- vscodevim automatically scrolls to where cursor is when switch tabs [\#946](https://github.com/VSCodeVim/Vim/issues/946)
- backspace not working on selected items [\#940](https://github.com/VSCodeVim/Vim/issues/940)
- 2x, 2s doesn't work [\#939](https://github.com/VSCodeVim/Vim/issues/939)
- c2w only eats one word [\#937](https://github.com/VSCodeVim/Vim/issues/937)
- cannot bind "ctrl+l" to "\<Esc\>" [\#925](https://github.com/VSCodeVim/Vim/issues/925)
- replacing highlighted text with 'p' doesn't always work [\#922](https://github.com/VSCodeVim/Vim/issues/922)
- D deletes linebreak if line is empty [\#921](https://github.com/VSCodeVim/Vim/issues/921)
- Closing a tab switches to the wrong tab afterwards [\#917](https://github.com/VSCodeVim/Vim/issues/917)
- VSCode option editor.trimAutoWhitespace is ignored [\#899](https://github.com/VSCodeVim/Vim/issues/899)
- Cursor behavior is flakey with same file open in first and second panel [\#895](https://github.com/VSCodeVim/Vim/issues/895)
- Visual line indenting after selecting \>1 line is not properly repeated with '.'. [\#893](https://github.com/VSCodeVim/Vim/issues/893)
- cmd + D selection is not accurate [\#878](https://github.com/VSCodeVim/Vim/issues/878)
- Can mouse click past the EOL [\#874](https://github.com/VSCodeVim/Vim/issues/874)
- Unable to use arrow key to navigate through quick fix options [\#869](https://github.com/VSCodeVim/Vim/issues/869)
- Sync configuration with Code through API [\#867](https://github.com/VSCodeVim/Vim/issues/867)
- Auto-Release No Work-y [\#857](https://github.com/VSCodeVim/Vim/issues/857)
- Window not scrolling automatically while searching [\#848](https://github.com/VSCodeVim/Vim/issues/848)
- Align Current Line `==` [\#845](https://github.com/VSCodeVim/Vim/issues/845)
- Movement broken after jumping to symbol [\#836](https://github.com/VSCodeVim/Vim/issues/836)
- Auto-inserted characters confuse cursor index when using backspace [\#832](https://github.com/VSCodeVim/Vim/issues/832)
- \<C-r\> in search not working [\#808](https://github.com/VSCodeVim/Vim/issues/808)
- Cursor position after navigate back \(ctrl+-\) [\#802](https://github.com/VSCodeVim/Vim/issues/802)
- Clicking references that's in same file causes jumping around [\#790](https://github.com/VSCodeVim/Vim/issues/790)
- Error on Search  [\#786](https://github.com/VSCodeVim/Vim/issues/786)
- Line mode delete consumes last character in a file [\#783](https://github.com/VSCodeVim/Vim/issues/783)
- bracketedKey breaks `\<character\>` checking [\#771](https://github.com/VSCodeVim/Vim/issues/771)
- Delete then p/P doesn't paste correctly [\#693](https://github.com/VSCodeVim/Vim/issues/693)
- Ctrl-A/X not working correctly if the numbers aren't surrounded by separators [\#638](https://github.com/VSCodeVim/Vim/issues/638)
- Something wrong with the vim mode when using code autocompletion  [\#620](https://github.com/VSCodeVim/Vim/issues/620)
- Cursor inconsistent after `gd` and changing tabs [\#562](https://github.com/VSCodeVim/Vim/issues/562)
- shift+backspace should work the same as backspace in search mode [\#528](https://github.com/VSCodeVim/Vim/issues/528)
- When use /  to search, I can't use ctrl-V/cmd-V to paste search string [\#484](https://github.com/VSCodeVim/Vim/issues/484)
- Macro support [\#100](https://github.com/VSCodeVim/Vim/issues/100)

**Merged pull requests:**

- fix \#528 [\#966](https://github.com/VSCodeVim/Vim/pull/966) ([rebornix](https://github.com/rebornix))
- fix \#693 [\#964](https://github.com/VSCodeVim/Vim/pull/964) ([rebornix](https://github.com/rebornix))
- fix \#922 [\#960](https://github.com/VSCodeVim/Vim/pull/960) ([rebornix](https://github.com/rebornix))
- fix \#939 [\#958](https://github.com/VSCodeVim/Vim/pull/958) ([rebornix](https://github.com/rebornix))
-  Add a command is `D` in visual block mode. [\#957](https://github.com/VSCodeVim/Vim/pull/957) ([Kooooya](https://github.com/Kooooya))
- Add commands is `s` and `S` in visual block mode. [\#954](https://github.com/VSCodeVim/Vim/pull/954) ([Kooooya](https://github.com/Kooooya))
- fix \#808 [\#952](https://github.com/VSCodeVim/Vim/pull/952) ([rebornix](https://github.com/rebornix))
- fix \#484 [\#951](https://github.com/VSCodeVim/Vim/pull/951) ([rebornix](https://github.com/rebornix))
- fix \#921 [\#950](https://github.com/VSCodeVim/Vim/pull/950) ([rebornix](https://github.com/rebornix))
- make tab sequence feel right [\#949](https://github.com/VSCodeVim/Vim/pull/949) ([rebornix](https://github.com/rebornix))
- stop revealing cursor when not necessary [\#948](https://github.com/VSCodeVim/Vim/pull/948) ([rebornix](https://github.com/rebornix))
- add gh hover command [\#945](https://github.com/VSCodeVim/Vim/pull/945) ([will-wow](https://github.com/will-wow))
- New increment without separators [\#944](https://github.com/VSCodeVim/Vim/pull/944) ([xconverge](https://github.com/xconverge))
- fix \#937 [\#943](https://github.com/VSCodeVim/Vim/pull/943) ([rebornix](https://github.com/rebornix))
- fixes \#878 [\#942](https://github.com/VSCodeVim/Vim/pull/942) ([xconverge](https://github.com/xconverge))
- Support num registers macros [\#941](https://github.com/VSCodeVim/Vim/pull/941) ([xconverge](https://github.com/xconverge))
- Test enhancement [\#938](https://github.com/VSCodeVim/Vim/pull/938) ([rebornix](https://github.com/rebornix))
- fix \#845 [\#911](https://github.com/VSCodeVim/Vim/pull/911) ([rebornix](https://github.com/rebornix))

## [v0.3.8](https://github.com/VSCodeVim/Vim/tree/v0.3.8) (2016-10-18)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/0.3.7...v0.3.8)

**Closed issues:**

- Incompatible with system navigation keys in macOS [\#930](https://github.com/VSCodeVim/Vim/issues/930)
- Visual Mode selection doesn't work if selecting from bottom to top [\#929](https://github.com/VSCodeVim/Vim/issues/929)
- cursor movement in insert mode broken [\#926](https://github.com/VSCodeVim/Vim/issues/926)
- Home & End only pretend to move the cursor [\#924](https://github.com/VSCodeVim/Vim/issues/924)
- Cursor jumps back to last typing position after autocomplete [\#916](https://github.com/VSCodeVim/Vim/issues/916)
- Vim not enabled in non-primary window  [\#912](https://github.com/VSCodeVim/Vim/issues/912)
- J in visual mode doesn't join lines [\#910](https://github.com/VSCodeVim/Vim/issues/910)
- Cannot read property 'dispose' of undefined [\#905](https://github.com/VSCodeVim/Vim/issues/905)
- . operator only works once with cw [\#904](https://github.com/VSCodeVim/Vim/issues/904)
- \>\< lost multiple lines selection  [\#903](https://github.com/VSCodeVim/Vim/issues/903)
- Cannot use backspace to delete selected text in INSERT MODE [\#879](https://github.com/VSCodeVim/Vim/issues/879)
- `:reg` without selecting particular register gives `undefined` [\#830](https://github.com/VSCodeVim/Vim/issues/830)
- Repeated search of the same text doesn't work [\#652](https://github.com/VSCodeVim/Vim/issues/652)

**Merged pull requests:**

- fixes \#879 [\#933](https://github.com/VSCodeVim/Vim/pull/933) ([xconverge](https://github.com/xconverge))
- fixes \#905 [\#932](https://github.com/VSCodeVim/Vim/pull/932) ([xconverge](https://github.com/xconverge))
- fixes \#652 [\#931](https://github.com/VSCodeVim/Vim/pull/931) ([xconverge](https://github.com/xconverge))
- Update internal cursor position when necessary [\#927](https://github.com/VSCodeVim/Vim/pull/927) ([rebornix](https://github.com/rebornix))
- Draw multicursor correctly in Visual Mode [\#920](https://github.com/VSCodeVim/Vim/pull/920) ([Platzer](https://github.com/Platzer))
- update internal cursor position per Code selection change [\#919](https://github.com/VSCodeVim/Vim/pull/919) ([rebornix](https://github.com/rebornix))
- display register value in reg-cmd, fix \#830 [\#915](https://github.com/VSCodeVim/Vim/pull/915) ([Platzer](https://github.com/Platzer))
- \[Post 1.0\] Two way syncing of Vim and Code's configuration [\#913](https://github.com/VSCodeVim/Vim/pull/913) ([rebornix](https://github.com/rebornix))
- Macro [\#894](https://github.com/VSCodeVim/Vim/pull/894) ([rebornix](https://github.com/rebornix))

## [0.3.7](https://github.com/VSCodeVim/Vim/tree/0.3.7) (2016-10-12)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/0.3.6...0.3.7)

**Closed issues:**

- Visual selection does not work with the "go to matching brace" % command. [\#901](https://github.com/VSCodeVim/Vim/issues/901)
- When you click on a panel you're not focused on, the cursor position goes to the last cursor position rather than the location of the click. [\#896](https://github.com/VSCodeVim/Vim/issues/896)
- Indenting in visual line mode then dot [\#892](https://github.com/VSCodeVim/Vim/issues/892)
- `r` replacement of character not working on EOL [\#888](https://github.com/VSCodeVim/Vim/issues/888)
- cis does strange things [\#884](https://github.com/VSCodeVim/Vim/issues/884)
- Shift+j followed by x deletes character at end of line [\#882](https://github.com/VSCodeVim/Vim/issues/882)
- Pressing 'k' after pasting a line jumps up two lines [\#877](https://github.com/VSCodeVim/Vim/issues/877)
- Holding down ~ does not capitalise characters in sequence [\#876](https://github.com/VSCodeVim/Vim/issues/876)
- \>\> makes you go in visual mode for some reason [\#872](https://github.com/VSCodeVim/Vim/issues/872)
- Extension messes with VS Codes 'Go to defintion' [\#856](https://github.com/VSCodeVim/Vim/issues/856)
- Left and right arrow keys navigate past EOL and beginning of line in insert [\#839](https://github.com/VSCodeVim/Vim/issues/839)
- . does not work correctly with visual block selections [\#699](https://github.com/VSCodeVim/Vim/issues/699)
- Ctrl+F moves cursor down but does not scroll editor [\#676](https://github.com/VSCodeVim/Vim/issues/676)
- Ctrl+D appears to scroll more than half window lines downwards \(same as Ctrl+F?\) [\#675](https://github.com/VSCodeVim/Vim/issues/675)
- Count does not work for scroll commands [\#673](https://github.com/VSCodeVim/Vim/issues/673)
- dot '.' should repeat last edit actions and not repeat navigation commands [\#669](https://github.com/VSCodeVim/Vim/issues/669)
- Give us feedback: Vim keybindings in debugging console [\#666](https://github.com/VSCodeVim/Vim/issues/666)
- Left over 'j' when using '.' to repeat a command [\#617](https://github.com/VSCodeVim/Vim/issues/617)
- L \(in normal mode\) move cursor to bottom-line + 1 [\#606](https://github.com/VSCodeVim/Vim/issues/606)
- Plugins for VSCodeVim [\#590](https://github.com/VSCodeVim/Vim/issues/590)
- . should repeat autocomplete actions [\#402](https://github.com/VSCodeVim/Vim/issues/402)

**Merged pull requests:**

- fixes \#888 [\#902](https://github.com/VSCodeVim/Vim/pull/902) ([xconverge](https://github.com/xconverge))
- fixes \#882 [\#900](https://github.com/VSCodeVim/Vim/pull/900) ([xconverge](https://github.com/xconverge))

## [0.3.6](https://github.com/VSCodeVim/Vim/tree/0.3.6) (2016-10-12)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/0.3.5...0.3.6)

**Closed issues:**

- wrong caret shape in insert mode [\#898](https://github.com/VSCodeVim/Vim/issues/898)
- shift-Y does not work in visual line mode or visual block mode [\#886](https://github.com/VSCodeVim/Vim/issues/886)
- exit from insert mode after typing anything [\#883](https://github.com/VSCodeVim/Vim/issues/883)
- C-c does not work in Insert Mode [\#881](https://github.com/VSCodeVim/Vim/issues/881)
- Split editor/file editing broken [\#868](https://github.com/VSCodeVim/Vim/issues/868)
- Cursor location problem when using with Auto Close Tag [\#858](https://github.com/VSCodeVim/Vim/issues/858)
- ctrl+h doesn't work in insert mode [\#829](https://github.com/VSCodeVim/Vim/issues/829)
- Add a setting to toggle whether \<Esc\> closes autocomplete in insert mode. [\#826](https://github.com/VSCodeVim/Vim/issues/826)

**Merged pull requests:**

- allow remapping of ctrl-j and ctrl-k in settings.json [\#891](https://github.com/VSCodeVim/Vim/pull/891) ([xwvvvvwx](https://github.com/xwvvvvwx))
- Fix visual block x [\#861](https://github.com/VSCodeVim/Vim/pull/861) ([xconverge](https://github.com/xconverge))

## [0.3.5](https://github.com/VSCodeVim/Vim/tree/0.3.5) (2016-10-10)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/0.3.4...0.3.5)

## [0.3.4](https://github.com/VSCodeVim/Vim/tree/0.3.4) (2016-10-10)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/0.3.3...0.3.4)

**Closed issues:**

- First two letters get swapped on empty file [\#871](https://github.com/VSCodeVim/Vim/issues/871)
- When you insert a lot of keys quickly, some characters get inserted AFTER the cursor position [\#870](https://github.com/VSCodeVim/Vim/issues/870)
- Cannot use mouse selection after entering INSERT MODE [\#866](https://github.com/VSCodeVim/Vim/issues/866)
- Mapping capslock to esc has issues [\#854](https://github.com/VSCodeVim/Vim/issues/854)
- Sometimes pressing \<tab\> inserts the literal string "\<tab\>" [\#831](https://github.com/VSCodeVim/Vim/issues/831)

**Merged pull requests:**

- Remove unused modehandlers when tabs are closed [\#865](https://github.com/VSCodeVim/Vim/pull/865) ([xconverge](https://github.com/xconverge))
- Insert Previous text [\#768](https://github.com/VSCodeVim/Vim/pull/768) ([rebornix](https://github.com/rebornix))

## [0.3.3](https://github.com/VSCodeVim/Vim/tree/0.3.3) (2016-10-08)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/0.3.2...0.3.3)

## [0.3.2](https://github.com/VSCodeVim/Vim/tree/0.3.2) (2016-10-08)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.3.1...0.3.2)

**Closed issues:**

- VSCode RelativeNumbers \(new feature\) doesn't work with Vim extension [\#844](https://github.com/VSCodeVim/Vim/issues/844)

## [v0.3.1](https://github.com/VSCodeVim/Vim/tree/v0.3.1) (2016-10-08)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.3.0...v0.3.1)

**Closed issues:**

- Holding down ESC causes the cursor to move left. [\#853](https://github.com/VSCodeVim/Vim/issues/853)
- j and k work incorrectly when tabs are used for indentation [\#850](https://github.com/VSCodeVim/Vim/issues/850)
- Multiple presses of Esc move cursor to the left [\#847](https://github.com/VSCodeVim/Vim/issues/847)
- Closing Default Settings window with :q doesn't work [\#846](https://github.com/VSCodeVim/Vim/issues/846)
- In Insert mode cannot got to end of line with \<End\> key [\#841](https://github.com/VSCodeVim/Vim/issues/841)
- Ctrl-c going to prev char in normal mode [\#834](https://github.com/VSCodeVim/Vim/issues/834)
- ESC moves cursor backwards in Normal mode [\#825](https://github.com/VSCodeVim/Vim/issues/825)
- Home in visual line selection doesn't move cursor. [\#784](https://github.com/VSCodeVim/Vim/issues/784)
- Screen delay when J,k keys is down [\#687](https://github.com/VSCodeVim/Vim/issues/687)

**Merged pull requests:**

- Unnecessary quit check on untitled files [\#855](https://github.com/VSCodeVim/Vim/pull/855) ([xconverge](https://github.com/xconverge))
- Add new logo icon [\#852](https://github.com/VSCodeVim/Vim/pull/852) ([kevincoleman](https://github.com/kevincoleman))
- Fixes arrow navigation to EOL while in insert [\#838](https://github.com/VSCodeVim/Vim/pull/838) ([xconverge](https://github.com/xconverge))
- fixes \#832 [\#837](https://github.com/VSCodeVim/Vim/pull/837) ([xconverge](https://github.com/xconverge))
- \[WIP\] Use new transformation style in delete and paste [\#835](https://github.com/VSCodeVim/Vim/pull/835) ([johnfn](https://github.com/johnfn))
- X eats eol [\#827](https://github.com/VSCodeVim/Vim/pull/827) ([xconverge](https://github.com/xconverge))
- Fix to allow A while in visual mode [\#816](https://github.com/VSCodeVim/Vim/pull/816) ([xconverge](https://github.com/xconverge))
- Fix issue where could not use I while in visual mode [\#815](https://github.com/VSCodeVim/Vim/pull/815) ([xconverge](https://github.com/xconverge))
- fixes \#784 [\#814](https://github.com/VSCodeVim/Vim/pull/814) ([xconverge](https://github.com/xconverge))

## [v0.3.0](https://github.com/VSCodeVim/Vim/tree/v0.3.0) (2016-10-03)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.2.0...v0.3.0)

**Closed issues:**

- cursor not jumping up when page scrolled to the top using ctrl-d [\#823](https://github.com/VSCodeVim/Vim/issues/823)
- mouse select past end of line + 'x' joins lines in stead of deleting last character [\#822](https://github.com/VSCodeVim/Vim/issues/822)
- Add :vs ex mode command as a synonym for :vsplit [\#817](https://github.com/VSCodeVim/Vim/issues/817)
- System clipboard register does not work on Linux [\#809](https://github.com/VSCodeVim/Vim/issues/809)
- \<C-c\> get printed out in R [\#806](https://github.com/VSCodeVim/Vim/issues/806)
- \<ESC\> in auto complete mode exits insert mode [\#804](https://github.com/VSCodeVim/Vim/issues/804)
- Can't select and delete [\#803](https://github.com/VSCodeVim/Vim/issues/803)
- cw does not terminate the current word at the end of whitespace [\#798](https://github.com/VSCodeVim/Vim/issues/798)
- J takes next line spaces [\#797](https://github.com/VSCodeVim/Vim/issues/797)
- Go-to-line works only when you invoke it twice or more [\#795](https://github.com/VSCodeVim/Vim/issues/795)
- vscode locks up when replaying change on mouse selected position [\#793](https://github.com/VSCodeVim/Vim/issues/793)
- Change of indentation level in visual line mode is not repeatable [\#791](https://github.com/VSCodeVim/Vim/issues/791)
- Add "+ register for accessing the clipboard [\#780](https://github.com/VSCodeVim/Vim/issues/780)
- Inccorect behavior when deleting brackets with d% [\#778](https://github.com/VSCodeVim/Vim/issues/778)
- n-Y, to copy n lines into buffer, copies only one line [\#741](https://github.com/VSCodeVim/Vim/issues/741)
- cw doesn't work on empty line [\#739](https://github.com/VSCodeVim/Vim/issues/739)
- . operator hangs VSCode on 0.1.8 [\#707](https://github.com/VSCodeVim/Vim/issues/707)
- Referencing Mark in VIM SED command fails to apply command correctly [\#631](https://github.com/VSCodeVim/Vim/issues/631)
- In visual line mode, vscv often reports that is actually in visual mode [\#618](https://github.com/VSCodeVim/Vim/issues/618)
- cw on "1," deletes the comma as well as the 1 [\#605](https://github.com/VSCodeVim/Vim/issues/605)
- dt; doesn't work. [\#604](https://github.com/VSCodeVim/Vim/issues/604)
- zz should work in visual mode [\#603](https://github.com/VSCodeVim/Vim/issues/603)
- J bug [\#557](https://github.com/VSCodeVim/Vim/issues/557)
- Make actions \(more\) pure [\#520](https://github.com/VSCodeVim/Vim/issues/520)
- :\<n\> does not \(visually\) move cursor to line n [\#485](https://github.com/VSCodeVim/Vim/issues/485)
- Insert-mode selections do not work [\#479](https://github.com/VSCodeVim/Vim/issues/479)
- '\*' and '\#' should search whole word [\#429](https://github.com/VSCodeVim/Vim/issues/429)
- Multiple selections do not work as expected [\#417](https://github.com/VSCodeVim/Vim/issues/417)
- allow different keys to trigger same action [\#278](https://github.com/VSCodeVim/Vim/issues/278)
- scroll-cursor commands \(zt, zb\) don't work [\#210](https://github.com/VSCodeVim/Vim/issues/210)

**Merged pull requests:**

- Show debug console when session launches [\#821](https://github.com/VSCodeVim/Vim/pull/821) ([xconverge](https://github.com/xconverge))
- zz in visual, visualline, and visual block mode [\#820](https://github.com/VSCodeVim/Vim/pull/820) ([xconverge](https://github.com/xconverge))
- Fixes \#817 [\#819](https://github.com/VSCodeVim/Vim/pull/819) ([xconverge](https://github.com/xconverge))
- Clean up typings [\#818](https://github.com/VSCodeVim/Vim/pull/818) ([jpoon](https://github.com/jpoon))
- Updated documentation for linux system clipboard use [\#813](https://github.com/VSCodeVim/Vim/pull/813) ([xconverge](https://github.com/xconverge))
- Multi-Cursor Mode v 2.0 [\#811](https://github.com/VSCodeVim/Vim/pull/811) ([johnfn](https://github.com/johnfn))
- Fix docs [\#807](https://github.com/VSCodeVim/Vim/pull/807) ([jpoon](https://github.com/jpoon))
- Fix bug joining lines with whitespace only next line [\#799](https://github.com/VSCodeVim/Vim/pull/799) ([mleech](https://github.com/mleech))
- Add autoindent to README, fix hlsearch default [\#796](https://github.com/VSCodeVim/Vim/pull/796) ([srenatus](https://github.com/srenatus))
- Support "+ system clipboard register \(\#780\) [\#782](https://github.com/VSCodeVim/Vim/pull/782) ([bdchauvette](https://github.com/bdchauvette))
- fixes \#739 [\#767](https://github.com/VSCodeVim/Vim/pull/767) ([xconverge](https://github.com/xconverge))

## [v0.2.0](https://github.com/VSCodeVim/Vim/tree/v0.2.0) (2016-09-21)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.1.11...v0.2.0)

**Closed issues:**

- s/a/b/g does not work in visual block mode [\#762](https://github.com/VSCodeVim/Vim/issues/762)
- Using vim command line to edit file uses incorrect path [\#746](https://github.com/VSCodeVim/Vim/issues/746)
- Keybindings Description [\#738](https://github.com/VSCodeVim/Vim/issues/738)
- J on lines ending with spaces leave cursor in wrong place [\#701](https://github.com/VSCodeVim/Vim/issues/701)
- options for Fold [\#531](https://github.com/VSCodeVim/Vim/issues/531)
- Move screen line or character [\#511](https://github.com/VSCodeVim/Vim/issues/511)
- Throw exceptions when run `ca\( with no {}` test case [\#474](https://github.com/VSCodeVim/Vim/issues/474)
- Vim stops working unexpectedly \(issues collection\) [\#458](https://github.com/VSCodeVim/Vim/issues/458)

## [v0.1.11](https://github.com/VSCodeVim/Vim/tree/v0.1.11) (2016-09-20)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.1.10...v0.1.11)

**Closed issues:**

- Cursor keys not working in popups [\#785](https://github.com/VSCodeVim/Vim/issues/785)
- empty line after 'ddp' [\#781](https://github.com/VSCodeVim/Vim/issues/781)
- Incorrect pair of brackets highlighted with blockcursor [\#777](https://github.com/VSCodeVim/Vim/issues/777)
- Shifting in insert mode [\#774](https://github.com/VSCodeVim/Vim/issues/774)
- \[Feature Request\] Save new files via :w [\#773](https://github.com/VSCodeVim/Vim/issues/773)
- \<number\>G hangs vim plugin if file is not long enough [\#772](https://github.com/VSCodeVim/Vim/issues/772)
- \[Feature Request\] Implement qall to close all files. [\#769](https://github.com/VSCodeVim/Vim/issues/769)
- y\(n\)j/y\(n\)k copies from the cursor instead of copying the whole current line [\#764](https://github.com/VSCodeVim/Vim/issues/764)
- Shift+backspace in search mode \(i.e. after pressing slash\) deletes from file instead of search cursor. [\#763](https://github.com/VSCodeVim/Vim/issues/763)
- s/a/b/g does not work over multiple lines [\#761](https://github.com/VSCodeVim/Vim/issues/761)
- Dp does not create two undo steps [\#759](https://github.com/VSCodeVim/Vim/issues/759)
- Window changes position when closing split pane [\#758](https://github.com/VSCodeVim/Vim/issues/758)
- Cursor position not remembered when navigating windows with \<Ctrl-W\>\[h,l\] [\#753](https://github.com/VSCodeVim/Vim/issues/753)
- Cursor width problem \(CJK characters\) [\#751](https://github.com/VSCodeVim/Vim/issues/751)
- A "broken link" in README.md [\#750](https://github.com/VSCodeVim/Vim/issues/750)
- Cannot redo with Ctrl-Shift-Z [\#749](https://github.com/VSCodeVim/Vim/issues/749)
- Release Pipeline [\#747](https://github.com/VSCodeVim/Vim/issues/747)
- ddp appends extra newline when pasting [\#743](https://github.com/VSCodeVim/Vim/issues/743)
- Curly braces' position is changed after using '=' to indent code. [\#742](https://github.com/VSCodeVim/Vim/issues/742)
- x shouldn't eat EOL [\#740](https://github.com/VSCodeVim/Vim/issues/740)
- Holding down the l or h keys does not go right or left, it skips around [\#735](https://github.com/VSCodeVim/Vim/issues/735)
- configuration vim.useCtrlKeys = false is not honored [\#734](https://github.com/VSCodeVim/Vim/issues/734)
- Keep pressing j causes VSCodeVim to hang in Insider [\#729](https://github.com/VSCodeVim/Vim/issues/729)
- Feature Request: Macros [\#728](https://github.com/VSCodeVim/Vim/issues/728)
- Clean undo history if the content changed from Disk [\#680](https://github.com/VSCodeVim/Vim/issues/680)
- Ctrl-E and Ctrl-I stop working as soon as the cursor should move [\#672](https://github.com/VSCodeVim/Vim/issues/672)
- gk / gj motions do nothing [\#660](https://github.com/VSCodeVim/Vim/issues/660)
- :wq doesn't work when there are changes \(does nothing\) [\#613](https://github.com/VSCodeVim/Vim/issues/613)
- Click on end of line & pressing x should not delete the newline [\#586](https://github.com/VSCodeVim/Vim/issues/586)
- Current line/cursor position not remembered when switching windows/editors [\#581](https://github.com/VSCodeVim/Vim/issues/581)
- Relative line numbers [\#423](https://github.com/VSCodeVim/Vim/issues/423)
- Cannot use ; and , to search forward and backward in f{char} F{char} t{char} and T{char} [\#410](https://github.com/VSCodeVim/Vim/issues/410)

**Merged pull requests:**

- Release Pipeline [\#788](https://github.com/VSCodeVim/Vim/pull/788) ([jpoon](https://github.com/jpoon))
- Fix delete line with CRLF \(\#743\) [\#770](https://github.com/VSCodeVim/Vim/pull/770) ([jgoz](https://github.com/jgoz))
- fixes \#740 [\#766](https://github.com/VSCodeVim/Vim/pull/766) ([xconverge](https://github.com/xconverge))
- fixes \#764 [\#765](https://github.com/VSCodeVim/Vim/pull/765) ([xconverge](https://github.com/xconverge))
- fixes \#759 [\#760](https://github.com/VSCodeVim/Vim/pull/760) ([xconverge](https://github.com/xconverge))
- Register info [\#756](https://github.com/VSCodeVim/Vim/pull/756) ([rebornix](https://github.com/rebornix))
- build on extension/test launch [\#755](https://github.com/VSCodeVim/Vim/pull/755) ([jpoon](https://github.com/jpoon))
- fixes \#750 [\#752](https://github.com/VSCodeVim/Vim/pull/752) ([xconverge](https://github.com/xconverge))
- clean gulpfile [\#748](https://github.com/VSCodeVim/Vim/pull/748) ([jpoon](https://github.com/jpoon))
- Substitute marks [\#744](https://github.com/VSCodeVim/Vim/pull/744) ([rebornix](https://github.com/rebornix))
- Read command [\#736](https://github.com/VSCodeVim/Vim/pull/736) ([dominic31](https://github.com/dominic31))
- Doc for enabling repeating j/k for Insider build [\#733](https://github.com/VSCodeVim/Vim/pull/733) ([octref](https://github.com/octref))
- Add autoindent setting [\#726](https://github.com/VSCodeVim/Vim/pull/726) ([octref](https://github.com/octref))
- Disable Vim Mode in Debug Repl [\#723](https://github.com/VSCodeVim/Vim/pull/723) ([rebornix](https://github.com/rebornix))
- \[WIP\] Roadmap update [\#717](https://github.com/VSCodeVim/Vim/pull/717) ([rebornix](https://github.com/rebornix))
- Editor Scroll [\#681](https://github.com/VSCodeVim/Vim/pull/681) ([rebornix](https://github.com/rebornix))
- Implement :wa\[ll\] command \(write all\) [\#671](https://github.com/VSCodeVim/Vim/pull/671) ([mleech](https://github.com/mleech))
- Special keys in Insert Mode [\#615](https://github.com/VSCodeVim/Vim/pull/615) ([rebornix](https://github.com/rebornix))

## [v0.1.10](https://github.com/VSCodeVim/Vim/tree/v0.1.10) (2016-09-06)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.1.9...v0.1.10)

**Closed issues:**

- Visual block mode A does not start inserting text at right position [\#718](https://github.com/VSCodeVim/Vim/issues/718)
- j+j \(j + k\) works not as expected in 0.1.9 [\#716](https://github.com/VSCodeVim/Vim/issues/716)
- cw incorrectly eats end-of-line character and joins lines [\#696](https://github.com/VSCodeVim/Vim/issues/696)
- ~ to change case followed by . to repeat command unexpectedly repeats previous action, not ~ [\#690](https://github.com/VSCodeVim/Vim/issues/690)
- Support for `clipboard=unnamed` / using system clipboard for unnamed register [\#650](https://github.com/VSCodeVim/Vim/issues/650)

**Merged pull requests:**

- Align Screen Line commands with latest Code API [\#724](https://github.com/VSCodeVim/Vim/pull/724) ([rebornix](https://github.com/rebornix))
- Visual block tests [\#722](https://github.com/VSCodeVim/Vim/pull/722) ([xconverge](https://github.com/xconverge))
- Remapper fixes [\#721](https://github.com/VSCodeVim/Vim/pull/721) ([jpoon](https://github.com/jpoon))
- fixes \#718 A and I have cursor in right position now [\#720](https://github.com/VSCodeVim/Vim/pull/720) ([xconverge](https://github.com/xconverge))
- fixes \#696 [\#715](https://github.com/VSCodeVim/Vim/pull/715) ([xconverge](https://github.com/xconverge))
- fix \#690 and other toggle case issues [\#698](https://github.com/VSCodeVim/Vim/pull/698) ([xconverge](https://github.com/xconverge))

## [v0.1.9](https://github.com/VSCodeVim/Vim/tree/v0.1.9) (2016-09-05)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.1.8...v0.1.9)

**Closed issues:**

- j+j no longer works in 0.1.8 [\#706](https://github.com/VSCodeVim/Vim/issues/706)
- cw not delimited by quote characters [\#695](https://github.com/VSCodeVim/Vim/issues/695)
- Visual block insert seems to insert at the column preceding selected column [\#658](https://github.com/VSCodeVim/Vim/issues/658)
- Go into a little more detail about key remappings in README [\#503](https://github.com/VSCodeVim/Vim/issues/503)

**Merged pull requests:**

- Update README.md [\#714](https://github.com/VSCodeVim/Vim/pull/714) ([jpoon](https://github.com/jpoon))
- Add vim.\* settings to readme. Fixes \#503 [\#713](https://github.com/VSCodeVim/Vim/pull/713) ([jpoon](https://github.com/jpoon))
- Set diff timeout to 1 second. [\#712](https://github.com/VSCodeVim/Vim/pull/712) ([johnfn](https://github.com/johnfn))
- Inserts repeated with . would add many undo points; fix this. [\#711](https://github.com/VSCodeVim/Vim/pull/711) ([johnfn](https://github.com/johnfn))
- Hotfix remapping [\#710](https://github.com/VSCodeVim/Vim/pull/710) ([johnfn](https://github.com/johnfn))
- Tiny change to issue template. [\#709](https://github.com/VSCodeVim/Vim/pull/709) ([johnfn](https://github.com/johnfn))

## [v0.1.8](https://github.com/VSCodeVim/Vim/tree/v0.1.8) (2016-09-04)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.1.7...v0.1.8)

**Closed issues:**

- Dot doesn't replicate cw command precisely [\#694](https://github.com/VSCodeVim/Vim/issues/694)
- cc should go to indentation level [\#686](https://github.com/VSCodeVim/Vim/issues/686)
- Ns don't work [\#684](https://github.com/VSCodeVim/Vim/issues/684)
- count z+c, count z+o don't appear to work [\#678](https://github.com/VSCodeVim/Vim/issues/678)
- z+t and z+b not adopted [\#677](https://github.com/VSCodeVim/Vim/issues/677)
- Search commands \(/ and ?\) with no input should repeat last search [\#668](https://github.com/VSCodeVim/Vim/issues/668)
- ctrl+v + c deleting extra char, and putting cursor in wrong position. Types at a different position to cursor too. [\#662](https://github.com/VSCodeVim/Vim/issues/662)
- Leading space get removed when visual select and paste [\#654](https://github.com/VSCodeVim/Vim/issues/654)
- Undo history not affected by movement [\#644](https://github.com/VSCodeVim/Vim/issues/644)
- Inconsistent \(with VSCode and Vim\) undo behavior [\#643](https://github.com/VSCodeVim/Vim/issues/643)
- Incorrect default for ignorecase/smartcase [\#642](https://github.com/VSCodeVim/Vim/issues/642)
- Mouse double click selection selects an extra character [\#641](https://github.com/VSCodeVim/Vim/issues/641)
- Can't enter visual block mode from visual mode, need to be in normal [\#639](https://github.com/VSCodeVim/Vim/issues/639)
- Work on multi selection [\#637](https://github.com/VSCodeVim/Vim/issues/637)
- Undo behavior with {}\[\]\(\)\<\> does not act exactly as it should [\#633](https://github.com/VSCodeVim/Vim/issues/633)
- Shift+S doesn't add indentation [\#626](https://github.com/VSCodeVim/Vim/issues/626)
- \[feature request\] :vsplit \(and :split? maybe\) [\#622](https://github.com/VSCodeVim/Vim/issues/622)
- `yy` moves cursor to beginner of the line [\#609](https://github.com/VSCodeVim/Vim/issues/609)
- Fix for "\_" underscore motions with counts [\#602](https://github.com/VSCodeVim/Vim/issues/602)
- Tag Deletes [\#588](https://github.com/VSCodeVim/Vim/issues/588)
- Find functionality does not support regex [\#572](https://github.com/VSCodeVim/Vim/issues/572)
- Wrong undo behavior when remaping kj to \<esc\> [\#568](https://github.com/VSCodeVim/Vim/issues/568)
- "vat" doesn't work [\#567](https://github.com/VSCodeVim/Vim/issues/567)
- Unexpected cursor shape with Go To Definition [\#510](https://github.com/VSCodeVim/Vim/issues/510)
- delete multi-lines working unexpectedly. \(command 'd\[number\]'\) [\#501](https://github.com/VSCodeVim/Vim/issues/501)
- Non-recursive remapping [\#408](https://github.com/VSCodeVim/Vim/issues/408)
- renaming keys to vim nomenclature [\#64](https://github.com/VSCodeVim/Vim/issues/64)

**Merged pull requests:**

- Fix race condition with switching active text editor. [\#705](https://github.com/VSCodeVim/Vim/pull/705) ([johnfn](https://github.com/johnfn))
- Fix bug with undo on untitled files. [\#704](https://github.com/VSCodeVim/Vim/pull/704) ([johnfn](https://github.com/johnfn))
- clear history when content from disk is changed [\#703](https://github.com/VSCodeVim/Vim/pull/703) ([aminroosta](https://github.com/aminroosta))
- Fix `\#` and `\*` Behaviour [\#702](https://github.com/VSCodeVim/Vim/pull/702) ([jpoon](https://github.com/jpoon))
- Fix error when \<BS\> at beginning of document [\#691](https://github.com/VSCodeVim/Vim/pull/691) ([jpoon](https://github.com/jpoon))
- Handle Ns and fix \#684 [\#688](https://github.com/VSCodeVim/Vim/pull/688) ([octref](https://github.com/octref))
- Use Angle Bracket Notation \(Fixes \#64\) [\#683](https://github.com/VSCodeVim/Vim/pull/683) ([jpoon](https://github.com/jpoon))
- Implement ; and , [\#674](https://github.com/VSCodeVim/Vim/pull/674) ([aminroosta](https://github.com/aminroosta))
- Some visual block fixes [\#667](https://github.com/VSCodeVim/Vim/pull/667) ([xconverge](https://github.com/xconverge))
- implement useSystemClipboard command [\#665](https://github.com/VSCodeVim/Vim/pull/665) ([aminroosta](https://github.com/aminroosta))
- Document autoindent option [\#664](https://github.com/VSCodeVim/Vim/pull/664) ([sectioneight](https://github.com/sectioneight))
- fix \#510 [\#659](https://github.com/VSCodeVim/Vim/pull/659) ([xconverge](https://github.com/xconverge))
- fix \#654 [\#656](https://github.com/VSCodeVim/Vim/pull/656) ([xconverge](https://github.com/xconverge))
- fix \#652 [\#655](https://github.com/VSCodeVim/Vim/pull/655) ([xconverge](https://github.com/xconverge))
- improves bracket undo behavior when vscode autocloses brackets [\#649](https://github.com/VSCodeVim/Vim/pull/649) ([xconverge](https://github.com/xconverge))
- Fix missleading readme instruction [\#647](https://github.com/VSCodeVim/Vim/pull/647) ([AntonAderum](https://github.com/AntonAderum))
- Undo behavior when position changes using arrows or mouse [\#646](https://github.com/VSCodeVim/Vim/pull/646) ([xconverge](https://github.com/xconverge))
- fix for extra character when double click mouse selection [\#645](https://github.com/VSCodeVim/Vim/pull/645) ([xconverge](https://github.com/xconverge))
- fix \#639 visual block mode minor issues [\#640](https://github.com/VSCodeVim/Vim/pull/640) ([xconverge](https://github.com/xconverge))
- Ctrl+a and Ctrl+x now create undo points correctly and can be repeate… [\#636](https://github.com/VSCodeVim/Vim/pull/636) ([xconverge](https://github.com/xconverge))
- fix \#501 some more to include 'k' [\#635](https://github.com/VSCodeVim/Vim/pull/635) ([xconverge](https://github.com/xconverge))
- updating the undo tree when using bracket operators slightly [\#634](https://github.com/VSCodeVim/Vim/pull/634) ([xconverge](https://github.com/xconverge))
- fix \#501 [\#632](https://github.com/VSCodeVim/Vim/pull/632) ([xconverge](https://github.com/xconverge))
- Fix bug \#613 ":wq command dows not work" [\#630](https://github.com/VSCodeVim/Vim/pull/630) ([Platzer](https://github.com/Platzer))
- Respect indentation on cc and S [\#629](https://github.com/VSCodeVim/Vim/pull/629) ([sectioneight](https://github.com/sectioneight))
- Fix tag markup in roadmap [\#628](https://github.com/VSCodeVim/Vim/pull/628) ([sectioneight](https://github.com/sectioneight))
- Allow regex in / search [\#627](https://github.com/VSCodeVim/Vim/pull/627) ([sectioneight](https://github.com/sectioneight))
- Synonyms [\#621](https://github.com/VSCodeVim/Vim/pull/621) ([rebornix](https://github.com/rebornix))
- Implement tag movements [\#619](https://github.com/VSCodeVim/Vim/pull/619) ([sectioneight](https://github.com/sectioneight))

## [v0.1.7](https://github.com/VSCodeVim/Vim/tree/v0.1.7) (2016-08-14)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.1.6...v0.1.7)

**Closed issues:**

- Long editor hang after deleting block of text in visual mode [\#607](https://github.com/VSCodeVim/Vim/issues/607)
- 'u' and 'ctrl-z' [\#600](https://github.com/VSCodeVim/Vim/issues/600)
- why the "vim.visualModeKeyBindings" is an json object? [\#599](https://github.com/VSCodeVim/Vim/issues/599)
- In Visual Mode, Ctrl+v paste, like VsVim [\#598](https://github.com/VSCodeVim/Vim/issues/598)
- ctrl-f not scrolling [\#594](https://github.com/VSCodeVim/Vim/issues/594)
- semicolon \(;\) does not repeat fF/tT actions [\#593](https://github.com/VSCodeVim/Vim/issues/593)
- vim\_esc is gone [\#583](https://github.com/VSCodeVim/Vim/issues/583)
- dw deletes whole line when trying to delete last word [\#578](https://github.com/VSCodeVim/Vim/issues/578)
- shift-Y support in visual mode [\#573](https://github.com/VSCodeVim/Vim/issues/573)
- Be more explicit in readme about what useCtrlKeys does [\#561](https://github.com/VSCodeVim/Vim/issues/561)
- Fork and improve jsdiff [\#558](https://github.com/VSCodeVim/Vim/issues/558)
- C or cc will kill the empty line [\#556](https://github.com/VSCodeVim/Vim/issues/556)
- When using / searching, do not support Chinese [\#542](https://github.com/VSCodeVim/Vim/issues/542)
- an option to use system clipboard [\#537](https://github.com/VSCodeVim/Vim/issues/537)
- When I type `jj` to `esc`, will save a `j` character [\#523](https://github.com/VSCodeVim/Vim/issues/523)
- Support :s/foo/bar/g style substitutions when text is selected [\#512](https://github.com/VSCodeVim/Vim/issues/512)
- `w` should/could respect `wordSeparators` settings [\#487](https://github.com/VSCodeVim/Vim/issues/487)
- :set hlsearch not working [\#481](https://github.com/VSCodeVim/Vim/issues/481)
- 'r' key does not put you in replace mode. [\#155](https://github.com/VSCodeVim/Vim/issues/155)

**Merged pull requests:**

- Add support Y in visual mode [\#597](https://github.com/VSCodeVim/Vim/pull/597) ([shotaAkasaka](https://github.com/shotaAkasaka))
- Sentence selection [\#592](https://github.com/VSCodeVim/Vim/pull/592) ([rebornix](https://github.com/rebornix))
- fix C or cc kill the empty line [\#591](https://github.com/VSCodeVim/Vim/pull/591) ([shotaAkasaka](https://github.com/shotaAkasaka))
- Added Non-Recursive mapping capability. Fixes issue \#408 [\#589](https://github.com/VSCodeVim/Vim/pull/589) ([somkun](https://github.com/somkun))
- Vim Settings [\#508](https://github.com/VSCodeVim/Vim/pull/508) ([rebornix](https://github.com/rebornix))

## [v0.1.6](https://github.com/VSCodeVim/Vim/tree/v0.1.6) (2016-08-09)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/0.1.5...v0.1.6)

**Closed issues:**

- Cannot backspace over tabs in insert mode [\#502](https://github.com/VSCodeVim/Vim/issues/502)
- Add Visual Block mode [\#401](https://github.com/VSCodeVim/Vim/issues/401)

**Merged pull requests:**

- \[WIP\] Visual block mode [\#469](https://github.com/VSCodeVim/Vim/pull/469) ([johnfn](https://github.com/johnfn))

## [0.1.5](https://github.com/VSCodeVim/Vim/tree/0.1.5) (2016-08-09)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.1.5...0.1.5)

## [v0.1.5](https://github.com/VSCodeVim/Vim/tree/v0.1.5) (2016-08-09)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.1.4...v0.1.5)

**Closed issues:**

- 'dF/dT' deletes an extra character [\#571](https://github.com/VSCodeVim/Vim/issues/571)
- Repeated 't/T' actions do not work [\#570](https://github.com/VSCodeVim/Vim/issues/570)
- \# in Normal mode causes Vim to lock up [\#569](https://github.com/VSCodeVim/Vim/issues/569)
- Repeating find next character with ; does not work [\#566](https://github.com/VSCodeVim/Vim/issues/566)
- Cannot change mode between VISUAL and VISUAL LINE [\#555](https://github.com/VSCodeVim/Vim/issues/555)
- marks are inconsistent [\#554](https://github.com/VSCodeVim/Vim/issues/554)
- gd will break if it goes to the exact same position it is on [\#553](https://github.com/VSCodeVim/Vim/issues/553)
- Need to install copy-paste dependency [\#552](https://github.com/VSCodeVim/Vim/issues/552)
- In insert mode, deleting at the start of a line should not move the cursor to the end of the new line [\#550](https://github.com/VSCodeVim/Vim/issues/550)
- Undo undoes everything you've ever done [\#548](https://github.com/VSCodeVim/Vim/issues/548)
- will often appear not to respond to the phenomenon [\#541](https://github.com/VSCodeVim/Vim/issues/541)
- Typing in Insert Mode with multiple cursors only types in first cursor [\#540](https://github.com/VSCodeVim/Vim/issues/540)
- Y key doesn't yank current line [\#538](https://github.com/VSCodeVim/Vim/issues/538)
- Shift+S doesn't work [\#536](https://github.com/VSCodeVim/Vim/issues/536)
- CI appears to be broken [\#535](https://github.com/VSCodeVim/Vim/issues/535)
- CJK still problem in normal mode [\#532](https://github.com/VSCodeVim/Vim/issues/532)
- Support `gd` [\#529](https://github.com/VSCodeVim/Vim/issues/529)
- Support ^e and ^y [\#527](https://github.com/VSCodeVim/Vim/issues/527)
- Visual mode: "o" - move to other end of marked area [\#526](https://github.com/VSCodeVim/Vim/issues/526)
- Crash when you switch branches \(if the difference is large enough\) [\#521](https://github.com/VSCodeVim/Vim/issues/521)
- KeyBindings having unintended effect on search text [\#495](https://github.com/VSCodeVim/Vim/issues/495)
- delete N characters under and after the cursor with Del key [\#394](https://github.com/VSCodeVim/Vim/issues/394)
- can't use '\' in key bindings [\#49](https://github.com/VSCodeVim/Vim/issues/49)

**Merged pull requests:**

- Replace mode [\#580](https://github.com/VSCodeVim/Vim/pull/580) ([rebornix](https://github.com/rebornix))
- Fix for issue \#571 [\#579](https://github.com/VSCodeVim/Vim/pull/579) ([xconverge](https://github.com/xconverge))
- OS X non-global key repeat fix [\#577](https://github.com/VSCodeVim/Vim/pull/577) ([jimray](https://github.com/jimray))
- Hack to mitigate \#569 and prevent extension from locking up [\#576](https://github.com/VSCodeVim/Vim/pull/576) ([jpoon](https://github.com/jpoon))
- Fix binding of control-keys [\#575](https://github.com/VSCodeVim/Vim/pull/575) ([sectioneight](https://github.com/sectioneight))
- Fix test regression [\#560](https://github.com/VSCodeVim/Vim/pull/560) ([rebornix](https://github.com/rebornix))
- Fix gt,gT numeric prefix [\#559](https://github.com/VSCodeVim/Vim/pull/559) ([rebornix](https://github.com/rebornix))
- Fix incorrect cursor location after deleting linebreak \(fixes \#550\) [\#551](https://github.com/VSCodeVim/Vim/pull/551) ([thomasboyt](https://github.com/thomasboyt))
- Support gd [\#547](https://github.com/VSCodeVim/Vim/pull/547) ([johnfn](https://github.com/johnfn))
- Add support for S [\#546](https://github.com/VSCodeVim/Vim/pull/546) ([glibsm](https://github.com/glibsm))
- update roadmap [\#545](https://github.com/VSCodeVim/Vim/pull/545) ([rebornix](https://github.com/rebornix))
- Support "{char} registers and clipboard access via "\* register. [\#543](https://github.com/VSCodeVim/Vim/pull/543) ([aminroosta](https://github.com/aminroosta))
- Added CommandGoToOtherEndOfHiglightedText - \#526 [\#539](https://github.com/VSCodeVim/Vim/pull/539) ([Platzer](https://github.com/Platzer))
- Move sections [\#533](https://github.com/VSCodeVim/Vim/pull/533) ([rebornix](https://github.com/rebornix))
- Substitute with no range or marks [\#525](https://github.com/VSCodeVim/Vim/pull/525) ([rebornix](https://github.com/rebornix))
- Correct Fold behavior and update roadmap [\#524](https://github.com/VSCodeVim/Vim/pull/524) ([rebornix](https://github.com/rebornix))
- Make \<delete\> repeatable in Normal Mode. Fix \#394 [\#514](https://github.com/VSCodeVim/Vim/pull/514) ([octref](https://github.com/octref))
- Screen lines and characters. [\#486](https://github.com/VSCodeVim/Vim/pull/486) ([rebornix](https://github.com/rebornix))

## [v0.1.4](https://github.com/VSCodeVim/Vim/tree/v0.1.4) (2016-07-28)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.1.3...v0.1.4)

**Closed issues:**

- Ctrl-C in "/" doesn't reset the keyword to search [\#518](https://github.com/VSCodeVim/Vim/issues/518)
- The formatting of the FAQ looks terrible, esp. within vscode. [\#517](https://github.com/VSCodeVim/Vim/issues/517)
- Support ctrl+a and ctrl+x to increment/decrement numbers [\#513](https://github.com/VSCodeVim/Vim/issues/513)
- Hash has incorrect behavior [\#504](https://github.com/VSCodeVim/Vim/issues/504)
- How can I bind ; to :? [\#492](https://github.com/VSCodeVim/Vim/issues/492)
- Question: why CommandFold is not registered for Normal mode? [\#489](https://github.com/VSCodeVim/Vim/issues/489)
- % should move to end of matching set, not beginning [\#480](https://github.com/VSCodeVim/Vim/issues/480)
- ci' does not delete between single quotes and enter insert mode [\#471](https://github.com/VSCodeVim/Vim/issues/471)
- cannot use "n" when searching [\#470](https://github.com/VSCodeVim/Vim/issues/470)
- Tab Stops Ignored When Using Backspace  [\#448](https://github.com/VSCodeVim/Vim/issues/448)
- Incremental search is laggy in large files [\#438](https://github.com/VSCodeVim/Vim/issues/438)
- Constant inserting should be merged into one single Insert Operation in history [\#427](https://github.com/VSCodeVim/Vim/issues/427)
- Ctrl-v can break undo history [\#421](https://github.com/VSCodeVim/Vim/issues/421)
- current line scroll to top when begin editing in split editor [\#358](https://github.com/VSCodeVim/Vim/issues/358)
- visual block mode ? \(ctrl+V\) [\#353](https://github.com/VSCodeVim/Vim/issues/353)
- gT gt [\#338](https://github.com/VSCodeVim/Vim/issues/338)
- All text objects [\#287](https://github.com/VSCodeVim/Vim/issues/287)
- case insensitive/smart case search [\#279](https://github.com/VSCodeVim/Vim/issues/279)
- Motion keys should not be added to key history if they failed. [\#250](https://github.com/VSCodeVim/Vim/issues/250)
- Incorrect work with "Programmers Dworak" keybord layout [\#171](https://github.com/VSCodeVim/Vim/issues/171)
- multiline editing does not work [\#146](https://github.com/VSCodeVim/Vim/issues/146)

**Merged pull requests:**

- Implement increment and decrement operators [\#515](https://github.com/VSCodeVim/Vim/pull/515) ([sectioneight](https://github.com/sectioneight))
- Fix \#502 [\#509](https://github.com/VSCodeVim/Vim/pull/509) ([rebornix](https://github.com/rebornix))
- Add tabs movement and fix tab command with correct counting [\#507](https://github.com/VSCodeVim/Vim/pull/507) ([rebornix](https://github.com/rebornix))
- Omit first word in hash backwards search [\#506](https://github.com/VSCodeVim/Vim/pull/506) ([sectioneight](https://github.com/sectioneight))
- Turn around for cursor problem [\#505](https://github.com/VSCodeVim/Vim/pull/505) ([rebornix](https://github.com/rebornix))
- Fix instructions for setting key bindings [\#499](https://github.com/VSCodeVim/Vim/pull/499) ([positron](https://github.com/positron))
- Code clean-up. Remove dead code. [\#497](https://github.com/VSCodeVim/Vim/pull/497) ([jpoon](https://github.com/jpoon))
- Merge history changes into a single operation. Fixes \#427 [\#496](https://github.com/VSCodeVim/Vim/pull/496) ([infogulch](https://github.com/infogulch))
- Fix \#438 - Limit the number of matches, and try to only recalculate when the searchString changes, or the document changes [\#494](https://github.com/VSCodeVim/Vim/pull/494) ([roblourens](https://github.com/roblourens))
- CommandFold should be available in Normal mode [\#493](https://github.com/VSCodeVim/Vim/pull/493) ([aminroosta](https://github.com/aminroosta))
- Fix % movement when not on opening character [\#490](https://github.com/VSCodeVim/Vim/pull/490) ([sectioneight](https://github.com/sectioneight))
- Suggest npm run compile in CONTRIBUTING page [\#488](https://github.com/VSCodeVim/Vim/pull/488) ([aminroosta](https://github.com/aminroosta))
- Implement quoted text objects [\#483](https://github.com/VSCodeVim/Vim/pull/483) ([sectioneight](https://github.com/sectioneight))
- Fix \#338 - add gt, gT support [\#482](https://github.com/VSCodeVim/Vim/pull/482) ([arussellk](https://github.com/arussellk))
- Set correct cursor and selection after code format. [\#478](https://github.com/VSCodeVim/Vim/pull/478) ([rebornix](https://github.com/rebornix))
- CJK in all modes [\#475](https://github.com/VSCodeVim/Vim/pull/475) ([rebornix](https://github.com/rebornix))
- Fix \#358. [\#399](https://github.com/VSCodeVim/Vim/pull/399) ([rebornix](https://github.com/rebornix))
- Word in visual mode [\#385](https://github.com/VSCodeVim/Vim/pull/385) ([rebornix](https://github.com/rebornix))

## [v0.1.3](https://github.com/VSCodeVim/Vim/tree/v0.1.3) (2016-07-19)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.1.2...v0.1.3)

**Closed issues:**

- Master tests broken [\#468](https://github.com/VSCodeVim/Vim/issues/468)
- \[Engineering\] Tab Size or Spaces [\#457](https://github.com/VSCodeVim/Vim/issues/457)
- Enforce tslint in Travis CI? [\#456](https://github.com/VSCodeVim/Vim/issues/456)
- Add control-w insert mode delete backwards [\#452](https://github.com/VSCodeVim/Vim/issues/452)
- Implement i\< and i\(, and i{ text objects [\#449](https://github.com/VSCodeVim/Vim/issues/449)
- Missing support for "change inside" and "delete inside" [\#443](https://github.com/VSCodeVim/Vim/issues/443)
- The words that auto-completed \(by press tab\) will be deleted when press jj [\#442](https://github.com/VSCodeVim/Vim/issues/442)
- 'dNG' behaves differently than expected [\#441](https://github.com/VSCodeVim/Vim/issues/441)
- 'dE' leaves the end-of-word character intact [\#440](https://github.com/VSCodeVim/Vim/issues/440)
- Remove "Supported Keyboards" and respective IKeyMapper-implementations [\#432](https://github.com/VSCodeVim/Vim/issues/432)
- Ctrl-{ isn't binded to switch to normal mode [\#426](https://github.com/VSCodeVim/Vim/issues/426)
- cannot quit visual mode  [\#425](https://github.com/VSCodeVim/Vim/issues/425)
- ctrl+b in insert mode should toggle sidebar [\#424](https://github.com/VSCodeVim/Vim/issues/424)
- p/P cursor position is wrong [\#407](https://github.com/VSCodeVim/Vim/issues/407)
- Ctrl+w h will open up a new tab if there isn't one [\#384](https://github.com/VSCodeVim/Vim/issues/384)
- Don't tslint files in test/ directory [\#379](https://github.com/VSCodeVim/Vim/issues/379)
- CTRL+C = extension.vim\_esc [\#356](https://github.com/VSCodeVim/Vim/issues/356)
- issue with Chinese IME [\#341](https://github.com/VSCodeVim/Vim/issues/341)
- dtx where x doesnt exist will delete one character [\#317](https://github.com/VSCodeVim/Vim/issues/317)
- Request - Keyboard pt-PT \(QWERTY\) [\#131](https://github.com/VSCodeVim/Vim/issues/131)
- Keybinding discussion \(non-US mostly\) [\#128](https://github.com/VSCodeVim/Vim/issues/128)

**Merged pull requests:**

- Fix wrong command for ctrl+f [\#476](https://github.com/VSCodeVim/Vim/pull/476) ([rebornix](https://github.com/rebornix))
- Fix regressions in text objects [\#473](https://github.com/VSCodeVim/Vim/pull/473) ([sectioneight](https://github.com/sectioneight))
- Fix handling of opener for nested text objects [\#472](https://github.com/VSCodeVim/Vim/pull/472) ([sectioneight](https://github.com/sectioneight))
- Implement square-bracket text object [\#467](https://github.com/VSCodeVim/Vim/pull/467) ([sectioneight](https://github.com/sectioneight))
- Add support for failed motions [\#466](https://github.com/VSCodeVim/Vim/pull/466) ([johnfn](https://github.com/johnfn))
- Add test-specific tslint [\#464](https://github.com/VSCodeVim/Vim/pull/464) ([sectioneight](https://github.com/sectioneight))
- Initialize mode and cursor after startup [\#462](https://github.com/VSCodeVim/Vim/pull/462) ([rebornix](https://github.com/rebornix))
- FixTabStops [\#461](https://github.com/VSCodeVim/Vim/pull/461) ([rebornix](https://github.com/rebornix))
- Convert 4 space tab to 2 space tab. [\#460](https://github.com/VSCodeVim/Vim/pull/460) ([rebornix](https://github.com/rebornix))
- Enforce TSLint. Closes \#456 [\#459](https://github.com/VSCodeVim/Vim/pull/459) ([jpoon](https://github.com/jpoon))
- Add back missing control-c registration [\#455](https://github.com/VSCodeVim/Vim/pull/455) ([sectioneight](https://github.com/sectioneight))
- Fix checkmark syntax on roadmap [\#454](https://github.com/VSCodeVim/Vim/pull/454) ([sectioneight](https://github.com/sectioneight))
- Add support for ctrl+w in insert mode [\#453](https://github.com/VSCodeVim/Vim/pull/453) ([sectioneight](https://github.com/sectioneight))
- Implement additional text object commands [\#450](https://github.com/VSCodeVim/Vim/pull/450) ([sectioneight](https://github.com/sectioneight))
- Remove custom keyboard mapping \(fixes \#432\). Fix duplicate definition… [\#447](https://github.com/VSCodeVim/Vim/pull/447) ([jpoon](https://github.com/jpoon))
- Fix \#341 CJK Problem. [\#446](https://github.com/VSCodeVim/Vim/pull/446) ([rebornix](https://github.com/rebornix))
- Fix \#426 [\#445](https://github.com/VSCodeVim/Vim/pull/445) ([arussellk](https://github.com/arussellk))
- Read TextEditor options from active editor [\#444](https://github.com/VSCodeVim/Vim/pull/444) ([rebornix](https://github.com/rebornix))
- \[p, \[p, gp and gP [\#412](https://github.com/VSCodeVim/Vim/pull/412) ([rebornix](https://github.com/rebornix))
- Open file in new window. [\#404](https://github.com/VSCodeVim/Vim/pull/404) ([rebornix](https://github.com/rebornix))

## [v0.1.2](https://github.com/VSCodeVim/Vim/tree/v0.1.2) (2016-07-13)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.1.1...v0.1.2)

**Closed issues:**

- backspace backspace is not currently a command repeatable with . [\#439](https://github.com/VSCodeVim/Vim/issues/439)
- When in Visual Mode "s" should delete all selected text and enter Insert mode. [\#437](https://github.com/VSCodeVim/Vim/issues/437)
- Paste problem in visual mode [\#436](https://github.com/VSCodeVim/Vim/issues/436)
- What "vim.otherModesKeyBindings" should be, object or array? [\#435](https://github.com/VSCodeVim/Vim/issues/435)
- Can't scroll multiple characters/lines when holding down hjkl [\#422](https://github.com/VSCodeVim/Vim/issues/422)
- hang several seconds after replace a block of text by paste [\#420](https://github.com/VSCodeVim/Vim/issues/420)
- ctrl+f stopped working in vsCode 1.3.0 due to this extension. Works fine after removing this. [\#416](https://github.com/VSCodeVim/Vim/issues/416)
- Make this project buildable [\#409](https://github.com/VSCodeVim/Vim/issues/409)
- `db` off-by-one [\#397](https://github.com/VSCodeVim/Vim/issues/397)
- `dw` eats EOF [\#369](https://github.com/VSCodeVim/Vim/issues/369)
- I think CTRL-d should be half-page-down [\#214](https://github.com/VSCodeVim/Vim/issues/214)

**Merged pull requests:**

- Fix spec for otherModesKeyBindings to match insert [\#434](https://github.com/VSCodeVim/Vim/pull/434) ([sectioneight](https://github.com/sectioneight))
- Use TypeScript 2.0 and use strictNullChecks. [\#431](https://github.com/VSCodeVim/Vim/pull/431) ([johnfn](https://github.com/johnfn))
- Ctrl+U and Ctrl+D [\#430](https://github.com/VSCodeVim/Vim/pull/430) ([rebornix](https://github.com/rebornix))
- Fix\#369. `dw` eats EOF. [\#428](https://github.com/VSCodeVim/Vim/pull/428) ([rebornix](https://github.com/rebornix))
- Include vscode typings [\#419](https://github.com/VSCodeVim/Vim/pull/419) ([jpoon](https://github.com/jpoon))
- Fix ctrl+b, ctrl+f [\#418](https://github.com/VSCodeVim/Vim/pull/418) ([jpoon](https://github.com/jpoon))
- Fix \#397. [\#413](https://github.com/VSCodeVim/Vim/pull/413) ([rebornix](https://github.com/rebornix))
- Fix layout mistake in Contributing and gulp typo [\#411](https://github.com/VSCodeVim/Vim/pull/411) ([frederickfogerty](https://github.com/frederickfogerty))

## [v0.1.1](https://github.com/VSCodeVim/Vim/tree/v0.1.1) (2016-07-08)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.1...v0.1.1)

**Closed issues:**

- Latest update breaks Intellisense navigation [\#414](https://github.com/VSCodeVim/Vim/issues/414)
- \]p, \[p, gp, gP [\#403](https://github.com/VSCodeVim/Vim/issues/403)

**Merged pull requests:**

- Fix \#414. [\#415](https://github.com/VSCodeVim/Vim/pull/415) ([rebornix](https://github.com/rebornix))
- Substitute [\#376](https://github.com/VSCodeVim/Vim/pull/376) ([rebornix](https://github.com/rebornix))

## [v0.1](https://github.com/VSCodeVim/Vim/tree/v0.1) (2016-07-08)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.28...v0.1)

**Closed issues:**

- visual mode extension using arrow keys [\#382](https://github.com/VSCodeVim/Vim/issues/382)
- Position cursor in 1 tab, then focus other tab and make motion [\#381](https://github.com/VSCodeVim/Vim/issues/381)
- When doing an undo/redo, use a single text edit object. [\#380](https://github.com/VSCodeVim/Vim/issues/380)
- Undo command undos `insert` + `replace` [\#375](https://github.com/VSCodeVim/Vim/issues/375)
- Mash keys and backspace in insert mode, and "Nothing matched!" will get console logged sometimes. [\#374](https://github.com/VSCodeVim/Vim/issues/374)
- Add some sort of global lock [\#373](https://github.com/VSCodeVim/Vim/issues/373)
- Buffer navigation [\#360](https://github.com/VSCodeVim/Vim/issues/360)
- SPC should move right in Normal mode but doesn't [\#355](https://github.com/VSCodeVim/Vim/issues/355)
- Non-blinking cursor in normal mode [\#352](https://github.com/VSCodeVim/Vim/issues/352)
- Cannot bind ";" to "EnterCommand" or "tab" to MoveMatchingBracket [\#344](https://github.com/VSCodeVim/Vim/issues/344)
- Undo deletion or uppercase breaks Vim State [\#334](https://github.com/VSCodeVim/Vim/issues/334)
- Reset to normal node and reset cursor position on file change [\#329](https://github.com/VSCodeVim/Vim/issues/329)
- Pressing on navigation keys \(ex. j\) for a long time causes weird UI behavior [\#326](https://github.com/VSCodeVim/Vim/issues/326)
- Marks [\#297](https://github.com/VSCodeVim/Vim/issues/297)
- Concept of 'failed' motions [\#293](https://github.com/VSCodeVim/Vim/issues/293)
- \<c-w\> h, l should move between panes [\#291](https://github.com/VSCodeVim/Vim/issues/291)
- search should wrap [\#281](https://github.com/VSCodeVim/Vim/issues/281)
- highlight all search matches [\#280](https://github.com/VSCodeVim/Vim/issues/280)
- add tests for . [\#255](https://github.com/VSCodeVim/Vim/issues/255)
- add tests for J [\#254](https://github.com/VSCodeVim/Vim/issues/254)
- :w on a buffer with a filename, but no file on disk, doesn't work [\#229](https://github.com/VSCodeVim/Vim/issues/229)
- Provide a 'disableDefaults' configuration option [\#227](https://github.com/VSCodeVim/Vim/issues/227)
- Default bindings for insert mode clobber normal mode bindings that enter insert mode [\#226](https://github.com/VSCodeVim/Vim/issues/226)
- Cannot read property 'document' of null  [\#207](https://github.com/VSCodeVim/Vim/issues/207)
- RangeError in readLineAt  [\#206](https://github.com/VSCodeVim/Vim/issues/206)
- :wq [\#198](https://github.com/VSCodeVim/Vim/issues/198)
- Remapping keys / vimrc support [\#185](https://github.com/VSCodeVim/Vim/issues/185)
- Mapping jk to esc in input mode [\#172](https://github.com/VSCodeVim/Vim/issues/172)
- neovim integration? [\#18](https://github.com/VSCodeVim/Vim/issues/18)
- "NORMAL MODE" gets spammed on statusline [\#406](https://github.com/VSCodeVim/Vim/issues/406)
- Make tests pass [\#393](https://github.com/VSCodeVim/Vim/issues/393)
- Switching between panes sometimes breaks vim [\#392](https://github.com/VSCodeVim/Vim/issues/392)
- New Vim version appears to eat CPU like crazy [\#391](https://github.com/VSCodeVim/Vim/issues/391)
- TypeError: Cannot read property 'document' of undefined [\#378](https://github.com/VSCodeVim/Vim/issues/378)
- bump typescript to latest version [\#296](https://github.com/VSCodeVim/Vim/issues/296)

**Merged pull requests:**

- Fix Roadmap link in Readme [\#405](https://github.com/VSCodeVim/Vim/pull/405) ([frederickfogerty](https://github.com/frederickfogerty))
- Fix TS2318 and ignore .vscode-test folder [\#400](https://github.com/VSCodeVim/Vim/pull/400) ([rebornix](https://github.com/rebornix))
- Update window command status [\#398](https://github.com/VSCodeVim/Vim/pull/398) ([rebornix](https://github.com/rebornix))
- `workbench.files.action.closeAllFiles` is deprecated. [\#395](https://github.com/VSCodeVim/Vim/pull/395) ([rebornix](https://github.com/rebornix))
- Basic Key Remapping [\#390](https://github.com/VSCodeVim/Vim/pull/390) ([johnfn](https://github.com/johnfn))
- Use correct API for file open. [\#388](https://github.com/VSCodeVim/Vim/pull/388) ([rebornix](https://github.com/rebornix))
- Use Arrows in Insert Mode. [\#387](https://github.com/VSCodeVim/Vim/pull/387) ([rebornix](https://github.com/rebornix))
- Marks [\#386](https://github.com/VSCodeVim/Vim/pull/386) ([johnfn](https://github.com/johnfn))
- Arrows [\#383](https://github.com/VSCodeVim/Vim/pull/383) ([rebornix](https://github.com/rebornix))
- Edit File [\#372](https://github.com/VSCodeVim/Vim/pull/372) ([rebornix](https://github.com/rebornix))
- Unclosed brackets [\#371](https://github.com/VSCodeVim/Vim/pull/371) ([rebornix](https://github.com/rebornix))
- Manual history tracking [\#370](https://github.com/VSCodeVim/Vim/pull/370) ([johnfn](https://github.com/johnfn))
- Tabs [\#368](https://github.com/VSCodeVim/Vim/pull/368) ([rebornix](https://github.com/rebornix))
- Rebornix switch pane [\#367](https://github.com/VSCodeVim/Vim/pull/367) ([johnfn](https://github.com/johnfn))
- Support `C` [\#366](https://github.com/VSCodeVim/Vim/pull/366) ([rebornix](https://github.com/rebornix))
- Add Ncc support and revise cc behavior [\#365](https://github.com/VSCodeVim/Vim/pull/365) ([rebornix](https://github.com/rebornix))
- Bring Ctrl keys back [\#364](https://github.com/VSCodeVim/Vim/pull/364) ([rebornix](https://github.com/rebornix))
- \[WIP\]: Switch Window [\#363](https://github.com/VSCodeVim/Vim/pull/363) ([rebornix](https://github.com/rebornix))
- Sentence [\#362](https://github.com/VSCodeVim/Vim/pull/362) ([rebornix](https://github.com/rebornix))
- Add config option for nonblinking block cursor. [\#361](https://github.com/VSCodeVim/Vim/pull/361) ([johnfn](https://github.com/johnfn))
- Refactor search [\#357](https://github.com/VSCodeVim/Vim/pull/357) ([johnfn](https://github.com/johnfn))
- WriteQuit [\#354](https://github.com/VSCodeVim/Vim/pull/354) ([srepollock](https://github.com/srepollock))

## [v0.0.28](https://github.com/VSCodeVim/Vim/tree/v0.0.28) (2016-06-24)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.27...v0.0.28)

**Closed issues:**

- code formatting with = [\#308](https://github.com/VSCodeVim/Vim/issues/308)

**Merged pull requests:**

- Implement \<count\>yy [\#351](https://github.com/VSCodeVim/Vim/pull/351) ([rebornix](https://github.com/rebornix))
- Align TextEditorOptions between test code and workspace [\#350](https://github.com/VSCodeVim/Vim/pull/350) ([rebornix](https://github.com/rebornix))
- Uppercase support [\#349](https://github.com/VSCodeVim/Vim/pull/349) ([johnfn](https://github.com/johnfn))
- Add format code support. Fix \#308. [\#348](https://github.com/VSCodeVim/Vim/pull/348) ([rebornix](https://github.com/rebornix))

## [v0.0.27](https://github.com/VSCodeVim/Vim/tree/v0.0.27) (2016-06-23)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/0.0.26...v0.0.27)

**Closed issues:**

- bug of J [\#346](https://github.com/VSCodeVim/Vim/issues/346)
- holding down navigation button  [\#345](https://github.com/VSCodeVim/Vim/issues/345)
- Backspace on empty line doesn't work [\#320](https://github.com/VSCodeVim/Vim/issues/320)
- . should repeat rx [\#309](https://github.com/VSCodeVim/Vim/issues/309)
- add tokenizer for vim key names [\#82](https://github.com/VSCodeVim/Vim/issues/82)

## [0.0.26](https://github.com/VSCodeVim/Vim/tree/0.0.26) (2016-06-22)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.26...0.0.26)

## [v0.0.26](https://github.com/VSCodeVim/Vim/tree/v0.0.26) (2016-06-22)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/0.0.25...v0.0.26)

**Closed issues:**

- J eat the first character of the next line [\#343](https://github.com/VSCodeVim/Vim/issues/343)
- selection should be kept after \< or \> [\#342](https://github.com/VSCodeVim/Vim/issues/342)
- J [\#340](https://github.com/VSCodeVim/Vim/issues/340)
- Tab complete + x causes x to be inserted in wrong place [\#339](https://github.com/VSCodeVim/Vim/issues/339)
- Count prefix doesn't reset when used with commands [\#336](https://github.com/VSCodeVim/Vim/issues/336)
- Can't repeat Vj\<\< with . [\#333](https://github.com/VSCodeVim/Vim/issues/333)
- 0 is broken [\#332](https://github.com/VSCodeVim/Vim/issues/332)
- behavior of . is not correct for A and I [\#331](https://github.com/VSCodeVim/Vim/issues/331)
- J broken when both lines indented [\#330](https://github.com/VSCodeVim/Vim/issues/330)
- Clicking on EOL actually puts the cursor one too far to the right [\#328](https://github.com/VSCodeVim/Vim/issues/328)
- desired column no longer maintained...again [\#327](https://github.com/VSCodeVim/Vim/issues/327)
- Motions bug [\#323](https://github.com/VSCodeVim/Vim/issues/323)
- No handler found for the command: 'extension.vim\_esc' [\#306](https://github.com/VSCodeVim/Vim/issues/306)
- mapping jj to Esc and setting default keyboard does not seem to work [\#289](https://github.com/VSCodeVim/Vim/issues/289)
- \* and \# [\#283](https://github.com/VSCodeVim/Vim/issues/283)
- Commands preceded by number only perform commands once [\#184](https://github.com/VSCodeVim/Vim/issues/184)

**Merged pull requests:**

- Star and hash [\#335](https://github.com/VSCodeVim/Vim/pull/335) ([johnfn](https://github.com/johnfn))
- Tilde key toggles case and moves forwards [\#325](https://github.com/VSCodeVim/Vim/pull/325) ([markrendle](https://github.com/markrendle))
- Pressing Enter moves cursor to start of next line [\#324](https://github.com/VSCodeVim/Vim/pull/324) ([markrendle](https://github.com/markrendle))
- Add infrastructure for repeatable commands. [\#322](https://github.com/VSCodeVim/Vim/pull/322) ([johnfn](https://github.com/johnfn))
- Add support for 'U' uppercase [\#312](https://github.com/VSCodeVim/Vim/pull/312) ([rebornix](https://github.com/rebornix))

## [0.0.25](https://github.com/VSCodeVim/Vim/tree/0.0.25) (2016-06-20)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.25...0.0.25)

## [v0.0.25](https://github.com/VSCodeVim/Vim/tree/v0.0.25) (2016-06-20)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/0.0.24...v0.0.25)

**Closed issues:**

- Sometimes when opening files the cursor is stuck [\#314](https://github.com/VSCodeVim/Vim/issues/314)

**Merged pull requests:**

- Repeated motions [\#321](https://github.com/VSCodeVim/Vim/pull/321) ([johnfn](https://github.com/johnfn))

## [0.0.24](https://github.com/VSCodeVim/Vim/tree/0.0.24) (2016-06-19)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.24...0.0.24)

## [v0.0.24](https://github.com/VSCodeVim/Vim/tree/v0.0.24) (2016-06-19)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/0.0.23...v0.0.24)

**Closed issues:**

- \<enter\> should finish autocomplete suggestion [\#310](https://github.com/VSCodeVim/Vim/issues/310)
- Repeat actions with numbers [\#313](https://github.com/VSCodeVim/Vim/issues/313)

## [0.0.23](https://github.com/VSCodeVim/Vim/tree/0.0.23) (2016-06-19)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.23...0.0.23)

## [v0.0.23](https://github.com/VSCodeVim/Vim/tree/v0.0.23) (2016-06-19)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.22...v0.0.23)

**Closed issues:**

- A\<backspace\> doesn't work [\#318](https://github.com/VSCodeVim/Vim/issues/318)
- Click, click somewhere else, V is buggy [\#315](https://github.com/VSCodeVim/Vim/issues/315)
- % [\#311](https://github.com/VSCodeVim/Vim/issues/311)
- Cursor jump [\#299](https://github.com/VSCodeVim/Vim/issues/299)
- use --noImplicitAny typescript flag [\#295](https://github.com/VSCodeVim/Vim/issues/295)
- Backspace doesn't work with . [\#270](https://github.com/VSCodeVim/Vim/issues/270)
- Add tests for P [\#265](https://github.com/VSCodeVim/Vim/issues/265)
- better testing infrastructure [\#256](https://github.com/VSCodeVim/Vim/issues/256)

**Merged pull requests:**

- Add %. [\#319](https://github.com/VSCodeVim/Vim/pull/319) ([johnfn](https://github.com/johnfn))
- @darrenweston's test improvements + more work [\#316](https://github.com/VSCodeVim/Vim/pull/316) ([johnfn](https://github.com/johnfn))

## [v0.0.22](https://github.com/VSCodeVim/Vim/tree/v0.0.22) (2016-06-18)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.21...v0.0.22)

## [v0.0.21](https://github.com/VSCodeVim/Vim/tree/v0.0.21) (2016-06-17)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.20...v0.0.21)

**Closed issues:**

- Fix visual line mode upward delete [\#305](https://github.com/VSCodeVim/Vim/issues/305)
- No autocomplete [\#303](https://github.com/VSCodeVim/Vim/issues/303)
- Normal mode indicator [\#301](https://github.com/VSCodeVim/Vim/issues/301)
- Fix block cursor on empty line [\#300](https://github.com/VSCodeVim/Vim/issues/300)
- Selecting with mouse should go into visual mode [\#290](https://github.com/VSCodeVim/Vim/issues/290)
- insert text like it's an actual keystroke [\#286](https://github.com/VSCodeVim/Vim/issues/286)
- upward visual selections are messed up with operators [\#282](https://github.com/VSCodeVim/Vim/issues/282)
- cw on word at end of line doesn't work correctly [\#276](https://github.com/VSCodeVim/Vim/issues/276)
- {, } should insert at correct indentation level [\#268](https://github.com/VSCodeVim/Vim/issues/268)
- ddp incorrectly adds an additional blank line [\#248](https://github.com/VSCodeVim/Vim/issues/248)
- caw when word is last on line doesn't work correctly [\#247](https://github.com/VSCodeVim/Vim/issues/247)
- Curly braces for arrow functions are not auto completing/pairing. [\#158](https://github.com/VSCodeVim/Vim/issues/158)

**Merged pull requests:**

- Fix visual line selection from bottom to top. [\#307](https://github.com/VSCodeVim/Vim/pull/307) ([johnfn](https://github.com/johnfn))
- Fix autocomplete [\#304](https://github.com/VSCodeVim/Vim/pull/304) ([johnfn](https://github.com/johnfn))
- Select into visual mode [\#302](https://github.com/VSCodeVim/Vim/pull/302) ([johnfn](https://github.com/johnfn))
- Refactor dot [\#294](https://github.com/VSCodeVim/Vim/pull/294) ([johnfn](https://github.com/johnfn))

## [v0.0.20](https://github.com/VSCodeVim/Vim/tree/v0.0.20) (2016-06-13)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.19...v0.0.20)

**Closed issues:**

- D should not eat newline [\#285](https://github.com/VSCodeVim/Vim/issues/285)
- $ should not set desiredcolumn as part of operator [\#284](https://github.com/VSCodeVim/Vim/issues/284)
- dta, dfa are off by one [\#274](https://github.com/VSCodeVim/Vim/issues/274)
- D only deletes REST of line [\#273](https://github.com/VSCodeVim/Vim/issues/273)
- xp doesn't leave cursor on right character [\#272](https://github.com/VSCodeVim/Vim/issues/272)
- desired column no longer maintained [\#271](https://github.com/VSCodeVim/Vim/issues/271)
- Cursor is missed up in split panel view [\#269](https://github.com/VSCodeVim/Vim/issues/269)
- Add \>\>/\<\< [\#267](https://github.com/VSCodeVim/Vim/issues/267)
- O/o should maintain indentation level [\#266](https://github.com/VSCodeVim/Vim/issues/266)
- trl+ [\#263](https://github.com/VSCodeVim/Vim/issues/263)
- Clicking should update the cursor position [\#259](https://github.com/VSCodeVim/Vim/issues/259)
- D in visual line mode should also run the delete operator. [\#258](https://github.com/VSCodeVim/Vim/issues/258)
- The screen needs to keep the cursor in view. [\#257](https://github.com/VSCodeVim/Vim/issues/257)
- add tests for r [\#253](https://github.com/VSCodeVim/Vim/issues/253)
- Use VSCode native block cursor setting [\#132](https://github.com/VSCodeVim/Vim/issues/132)

**Merged pull requests:**

- Add simpler test mechanism and convert some tests [\#292](https://github.com/VSCodeVim/Vim/pull/292) ([darrenweston](https://github.com/darrenweston))
- Refactor motions [\#288](https://github.com/VSCodeVim/Vim/pull/288) ([johnfn](https://github.com/johnfn))
- Search [\#277](https://github.com/VSCodeVim/Vim/pull/277) ([johnfn](https://github.com/johnfn))
- Tests [\#275](https://github.com/VSCodeVim/Vim/pull/275) ([johnfn](https://github.com/johnfn))
- Add P. [\#262](https://github.com/VSCodeVim/Vim/pull/262) ([johnfn](https://github.com/johnfn))
- Add zz. [\#261](https://github.com/VSCodeVim/Vim/pull/261) ([johnfn](https://github.com/johnfn))
- Added some 'r' tests [\#260](https://github.com/VSCodeVim/Vim/pull/260) ([darrenweston](https://github.com/darrenweston))
- Add r. [\#252](https://github.com/VSCodeVim/Vim/pull/252) ([johnfn](https://github.com/johnfn))
- J [\#251](https://github.com/VSCodeVim/Vim/pull/251) ([johnfn](https://github.com/johnfn))
- Dot key. [\#249](https://github.com/VSCodeVim/Vim/pull/249) ([johnfn](https://github.com/johnfn))
- No longer special case insert mode keys. [\#246](https://github.com/VSCodeVim/Vim/pull/246) ([johnfn](https://github.com/johnfn))
- Use vscode built in support for block cursors [\#245](https://github.com/VSCodeVim/Vim/pull/245) ([Paxxi](https://github.com/Paxxi))

## [v0.0.19](https://github.com/VSCodeVim/Vim/tree/v0.0.19) (2016-06-07)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.18...v0.0.19)

**Closed issues:**

- Pressing dj or dk does not delete lines [\#204](https://github.com/VSCodeVim/Vim/issues/204)
- d{motion} support [\#197](https://github.com/VSCodeVim/Vim/issues/197)
- Switch to new VSCode APIs to better support input processing and autocompletion [\#188](https://github.com/VSCodeVim/Vim/issues/188)
- Enhancement: Add f F t T motions [\#187](https://github.com/VSCodeVim/Vim/issues/187)
- Why is yank not supported? [\#161](https://github.com/VSCodeVim/Vim/issues/161)
- suggest window is displayed despite not having any suggestions [\#126](https://github.com/VSCodeVim/Vim/issues/126)
- Add support for motion with jkl; [\#98](https://github.com/VSCodeVim/Vim/issues/98)

**Merged pull requests:**

- Add f, F, t and T motions [\#244](https://github.com/VSCodeVim/Vim/pull/244) ([johnfn](https://github.com/johnfn))
- Add visual line mode tests. [\#243](https://github.com/VSCodeVim/Vim/pull/243) ([johnfn](https://github.com/johnfn))
- List keys individually rather than as a string. [\#242](https://github.com/VSCodeVim/Vim/pull/242) ([johnfn](https://github.com/johnfn))
- Fix vims wonky visual eol behavior [\#241](https://github.com/VSCodeVim/Vim/pull/241) ([johnfn](https://github.com/johnfn))
- Add Visual Line mode [\#240](https://github.com/VSCodeVim/Vim/pull/240) ([johnfn](https://github.com/johnfn))
- Move word special case to appropriate place. [\#239](https://github.com/VSCodeVim/Vim/pull/239) ([johnfn](https://github.com/johnfn))
- Cleanup cursor drawing and remove Motion class [\#238](https://github.com/VSCodeVim/Vim/pull/238) ([johnfn](https://github.com/johnfn))
- dd, cc & yy tests [\#237](https://github.com/VSCodeVim/Vim/pull/237) ([johnfn](https://github.com/johnfn))
- Add cc/yy/dd. [\#236](https://github.com/VSCodeVim/Vim/pull/236) ([johnfn](https://github.com/johnfn))
- Add s keybinding [\#235](https://github.com/VSCodeVim/Vim/pull/235) ([Paxxi](https://github.com/Paxxi))
- Refactor commands \[WIP\] [\#234](https://github.com/VSCodeVim/Vim/pull/234) ([johnfn](https://github.com/johnfn))
- Don't use ctrl-c to leave insert mode by default. [\#233](https://github.com/VSCodeVim/Vim/pull/233) ([johnfn](https://github.com/johnfn))
- Add rudimentary register implementation. [\#232](https://github.com/VSCodeVim/Vim/pull/232) ([johnfn](https://github.com/johnfn))
- Rewrite normal mode tests. [\#231](https://github.com/VSCodeVim/Vim/pull/231) ([johnfn](https://github.com/johnfn))
- Rewrite Normal Mode tests to use the ModeHandler interface. [\#230](https://github.com/VSCodeVim/Vim/pull/230) ([johnfn](https://github.com/johnfn))
- Refactor CommandKeyMap [\#228](https://github.com/VSCodeVim/Vim/pull/228) ([jpoon](https://github.com/jpoon))
- Add yank support for Visual mode [\#217](https://github.com/VSCodeVim/Vim/pull/217) ([pjvds](https://github.com/pjvds))

## [v0.0.18](https://github.com/VSCodeVim/Vim/tree/v0.0.18) (2016-05-19)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.17...v0.0.18)

**Closed issues:**

- Can't use underscore key  [\#223](https://github.com/VSCodeVim/Vim/issues/223)

**Merged pull requests:**

- Install Gulp for Travis [\#225](https://github.com/VSCodeVim/Vim/pull/225) ([jpoon](https://github.com/jpoon))
- Update to vscode 0.10.12 APIs [\#224](https://github.com/VSCodeVim/Vim/pull/224) ([jpoon](https://github.com/jpoon))

## [v0.0.17](https://github.com/VSCodeVim/Vim/tree/v0.0.17) (2016-05-17)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.16...v0.0.17)

**Closed issues:**

- Debugging extension from vscode causes some keys to be gobbled [\#220](https://github.com/VSCodeVim/Vim/issues/220)
- Key bindings to collapse and expand code blocks [\#218](https://github.com/VSCodeVim/Vim/issues/218)
- Yanking [\#213](https://github.com/VSCodeVim/Vim/issues/213)

**Merged pull requests:**

- Added basic fold commands zc, zo, zC, zO. [\#222](https://github.com/VSCodeVim/Vim/pull/222) ([geksilla](https://github.com/geksilla))
- keymap configurations only override defaults that are changed [\#221](https://github.com/VSCodeVim/Vim/pull/221) ([adiviness](https://github.com/adiviness))
- Added basic support for rebinding keys. [\#219](https://github.com/VSCodeVim/Vim/pull/219) ([Lindenk](https://github.com/Lindenk))
- waffle.io Badge [\#216](https://github.com/VSCodeVim/Vim/pull/216) ([waffle-iron](https://github.com/waffle-iron))
- Add check mark to D key in README [\#215](https://github.com/VSCodeVim/Vim/pull/215) ([pjvds](https://github.com/pjvds))

## [v0.0.16](https://github.com/VSCodeVim/Vim/tree/v0.0.16) (2016-05-03)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.15...v0.0.16)

**Closed issues:**

- how to uninstall or disable it? [\#203](https://github.com/VSCodeVim/Vim/issues/203)
- Transitioning to Normal Mode at End of Line [\#201](https://github.com/VSCodeVim/Vim/issues/201)
- dw moves cursor to end of line [\#199](https://github.com/VSCodeVim/Vim/issues/199)
- "/" not searching current file but it searches "project files" [\#196](https://github.com/VSCodeVim/Vim/issues/196)
- Typing an opening or close brace triggers autocomplete menu, doesn't auto close brace [\#194](https://github.com/VSCodeVim/Vim/issues/194)
- Need yank and paste command.  Thanks. [\#193](https://github.com/VSCodeVim/Vim/issues/193)
- After installing this extension, caps lock stops working. [\#157](https://github.com/VSCodeVim/Vim/issues/157)
- Continuous Delivery  [\#148](https://github.com/VSCodeVim/Vim/issues/148)

**Merged pull requests:**

- I think this may fix the build failure. [\#209](https://github.com/VSCodeVim/Vim/pull/209) ([edthedev](https://github.com/edthedev))
- Support for copy and p command [\#208](https://github.com/VSCodeVim/Vim/pull/208) ([petegleeson](https://github.com/petegleeson))
- Fix issue / key doesn't search current file [\#205](https://github.com/VSCodeVim/Vim/pull/205) ([tnngo2](https://github.com/tnngo2))
- Fixes Incorrect Cursor Position after Transition into Normal Mode [\#202](https://github.com/VSCodeVim/Vim/pull/202) ([dpbackes](https://github.com/dpbackes))
- Fixes Issue with Cursor Position After 'dw' [\#200](https://github.com/VSCodeVim/Vim/pull/200) ([dpbackes](https://github.com/dpbackes))

## [v0.0.15](https://github.com/VSCodeVim/Vim/tree/v0.0.15) (2016-03-22)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.14...v0.0.15)

**Closed issues:**

- `x` at end of line doesn't work [\#127](https://github.com/VSCodeVim/Vim/issues/127)

**Merged pull requests:**

- Bug fixes [\#192](https://github.com/VSCodeVim/Vim/pull/192) ([jpoon](https://github.com/jpoon))

## [v0.0.14](https://github.com/VSCodeVim/Vim/tree/v0.0.14) (2016-03-21)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.13...v0.0.14)

**Closed issues:**

- Cannot do "search/find" in command mode [\#159](https://github.com/VSCodeVim/Vim/issues/159)
- implement forward commands [\#110](https://github.com/VSCodeVim/Vim/issues/110)

**Merged pull requests:**

- Bug fixes [\#191](https://github.com/VSCodeVim/Vim/pull/191) ([jpoon](https://github.com/jpoon))
- Search '/' in Command Mode [\#190](https://github.com/VSCodeVim/Vim/pull/190) ([jpoon](https://github.com/jpoon))

## [v0.0.13](https://github.com/VSCodeVim/Vim/tree/v0.0.13) (2016-03-18)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.12...v0.0.13)

**Closed issues:**

- Can't highlight last character of a line. [\#181](https://github.com/VSCodeVim/Vim/issues/181)
- 'c' key is not on roadmap [\#179](https://github.com/VSCodeVim/Vim/issues/179)
- Difficulty to use VIM on Windows 7 client [\#176](https://github.com/VSCodeVim/Vim/issues/176)
- AppVeyor Builds are Failing [\#173](https://github.com/VSCodeVim/Vim/issues/173)
- Change-Inner support [\#170](https://github.com/VSCodeVim/Vim/issues/170)
- How to turn off info bar on saving a file? [\#156](https://github.com/VSCodeVim/Vim/issues/156)
- Visual Selection of Text lines [\#129](https://github.com/VSCodeVim/Vim/issues/129)

**Merged pull requests:**

- fix appveyor build [\#189](https://github.com/VSCodeVim/Vim/pull/189) ([jpoon](https://github.com/jpoon))
- Fixup/highlight eol char [\#182](https://github.com/VSCodeVim/Vim/pull/182) ([khisakuni](https://github.com/khisakuni))
- c commands and ge motions [\#180](https://github.com/VSCodeVim/Vim/pull/180) ([frarees](https://github.com/frarees))
- add github\_token to appveyor/travis [\#178](https://github.com/VSCodeVim/Vim/pull/178) ([jpoon](https://github.com/jpoon))
- Commands can write to status bar [\#177](https://github.com/VSCodeVim/Vim/pull/177) ([frarees](https://github.com/frarees))
- Wait for test files to get written [\#175](https://github.com/VSCodeVim/Vim/pull/175) ([frarees](https://github.com/frarees))
- d{motion} support [\#174](https://github.com/VSCodeVim/Vim/pull/174) ([frarees](https://github.com/frarees))

## [v0.0.12](https://github.com/VSCodeVim/Vim/tree/v0.0.12) (2016-03-04)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.11...v0.0.12)

**Closed issues:**

- When you go into insert mode, the block cursor should disappear [\#149](https://github.com/VSCodeVim/Vim/issues/149)
- I cant write ; [\#135](https://github.com/VSCodeVim/Vim/issues/135)

**Merged pull requests:**

- Spanish keyboard mappings [\#169](https://github.com/VSCodeVim/Vim/pull/169) ([frarees](https://github.com/frarees))
- Fix visual mode activated on insert mode [\#168](https://github.com/VSCodeVim/Vim/pull/168) ([frarees](https://github.com/frarees))
- Fix lexer unreachable code causing build error [\#165](https://github.com/VSCodeVim/Vim/pull/165) ([frarees](https://github.com/frarees))
- Update Package Dependencies. Remove Ctrl+C [\#163](https://github.com/VSCodeVim/Vim/pull/163) ([jpoon](https://github.com/jpoon))
- Add E \(end of WORD\), and fix up e \(end of word\). [\#160](https://github.com/VSCodeVim/Vim/pull/160) ([tma-isbx](https://github.com/tma-isbx))
- Fix for block cursor in insert mode [\#154](https://github.com/VSCodeVim/Vim/pull/154) ([sWW26](https://github.com/sWW26))
- Move private methods and update readme [\#153](https://github.com/VSCodeVim/Vim/pull/153) ([tma-isbx](https://github.com/tma-isbx))
- Visual Mode + Rudimentary Operators [\#144](https://github.com/VSCodeVim/Vim/pull/144) ([johnfn](https://github.com/johnfn))

## [v0.0.11](https://github.com/VSCodeVim/Vim/tree/v0.0.11) (2016-02-18)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.10...v0.0.11)

**Closed issues:**

- Move to Typings. TSD has been deprecated. [\#151](https://github.com/VSCodeVim/Vim/issues/151)
- Ctrl+C does not put you in command mode [\#123](https://github.com/VSCodeVim/Vim/issues/123)

**Merged pull requests:**

- Upgrade to Typings as TSD has been deprecated [\#152](https://github.com/VSCodeVim/Vim/pull/152) ([jpoon](https://github.com/jpoon))
- Convert test to async/await style. [\#150](https://github.com/VSCodeVim/Vim/pull/150) ([johnfn](https://github.com/johnfn))
- Capital W/B word movement [\#147](https://github.com/VSCodeVim/Vim/pull/147) ([tma-isbx](https://github.com/tma-isbx))
- Implement 'X' in normal mode \(backspace\) [\#145](https://github.com/VSCodeVim/Vim/pull/145) ([tma-isbx](https://github.com/tma-isbx))
- Fix b motion. [\#143](https://github.com/VSCodeVim/Vim/pull/143) ([johnfn](https://github.com/johnfn))
- Implement ctrl+f/ctrl+b \(PageDown/PageUp\) [\#142](https://github.com/VSCodeVim/Vim/pull/142) ([tma-isbx](https://github.com/tma-isbx))
- \[\#127\] Fix 'x' behavior at EOL  [\#141](https://github.com/VSCodeVim/Vim/pull/141) ([tma-isbx](https://github.com/tma-isbx))
- Implement % to jump to matching brace [\#140](https://github.com/VSCodeVim/Vim/pull/140) ([tma-isbx](https://github.com/tma-isbx))
- Add ctrl-c. [\#139](https://github.com/VSCodeVim/Vim/pull/139) ([johnfn](https://github.com/johnfn))
- Fix word and back-word motions, and fix tests. [\#138](https://github.com/VSCodeVim/Vim/pull/138) ([johnfn](https://github.com/johnfn))
- Convert to ES6, Promises, async and await. [\#137](https://github.com/VSCodeVim/Vim/pull/137) ([johnfn](https://github.com/johnfn))

## [v0.0.10](https://github.com/VSCodeVim/Vim/tree/v0.0.10) (2016-02-01)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/0.0.9...v0.0.10)

**Merged pull requests:**

- Implement % to jump to matching brace [\#134](https://github.com/VSCodeVim/Vim/pull/134) ([tma-isbx](https://github.com/tma-isbx))
- Add paragraph motions [\#133](https://github.com/VSCodeVim/Vim/pull/133) ([johnfn](https://github.com/johnfn))
- Add Swedish keyboard layout [\#130](https://github.com/VSCodeVim/Vim/pull/130) ([AntonAderum](https://github.com/AntonAderum))

## [0.0.9](https://github.com/VSCodeVim/Vim/tree/0.0.9) (2016-01-06)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.9...0.0.9)

## [v0.0.9](https://github.com/VSCodeVim/Vim/tree/v0.0.9) (2016-01-06)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.8...v0.0.9)

**Closed issues:**

- Missing danish keyboard layout [\#124](https://github.com/VSCodeVim/Vim/issues/124)

**Merged pull requests:**

- added danish keyboard layout - fix issue \#124 [\#125](https://github.com/VSCodeVim/Vim/pull/125) ([kedde](https://github.com/kedde))
- Delete Right when user presses x [\#122](https://github.com/VSCodeVim/Vim/pull/122) ([sharpoverride](https://github.com/sharpoverride))

## [v0.0.8](https://github.com/VSCodeVim/Vim/tree/v0.0.8) (2016-01-03)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.7...v0.0.8)

## [v0.0.7](https://github.com/VSCodeVim/Vim/tree/v0.0.7) (2016-01-03)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.6...v0.0.7)

**Closed issues:**

- Test runner [\#118](https://github.com/VSCodeVim/Vim/issues/118)
- Fat cursor during Normal mode [\#117](https://github.com/VSCodeVim/Vim/issues/117)
- .vimrc? [\#101](https://github.com/VSCodeVim/Vim/issues/101)
- renaming extension.ts to vim.ts [\#81](https://github.com/VSCodeVim/Vim/issues/81)
- Block cursor in command mode [\#19](https://github.com/VSCodeVim/Vim/issues/19)
- run all tests in CI server\(s\) [\#15](https://github.com/VSCodeVim/Vim/issues/15)

**Merged pull requests:**

- Block Cursor [\#120](https://github.com/VSCodeVim/Vim/pull/120) ([jpoon](https://github.com/jpoon))
- BugFix: swapped cursor and caret. desired column not updated properly [\#119](https://github.com/VSCodeVim/Vim/pull/119) ([jpoon](https://github.com/jpoon))
- Readme: update with keyboard configuration  [\#116](https://github.com/VSCodeVim/Vim/pull/116) ([jpoon](https://github.com/jpoon))
- Tests: Enable all tests to be run in Travis CI [\#115](https://github.com/VSCodeVim/Vim/pull/115) ([jpoon](https://github.com/jpoon))
- Cleanup [\#114](https://github.com/VSCodeVim/Vim/pull/114) ([jpoon](https://github.com/jpoon))

## [v0.0.6](https://github.com/VSCodeVim/Vim/tree/v0.0.6) (2015-12-30)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.5...v0.0.6)

**Closed issues:**

- Using $ and ^ make the cursor move to the last line that 'insert' mode was used on [\#111](https://github.com/VSCodeVim/Vim/issues/111)
- character position does not always persist on commands "j","k" [\#108](https://github.com/VSCodeVim/Vim/issues/108)
- Implement `e` [\#103](https://github.com/VSCodeVim/Vim/issues/103)
- Question about tests [\#99](https://github.com/VSCodeVim/Vim/issues/99)
- 0.3 doesn't work [\#93](https://github.com/VSCodeVim/Vim/issues/93)

**Merged pull requests:**

- Cleanup [\#113](https://github.com/VSCodeVim/Vim/pull/113) ([jpoon](https://github.com/jpoon))
- Motion Fixes [\#112](https://github.com/VSCodeVim/Vim/pull/112) ([jpoon](https://github.com/jpoon))
- Fix character position persistence on up/down commands, add : "e", "0", and fix "^"  [\#109](https://github.com/VSCodeVim/Vim/pull/109) ([corymickelson](https://github.com/corymickelson))

## [v0.0.5](https://github.com/VSCodeVim/Vim/tree/v0.0.5) (2015-12-09)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.3...v0.0.5)

**Closed issues:**

- alt-gr key combination not available [\#97](https://github.com/VSCodeVim/Vim/issues/97)

## [v0.0.3](https://github.com/VSCodeVim/Vim/tree/v0.0.3) (2015-12-04)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.2...v0.0.3)

**Closed issues:**

- Motion: View not updated when moving cursor/caret to an area off screen [\#89](https://github.com/VSCodeVim/Vim/issues/89)
- Tests: unit tests are failing on Windows [\#88](https://github.com/VSCodeVim/Vim/issues/88)
- convention for module names [\#84](https://github.com/VSCodeVim/Vim/issues/84)
- Builds: Travis CI PR builds failing due to TSD\_GITHUB\_TOKEN [\#73](https://github.com/VSCodeVim/Vim/issues/73)
- Shouldn't be able to move the cursor past the last character in a line [\#70](https://github.com/VSCodeVim/Vim/issues/70)
- Escape at the beginning of line should not move cursor to previous line [\#62](https://github.com/VSCodeVim/Vim/issues/62)
- normal mode keyhandler [\#59](https://github.com/VSCodeVim/Vim/issues/59)
- gulp error [\#57](https://github.com/VSCodeVim/Vim/issues/57)
- AppVeyor: Doesn't build on PR [\#54](https://github.com/VSCodeVim/Vim/issues/54)
- IntelliSense/completion doesn't stay open in insert mode [\#51](https://github.com/VSCodeVim/Vim/issues/51)
- TextEditor.Insert cannot make several insertions in one go [\#48](https://github.com/VSCodeVim/Vim/issues/48)
- bad experience for users with non-US keyboard layouts [\#47](https://github.com/VSCodeVim/Vim/issues/47)
- discussion: goals for first public version [\#29](https://github.com/VSCodeVim/Vim/issues/29)
- Set TSD\_GITHUB\_TOKEN in AppVeyor [\#24](https://github.com/VSCodeVim/Vim/issues/24)
- style: capitalization of member names [\#23](https://github.com/VSCodeVim/Vim/issues/23)
- Contributing [\#17](https://github.com/VSCodeVim/Vim/issues/17)

**Merged pull requests:**

- Promisify [\#92](https://github.com/VSCodeVim/Vim/pull/92) ([jpoon](https://github.com/jpoon))
- fix cursor position after entering command mode \(again\) [\#91](https://github.com/VSCodeVim/Vim/pull/91) ([kimitake](https://github.com/kimitake))
- Refactor motion. [\#87](https://github.com/VSCodeVim/Vim/pull/87) ([jpoon](https://github.com/jpoon))
- Added CONTRIBUTING doc [\#83](https://github.com/VSCodeVim/Vim/pull/83) ([markrendle](https://github.com/markrendle))
- readme: update more detailed contributing info [\#80](https://github.com/VSCodeVim/Vim/pull/80) ([jpoon](https://github.com/jpoon))
- Created tests for modeInsert [\#79](https://github.com/VSCodeVim/Vim/pull/79) ([benjaminRomano](https://github.com/benjaminRomano))
- gulp: add trim-whitespace task [\#78](https://github.com/VSCodeVim/Vim/pull/78) ([jpoon](https://github.com/jpoon))
- implement correct w,b motion behaviour [\#76](https://github.com/VSCodeVim/Vim/pull/76) ([adriaanp](https://github.com/adriaanp))
- Fix PR builds [\#75](https://github.com/VSCodeVim/Vim/pull/75) ([jpoon](https://github.com/jpoon))
- Tests [\#74](https://github.com/VSCodeVim/Vim/pull/74) ([jpoon](https://github.com/jpoon))
- Add commands support for 'gg' and 'G' [\#71](https://github.com/VSCodeVim/Vim/pull/71) ([liushuping](https://github.com/liushuping))
- fix line end determination for a, A, $ [\#68](https://github.com/VSCodeVim/Vim/pull/68) ([kimitake](https://github.com/kimitake))
- '$' and '^' for Moving to beginning and end of line [\#66](https://github.com/VSCodeVim/Vim/pull/66) ([josephliccini](https://github.com/josephliccini))
- support x command [\#65](https://github.com/VSCodeVim/Vim/pull/65) ([kimitake](https://github.com/kimitake))
- Update README.md [\#63](https://github.com/VSCodeVim/Vim/pull/63) ([markrendle](https://github.com/markrendle))
- map keys from US keyboard to other layouts [\#61](https://github.com/VSCodeVim/Vim/pull/61) ([guillermooo](https://github.com/guillermooo))
- fix bug for Cursor class [\#58](https://github.com/VSCodeVim/Vim/pull/58) ([kimitake](https://github.com/kimitake))
- Cursor Motions [\#56](https://github.com/VSCodeVim/Vim/pull/56) ([jpoon](https://github.com/jpoon))
- Add word motion and db [\#53](https://github.com/VSCodeVim/Vim/pull/53) ([adriaanp](https://github.com/adriaanp))

## [v0.0.2](https://github.com/VSCodeVim/Vim/tree/v0.0.2) (2015-11-29)
[Full Changelog](https://github.com/VSCodeVim/Vim/compare/v0.0.1...v0.0.2)

**Merged pull requests:**

- move cursor position after getting normal mode [\#50](https://github.com/VSCodeVim/Vim/pull/50) ([kimitake](https://github.com/kimitake))

## [v0.0.1](https://github.com/VSCodeVim/Vim/tree/v0.0.1) (2015-11-29)
**Closed issues:**

- dead keys are dead [\#39](https://github.com/VSCodeVim/Vim/issues/39)
- VSC can't handle '\<' key in key binding \(package.json\) [\#36](https://github.com/VSCodeVim/Vim/issues/36)
- can't use dead keys [\#33](https://github.com/VSCodeVim/Vim/issues/33)
- request "true" command/normal mode for VS Code [\#13](https://github.com/VSCodeVim/Vim/issues/13)
- coding style [\#12](https://github.com/VSCodeVim/Vim/issues/12)
- keys not working in international keyboards [\#9](https://github.com/VSCodeVim/Vim/issues/9)
- add appveyor ci [\#8](https://github.com/VSCodeVim/Vim/issues/8)
- vim needs to be activated always, for all files [\#2](https://github.com/VSCodeVim/Vim/issues/2)
- add config to launch tests [\#1](https://github.com/VSCodeVim/Vim/issues/1)

**Merged pull requests:**

- Implement Redo, Refactor Keybindings [\#46](https://github.com/VSCodeVim/Vim/pull/46) ([jpoon](https://github.com/jpoon))
- reorganize tests; add tests [\#45](https://github.com/VSCodeVim/Vim/pull/45) ([guillermooo](https://github.com/guillermooo))
- fixes; add VimError class [\#43](https://github.com/VSCodeVim/Vim/pull/43) ([guillermooo](https://github.com/guillermooo))
- Refactor cmdline [\#42](https://github.com/VSCodeVim/Vim/pull/42) ([guillermooo](https://github.com/guillermooo))
- ensure user can dismiss global messages with esc [\#41](https://github.com/VSCodeVim/Vim/pull/41) ([guillermooo](https://github.com/guillermooo))
- implement :quit [\#40](https://github.com/VSCodeVim/Vim/pull/40) ([guillermooo](https://github.com/guillermooo))
- Commands: `u` and `dw` [\#38](https://github.com/VSCodeVim/Vim/pull/38) ([jpoon](https://github.com/jpoon))
- Update metadata getting ready for a release [\#37](https://github.com/VSCodeVim/Vim/pull/37) ([jpoon](https://github.com/jpoon))
- rename command mode to normal mode [\#34](https://github.com/VSCodeVim/Vim/pull/34) ([jpoon](https://github.com/jpoon))
- Support `\<\<` and `\>\>` [\#32](https://github.com/VSCodeVim/Vim/pull/32) ([jpoon](https://github.com/jpoon))
- Add Slackin to Readme [\#31](https://github.com/VSCodeVim/Vim/pull/31) ([jpoon](https://github.com/jpoon))
- start code in CI server [\#28](https://github.com/VSCodeVim/Vim/pull/28) ([guillermooo](https://github.com/guillermooo))
- assorted fixes [\#27](https://github.com/VSCodeVim/Vim/pull/27) ([guillermooo](https://github.com/guillermooo))
- travis: turn off email notifications [\#25](https://github.com/VSCodeVim/Vim/pull/25) ([jpoon](https://github.com/jpoon))
- add keys [\#22](https://github.com/VSCodeVim/Vim/pull/22) ([guillermooo](https://github.com/guillermooo))
- Ex mode [\#20](https://github.com/VSCodeVim/Vim/pull/20) ([guillermooo](https://github.com/guillermooo))
- Command/Insert Modes [\#16](https://github.com/VSCodeVim/Vim/pull/16) ([jpoon](https://github.com/jpoon))
- Update tslint to vscode official style guidelines [\#14](https://github.com/VSCodeVim/Vim/pull/14) ([jpoon](https://github.com/jpoon))
- Run Tests a la Gulp [\#11](https://github.com/VSCodeVim/Vim/pull/11) ([jpoon](https://github.com/jpoon))
- assorted fixes [\#10](https://github.com/VSCodeVim/Vim/pull/10) ([guillermooo](https://github.com/guillermooo))
- Assorted fixes [\#7](https://github.com/VSCodeVim/Vim/pull/7) ([guillermooo](https://github.com/guillermooo))
- add gulp + tslint [\#6](https://github.com/VSCodeVim/Vim/pull/6) ([jpoon](https://github.com/jpoon))
- command line mode refactoring [\#5](https://github.com/VSCodeVim/Vim/pull/5) ([guillermooo](https://github.com/guillermooo))
- Navigation mode [\#4](https://github.com/VSCodeVim/Vim/pull/4) ([jpoon](https://github.com/jpoon))
- Add ex mode [\#3](https://github.com/VSCodeVim/Vim/pull/3) ([guillermooo](https://github.com/guillermooo))



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*