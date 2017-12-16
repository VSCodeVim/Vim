# Change Log

## [v0.10.6](https://github.com/vscodevim/vim/tree/v0.10.6) (2017-12-15)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.5...v0.10.6)

**Closed issues:**

- Escape replace mode with \<C-\[\> [\#2221](https://github.com/VSCodeVim/Vim/issues/2221)
- Cannot create a GoLang file\(.go\) from the explorer. [\#2219](https://github.com/VSCodeVim/Vim/issues/2219)
- Vim shortcuts leak to sidebar [\#2209](https://github.com/VSCodeVim/Vim/issues/2209)
- Unhandled rejection in promise from vscode-vim [\#2201](https://github.com/VSCodeVim/Vim/issues/2201)
- Enabling vscodevim causes 30% spike in CPU usage [\#2195](https://github.com/VSCodeVim/Vim/issues/2195)
- Enabling vscodevim causes 30 [\#2194](https://github.com/VSCodeVim/Vim/issues/2194)
- Bug - cannot create or rename a new file or folder in Explorer tab - typing broken [\#2189](https://github.com/VSCodeVim/Vim/issues/2189)
- \[Feature Request\] Treat lines with soft wrap the same way as non-broken lines when using j,k [\#2186](https://github.com/VSCodeVim/Vim/issues/2186)
- Cannot find module 'lodash' [\#2185](https://github.com/VSCodeVim/Vim/issues/2185)
- Visual mode indents are incorrect when visual selection is done backwards/upwards [\#2182](https://github.com/VSCodeVim/Vim/issues/2182)
- Search by filename using '/' in explorer list [\#2181](https://github.com/VSCodeVim/Vim/issues/2181)
- VsCodeVim not working on Windows10 [\#2180](https://github.com/VSCodeVim/Vim/issues/2180)
- Some keystrokes are not recognized as filename input in VSCode-Insiders [\#2179](https://github.com/VSCodeVim/Vim/issues/2179)
- Cannot create a new file or folder in explorer viewlet that contains the letter "o" [\#2177](https://github.com/VSCodeVim/Vim/issues/2177)
- vim.insertModeKeyBindingNonRecursive possible bug [\#2173](https://github.com/VSCodeVim/Vim/issues/2173)
- :edit! triggers an open file dialog box [\#2172](https://github.com/VSCodeVim/Vim/issues/2172)
- Slack seems invite only [\#2169](https://github.com/VSCodeVim/Vim/issues/2169)
- Spacing bug using surround until end of word \(ysw\) [\#2168](https://github.com/VSCodeVim/Vim/issues/2168)
- `statusBarColorControl` option is using 100% of CPU [\#2166](https://github.com/VSCodeVim/Vim/issues/2166)
- The cursor jumps to the end of the file [\#2136](https://github.com/VSCodeVim/Vim/issues/2136)
- Typing space fast prints out a dot? [\#2108](https://github.com/VSCodeVim/Vim/issues/2108)
- insert mode move cursor [\#2035](https://github.com/VSCodeVim/Vim/issues/2035)
- Visual Block Mode - strange behavior with $ [\#1945](https://github.com/VSCodeVim/Vim/issues/1945)
- otherModeNotRecursive mappings ignores the not-recursive part in visual block mode [\#1869](https://github.com/VSCodeVim/Vim/issues/1869)

**Merged pull requests:**

- update\(package.json\) [\#2225](https://github.com/VSCodeVim/Vim/pull/2225) (@jpoon)
- Add C-\[ to Replace Mode escape [\#2223](https://github.com/VSCodeVim/Vim/pull/2223) (@deybhayden)
- Do not open open file dialog when calling `:e!` [\#2215](https://github.com/VSCodeVim/Vim/pull/2215) (@squgeim)
- Update `list.\*` command keybindings [\#2213](https://github.com/VSCodeVim/Vim/pull/2213) (@joaomoreno)
- moar clean-up [\#2208](https://github.com/VSCodeVim/Vim/pull/2208) (@jpoon)
- Fix cursor position of \<C-o\> command in insertmode [\#2206](https://github.com/VSCodeVim/Vim/pull/2206) (@hy950831)
- refactor\(modehandler-updateview\): use map and remove unused context [\#2197](https://github.com/VSCodeVim/Vim/pull/2197) (@jpoon)
- Integrate TravisBuddy [\#2191](https://github.com/VSCodeVim/Vim/pull/2191) (@bluzi)
- Fix \#2168: Surround offset [\#2171](https://github.com/VSCodeVim/Vim/pull/2171) (@westim)
- Fix \#1945 $ in VisualBlock works on ragged lines [\#2096](https://github.com/VSCodeVim/Vim/pull/2096) (@Strafos)

## [v0.10.5](https://github.com/vscodevim/vim/tree/v0.10.5) (2017-11-21)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.4...v0.10.5)

**Closed issues:**

- difference between mac and windows [\#2160](https://github.com/VSCodeVim/Vim/issues/2160)
- Substitution command not recognising \/ \(escaped slash\) [\#2155](https://github.com/VSCodeVim/Vim/issues/2155)
- adding configs for `statusBarColorControl` and `statusBarColors` existing `workbench.colorCustomizations` settings are removed [\#2150](https://github.com/VSCodeVim/Vim/issues/2150)
- `:qall` does nothing [\#2149](https://github.com/VSCodeVim/Vim/issues/2149)
- :vs launches file dialog [\#2148](https://github.com/VSCodeVim/Vim/issues/2148)
- Vim global replace \ with / does not work  [\#2133](https://github.com/VSCodeVim/Vim/issues/2133)
- crashes editor \(cant type\) with twig code [\#2048](https://github.com/VSCodeVim/Vim/issues/2048)
- Ctrl-C in Visual Mode should copy to clipboard [\#1896](https://github.com/VSCodeVim/Vim/issues/1896)
- Extreme delay when writing. [\#1789](https://github.com/VSCodeVim/Vim/issues/1789)
- Search String not Displayed [\#1776](https://github.com/VSCodeVim/Vim/issues/1776)
- Status bar color shared between VS Code windows [\#1689](https://github.com/VSCodeVim/Vim/issues/1689)
- Test - Renable "Can 'D'elete the characters under multiple cursors until the end of the line" [\#1673](https://github.com/VSCodeVim/Vim/issues/1673)
- workbench.colorCustomizations override in main settings.json [\#1654](https://github.com/VSCodeVim/Vim/issues/1654)
- Option to hide vim command line popup [\#1556](https://github.com/VSCodeVim/Vim/issues/1556)
- Editor freezes on CMD+S [\#1551](https://github.com/VSCodeVim/Vim/issues/1551)
- Imitate default vim key bindings [\#1451](https://github.com/VSCodeVim/Vim/issues/1451)
- List recent commands in command bar [\#1212](https://github.com/VSCodeVim/Vim/issues/1212)

**Merged pull requests:**

- Fixed incorrect styling of 'fake' cursors [\#2161](https://github.com/VSCodeVim/Vim/pull/2161) (@Chillee)
- Fix \#2155, Fix \#2133: escape delimiter substitute [\#2159](https://github.com/VSCodeVim/Vim/pull/2159) (@westim)
- Fix \#2148: vertical split command [\#2158](https://github.com/VSCodeVim/Vim/pull/2158) (@westim)
- fix\(1673\): re-enable some tests [\#2152](https://github.com/VSCodeVim/Vim/pull/2152) (@jpoon)
- keep workbench color customizations when using status bar color [\#2122](https://github.com/VSCodeVim/Vim/pull/2122) (@rodrigo-garcia-leon)

## [v0.10.4](https://github.com/vscodevim/vim/tree/v0.10.4) (2017-11-14)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.3...v0.10.4)

**Closed issues:**

- vim.handleKeys doesn't work  in linux [\#2146](https://github.com/VSCodeVim/Vim/issues/2146)
- `handleKeys` doesn't work in Ver 0.10.3 [\#2145](https://github.com/VSCodeVim/Vim/issues/2145)
- NeoVim "Never Show Again" dismissal is not working [\#1848](https://github.com/VSCodeVim/Vim/issues/1848)
- VSCodeVim SOMETIMES stuck after visiting settings.json [\#1584](https://github.com/VSCodeVim/Vim/issues/1584)
- Change log link to release text. [\#1395](https://github.com/VSCodeVim/Vim/issues/1395)
- Support for Tags is missing. [\#1150](https://github.com/VSCodeVim/Vim/issues/1150)

**Merged pull requests:**

- fix\(2145\): reverse logic [\#2147](https://github.com/VSCodeVim/Vim/pull/2147) (@jpoon)

## [v0.10.3](https://github.com/vscodevim/vim/tree/v0.10.3) (2017-11-13)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.2...v0.10.3)

**Closed issues:**

- Unable to enter command mode after updating to VSCode version 1.18.0 [\#2130](https://github.com/VSCodeVim/Vim/issues/2130)
- movement key bindings not fluent [\#2128](https://github.com/VSCodeVim/Vim/issues/2128)
- `\>` character cannot be inserted [\#2127](https://github.com/VSCodeVim/Vim/issues/2127)
- The movements `` and '' do not work. [\#2118](https://github.com/VSCodeVim/Vim/issues/2118)
- Cannot remap another key to "u", "C" or "gI" via vim.otherModesKeyBindingsNonRecursive [\#2116](https://github.com/VSCodeVim/Vim/issues/2116)
- Start in Disabled mode [\#2113](https://github.com/VSCodeVim/Vim/issues/2113)
- How do I implement fast moving between Windows [\#2110](https://github.com/VSCodeVim/Vim/issues/2110)
- Paste command deletes selected text [\#2106](https://github.com/VSCodeVim/Vim/issues/2106)
- CommandOpenFold: Don't set `direction: 'up'` [\#2103](https://github.com/VSCodeVim/Vim/issues/2103)
- Case sensitive search option - \c / \C [\#2100](https://github.com/VSCodeVim/Vim/issues/2100)
- Cannot read property 'selection' of undefined [\#2099](https://github.com/VSCodeVim/Vim/issues/2099)
- Search for end of line \($\) returns end of file [\#2086](https://github.com/VSCodeVim/Vim/issues/2086)
- Remapping Caps Lock to Escape does not work [\#2085](https://github.com/VSCodeVim/Vim/issues/2085)
- cs{\[ over multiple lines [\#2080](https://github.com/VSCodeVim/Vim/issues/2080)
- Normal key can't working when enable system clipboad. [\#2074](https://github.com/VSCodeVim/Vim/issues/2074)
- Incorrect cursor position after `vi{` [\#2063](https://github.com/VSCodeVim/Vim/issues/2063)
- Copying does not work when selecting backwards with arrow keys [\#2053](https://github.com/VSCodeVim/Vim/issues/2053)
- \[Bug Report\] `vim.useSystemClipboard: false` affects default Vim behaviour. [\#2051](https://github.com/VSCodeVim/Vim/issues/2051)
- Switch to Normal mode after pressed Ctrl+c and Visual mode after double clicked [\#2013](https://github.com/VSCodeVim/Vim/issues/2013)
- Capital 'U' doesn't work [\#1974](https://github.com/VSCodeVim/Vim/issues/1974)
- Navigation keys problem with certain file [\#1965](https://github.com/VSCodeVim/Vim/issues/1965)
- Make :e open up a file dialog if no file name is passed in [\#1877](https://github.com/VSCodeVim/Vim/issues/1877)
- Surround cs\[{ bug [\#1852](https://github.com/VSCodeVim/Vim/issues/1852)
- Visual block mode doesn't navigate with gj/gk [\#1772](https://github.com/VSCodeVim/Vim/issues/1772)
- Easymotion "Start of word Forwards/backwards" doesn't work for large files [\#1683](https://github.com/VSCodeVim/Vim/issues/1683)
- CI/CD: Create releases under "VSCodeVim" bot [\#1586](https://github.com/VSCodeVim/Vim/issues/1586)

**Merged pull requests:**

- Fix release [\#2142](https://github.com/VSCodeVim/Vim/pull/2142) (@jpoon)
- Code Cleanup [\#2138](https://github.com/VSCodeVim/Vim/pull/2138) (@jpoon)
- Fixed typo in README [\#2137](https://github.com/VSCodeVim/Vim/pull/2137) (@Nonoctis)
- fix\(travis\): use lts/carbon \(v8.9.1\) for travis [\#2129](https://github.com/VSCodeVim/Vim/pull/2129) (@jpoon)
- Fix ^, $, add case sensitivity override in search [\#2123](https://github.com/VSCodeVim/Vim/pull/2123) (@parkovski)
- fix vscode launch/tasks [\#2121](https://github.com/VSCodeVim/Vim/pull/2121) (@jpoon)
- Fix remapping keys to actions with "mustBeFirstKey", fixes \#2216 [\#2117](https://github.com/VSCodeVim/Vim/pull/2117) (@ohjames)
- Fixes \#2113: Start in Disabled mode configuration. [\#2115](https://github.com/VSCodeVim/Vim/pull/2115) (@westim)
- fix\(line-endings\): change all files to lf [\#2111](https://github.com/VSCodeVim/Vim/pull/2111) (@jpoon)
- fix\(build\): position does not exist for replacetexttransformation [\#2105](https://github.com/VSCodeVim/Vim/pull/2105) (@jpoon)
- Use 'editor.unfold' with direction: 'down' [\#2104](https://github.com/VSCodeVim/Vim/pull/2104) (@aeschli)
- Pesky penguin CHANGELOG.md update. [\#2091](https://github.com/VSCodeVim/Vim/pull/2091) (@westim)
- Added unit tests for movement commands. [\#2088](https://github.com/VSCodeVim/Vim/pull/2088) (@westim)
- Fix \#2080 [\#2087](https://github.com/VSCodeVim/Vim/pull/2087) (@Strafos)
- Update Contributors [\#2083](https://github.com/VSCodeVim/Vim/pull/2083) (@mcsosa121)
- Fixes \#1974: U command [\#2081](https://github.com/VSCodeVim/Vim/pull/2081) (@westim)
- Fix \#2063 [\#2079](https://github.com/VSCodeVim/Vim/pull/2079) (@Strafos)
- Fix \#1852 surround issue at end of line [\#2077](https://github.com/VSCodeVim/Vim/pull/2077) (@Strafos)
- added `showOpenDialog` when typing emtpy e [\#2067](https://github.com/VSCodeVim/Vim/pull/2067) (@DanEEStar)
- Fix gj/gk in visual block mode [\#2046](https://github.com/VSCodeVim/Vim/pull/2046) (@oliver-newman)

## [v0.10.2](https://github.com/vscodevim/vim/tree/v0.10.2) (2017-10-14)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.1...v0.10.2)

**Closed issues:**

- star \* \(shift+8\) doesn't move to next occurrence correctly [\#2068](https://github.com/VSCodeVim/Vim/issues/2068)
- Unable to close windows in normal mode with ctrl-w [\#2056](https://github.com/VSCodeVim/Vim/issues/2056)
- :y doesn't yank a line in command mode [\#2052](https://github.com/VSCodeVim/Vim/issues/2052)
- \[Feature Request\] Configurable cursor style [\#2050](https://github.com/VSCodeVim/Vim/issues/2050)
- Vim surround with left parenthesis is not working.   [\#2049](https://github.com/VSCodeVim/Vim/issues/2049)
- \<CapsLock\> mapped to \<Esc\> cant return to normal mode from insert mode [\#2047](https://github.com/VSCodeVim/Vim/issues/2047)
- Key mapped to leader can't be used as normal key in non-insert mode [\#2045](https://github.com/VSCodeVim/Vim/issues/2045)
- \[Mac\] cmd+` doesn't switch between window [\#2034](https://github.com/VSCodeVim/Vim/issues/2034)
- EasyMotion not being applied to every word [\#2016](https://github.com/VSCodeVim/Vim/issues/2016)
- Backreference does not work [\#2011](https://github.com/VSCodeVim/Vim/issues/2011)
- w command doesn't trigger Save hooks [\#1984](https://github.com/VSCodeVim/Vim/issues/1984)
- Cursur does not move when open big files [\#1954](https://github.com/VSCodeVim/Vim/issues/1954)
- can't bind :nohl to \<enter\> [\#1895](https://github.com/VSCodeVim/Vim/issues/1895)
- Selecting left while in visual multi cursor mode causes jumping cursors [\#1860](https://github.com/VSCodeVim/Vim/issues/1860)
- Feature Request: Make cgn work after / [\#1838](https://github.com/VSCodeVim/Vim/issues/1838)
- g; and g, lag, off by one [\#1824](https://github.com/VSCodeVim/Vim/issues/1824)
- Using vim command/':' in settings.json should stay focused in editor [\#1813](https://github.com/VSCodeVim/Vim/issues/1813)
- Enable Vim plugin discovery problems [\#1744](https://github.com/VSCodeVim/Vim/issues/1744)
- vim.remap command seems not working. [\#1662](https://github.com/VSCodeVim/Vim/issues/1662)
- REQUEST: Setting to disable the vim mode text in the status bar [\#1576](https://github.com/VSCodeVim/Vim/issues/1576)
- `''` not working [\#1420](https://github.com/VSCodeVim/Vim/issues/1420)
- Add support for gi, '., and `. [\#1248](https://github.com/VSCodeVim/Vim/issues/1248)
- Press backspace to remove the last Chinese character,however it remove the last but one [\#1213](https://github.com/VSCodeVim/Vim/issues/1213)
- "Back to last edit" command [\#1133](https://github.com/VSCodeVim/Vim/issues/1133)

**Merged pull requests:**

- Update ROADMAP.md [\#2073](https://github.com/VSCodeVim/Vim/pull/2073) (@xconverge)
- Change ignoreFocusOut to false for the command line [\#2072](https://github.com/VSCodeVim/Vim/pull/2072) (@gadkadosh)
- Upgrade packages [\#2070](https://github.com/VSCodeVim/Vim/pull/2070) (@jpoon)
- fixes \#1576 and showcmd configuration option [\#2069](https://github.com/VSCodeVim/Vim/pull/2069) (@xconverge)
- removed code which is not needed anymore due to \#2062 [\#2065](https://github.com/VSCodeVim/Vim/pull/2065) (@DanEEStar)
- An option to show the colon at the start of the command line box [\#2064](https://github.com/VSCodeVim/Vim/pull/2064) (@gadkadosh)
- Bugfix \#1951: text selection in insert mode [\#2062](https://github.com/VSCodeVim/Vim/pull/2062) (@DanEEStar)
- Dispose modehandler if NO documents match the modehandler document anymore [\#2058](https://github.com/VSCodeVim/Vim/pull/2058) (@xconverge)
- Fixes \#2050 Allow custom cursor styles per mode [\#2054](https://github.com/VSCodeVim/Vim/pull/2054) (@xconverge)
- Fixes \#1824: g; and g, commands. [\#2040](https://github.com/VSCodeVim/Vim/pull/2040) (@westim)
- Fixes \#1248: support for '., `., and gi commands. [\#2037](https://github.com/VSCodeVim/Vim/pull/2037) (@westim)
- Fix for issue \#1860, visual multicursor movement. [\#2036](https://github.com/VSCodeVim/Vim/pull/2036) (@westim)
- Fix a typo [\#2028](https://github.com/VSCodeVim/Vim/pull/2028) (@joonro)

## [v0.10.1](https://github.com/vscodevim/vim/tree/v0.10.1) (2017-09-16)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.0...v0.10.1)

**Closed issues:**

- Easymotions characters are placed behind text [\#2009](https://github.com/VSCodeVim/Vim/issues/2009)
- What's the quick way uncomment ? [\#2008](https://github.com/VSCodeVim/Vim/issues/2008)
- Can't move cusor in when there are plugins in .vimrc [\#2006](https://github.com/VSCodeVim/Vim/issues/2006)
- Cltr-\] could be mapped to Go To Definition action [\#1999](https://github.com/VSCodeVim/Vim/issues/1999)
- useCtrlKey does not take effect [\#1998](https://github.com/VSCodeVim/Vim/issues/1998)
- Paragraph text objects should include trailing blank lines. [\#1995](https://github.com/VSCodeVim/Vim/issues/1995)
- Whitespace only lines are not treated correctly by paragraph text objects [\#1994](https://github.com/VSCodeVim/Vim/issues/1994)
- Bad handling of newlines in paragraph text objects [\#1989](https://github.com/VSCodeVim/Vim/issues/1989)
- easymotion: ability to limit the characters that appear [\#1981](https://github.com/VSCodeVim/Vim/issues/1981)
- \[Question\] Modify C-e and C-y commands? [\#1971](https://github.com/VSCodeVim/Vim/issues/1971)
- `gulp prettier` does not work on Windows [\#1961](https://github.com/VSCodeVim/Vim/issues/1961)
- Fix the effect of "ciW" when starting from the beginning of a word [\#1935](https://github.com/VSCodeVim/Vim/issues/1935)
- dap doesn't delete "all" paragraph [\#1928](https://github.com/VSCodeVim/Vim/issues/1928)
- A problem in "ctrl + \[" shortcut [\#1916](https://github.com/VSCodeVim/Vim/issues/1916)
- ctrl-e and ctrl-y don't work when in visual mode [\#1264](https://github.com/VSCodeVim/Vim/issues/1264)
- Marks: go to the position before the last jump [\#1089](https://github.com/VSCodeVim/Vim/issues/1089)

**Merged pull requests:**

- Fixing travis issues [\#2024](https://github.com/VSCodeVim/Vim/pull/2024) (@Chillee)
- Correct behavior of mouseSelectionGoesIntoVisualMode [\#2020](https://github.com/VSCodeVim/Vim/pull/2020) (@nguymin4)
- Easymotion improvements [\#2017](https://github.com/VSCodeVim/Vim/pull/2017) (@MaxfieldWalker)
- fix \#2009 [\#2012](https://github.com/VSCodeVim/Vim/pull/2012) (@MaxfieldWalker)
- Fix deref of undefined race on startup. [\#2002](https://github.com/VSCodeVim/Vim/pull/2002) (@brandonbloom)
- Use Go To Def & history absent a tag stack. [\#2001](https://github.com/VSCodeVim/Vim/pull/2001) (@brandonbloom)
- Fix\#1981 [\#1997](https://github.com/VSCodeVim/Vim/pull/1997) (@MaxfieldWalker)
- Improvements to paragraph text objects. [\#1996](https://github.com/VSCodeVim/Vim/pull/1996) (@brandonbloom)
- Implement '' and ``. [\#1993](https://github.com/VSCodeVim/Vim/pull/1993) (@brandonbloom)

## [v0.10.0](https://github.com/vscodevim/vim/tree/v0.10.0) (2017-08-30)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.9.0...v0.10.0)

**Closed issues:**

- Vim Find using / forward slash not working [\#1979](https://github.com/VSCodeVim/Vim/issues/1979)
- Hold H/J/K/L will only move one line/col [\#1975](https://github.com/VSCodeVim/Vim/issues/1975)
- j and k are updating the goto history too much [\#1964](https://github.com/VSCodeVim/Vim/issues/1964)
- ci\< "plugin" disabled by default? [\#1959](https://github.com/VSCodeVim/Vim/issues/1959)
- "L" scrolls down a line unexpectedly [\#1956](https://github.com/VSCodeVim/Vim/issues/1956)
- {counter}$ is not work [\#1950](https://github.com/VSCodeVim/Vim/issues/1950)
- vim.substituteGlobalFlag is not seen as setting [\#1944](https://github.com/VSCodeVim/Vim/issues/1944)
- Hangs / freezes / unresponsive when repeating keys \(like jj\) [\#1942](https://github.com/VSCodeVim/Vim/issues/1942)
- No action repetition when leaving input mode with CTRL-\[ [\#1941](https://github.com/VSCodeVim/Vim/issues/1941)
- Collapsed block was expanded when press J on the first line. [\#1936](https://github.com/VSCodeVim/Vim/issues/1936)
- Visual Surround mode adding spaces with brackets [\#1934](https://github.com/VSCodeVim/Vim/issues/1934)
- Cursor moving bugs [\#1930](https://github.com/VSCodeVim/Vim/issues/1930)
- disable auto change to normal mode after I selected something in insert mode ? [\#1929](https://github.com/VSCodeVim/Vim/issues/1929)
- `ci\>` \(Change in angular brackets\) does not work [\#1925](https://github.com/VSCodeVim/Vim/issues/1925)
- Feature request: allow hiding of mode indicator in status bar [\#1922](https://github.com/VSCodeVim/Vim/issues/1922)
- Confirm-Replace does not work. [\#1918](https://github.com/VSCodeVim/Vim/issues/1918)
- "Format selection" formats the whole document [\#1917](https://github.com/VSCodeVim/Vim/issues/1917)
- :u undid multiple steps at once. neovim did not help. [\#1915](https://github.com/VSCodeVim/Vim/issues/1915)
- Tests failing on master on Windows  [\#1914](https://github.com/VSCodeVim/Vim/issues/1914)
- `npm test` fails on Windows with 1.13 because of \*vscode\* module [\#1910](https://github.com/VSCodeVim/Vim/issues/1910)
- Using the `=` binding wedges the editor [\#1907](https://github.com/VSCodeVim/Vim/issues/1907)
- Undo/Redo updates UI multiple times per change. [\#1906](https://github.com/VSCodeVim/Vim/issues/1906)
- Visual mode indents can't be repeated with . [\#1905](https://github.com/VSCodeVim/Vim/issues/1905)
- BUG REPORT - scrolling with \<C-u\> / \<C-d\> does not move cursor as expected. [\#1900](https://github.com/VSCodeVim/Vim/issues/1900)
- Repeating \(using `.`\) inserting a `\<tab\>` does not work [\#1899](https://github.com/VSCodeVim/Vim/issues/1899)
- Selection and change repete not working [\#1892](https://github.com/VSCodeVim/Vim/issues/1892)
- Goto line number doesn't work [\#1889](https://github.com/VSCodeVim/Vim/issues/1889)
- Global Marker for VSCodeVim [\#1888](https://github.com/VSCodeVim/Vim/issues/1888)
- You can not repeat a tab. [\#1886](https://github.com/VSCodeVim/Vim/issues/1886)
- After yy, vscode loses redo chain [\#1881](https://github.com/VSCodeVim/Vim/issues/1881)
- Use prettier for formatting [\#1878](https://github.com/VSCodeVim/Vim/issues/1878)
- Badges are all sorts of messed up [\#1875](https://github.com/VSCodeVim/Vim/issues/1875)
- 2o addes Multi Cursor to inserted empty lines [\#1873](https://github.com/VSCodeVim/Vim/issues/1873)
- \[Windows\] yanking with "vim.useSystemClipboard: true" copies to " and not + register [\#1872](https://github.com/VSCodeVim/Vim/issues/1872)
- Selecting with mouse or double clicking on a word to select it should NOT go into visual mode [\#1871](https://github.com/VSCodeVim/Vim/issues/1871)
- Jittery cursor motion related to performance [\#1682](https://github.com/VSCodeVim/Vim/issues/1682)
- Easy Motion 2 Char Search Not Supported [\#1102](https://github.com/VSCodeVim/Vim/issues/1102)

**Merged pull requests:**

- Make prettier work on Windows [\#1987](https://github.com/VSCodeVim/Vim/pull/1987) (@MaxfieldWalker)
- Remove flaky tests [\#1982](https://github.com/VSCodeVim/Vim/pull/1982) (@Chillee)
- Fixed iW on beginning of word \(\#1935\) [\#1977](https://github.com/VSCodeVim/Vim/pull/1977) (@Ghust1995)
- Easymotion new features [\#1967](https://github.com/VSCodeVim/Vim/pull/1967) (@MaxfieldWalker)
- Trying to fix the travis issues with neovim [\#1958](https://github.com/VSCodeVim/Vim/pull/1958) (@Chillee)
- Fixes \#1941: Action repetition with Ctrl-\[ [\#1953](https://github.com/VSCodeVim/Vim/pull/1953) (@tagniam)
- Fixes \#1950: counter for $ [\#1952](https://github.com/VSCodeVim/Vim/pull/1952) (@tagniam)
- Makes all tests pass on Windows [\#1939](https://github.com/VSCodeVim/Vim/pull/1939) (@philipmat)
- Update tests due to VSCode PR 28238 [\#1926](https://github.com/VSCodeVim/Vim/pull/1926) (@philipmat)
- fix `z O` unfoldRecursively [\#1924](https://github.com/VSCodeVim/Vim/pull/1924) (@VincentBel)
- Renamed test to reflect purpose [\#1913](https://github.com/VSCodeVim/Vim/pull/1913) (@philipmat)
- Ctrl-C should copy to clipboard in visual mode - fix for \#1896 [\#1912](https://github.com/VSCodeVim/Vim/pull/1912) (@philipmat)
- Substitute global flag \(like Vim's `gdefault`\) [\#1909](https://github.com/VSCodeVim/Vim/pull/1909) (@philipmat)
- Fixes \#1871: Adds configuration option to go into visual mode upon clicking in insert mode [\#1898](https://github.com/VSCodeVim/Vim/pull/1898) (@Chillee)
- Fixes \#1886: indent repeat doesn't work in visual mode [\#1890](https://github.com/VSCodeVim/Vim/pull/1890) (@Chillee)
- Formattted everything with prettier [\#1879](https://github.com/VSCodeVim/Vim/pull/1879) (@Chillee)

## [v0.9.0](https://github.com/vscodevim/vim/tree/v0.9.0) (2017-06-24)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.8.7...v0.9.0)

**Closed issues:**

- Substitute pattern with newline [\#1861](https://github.com/VSCodeVim/Vim/issues/1861)
- otherModesNonRecursive doesn't stop action from being recursive in visualBlock mode [\#1758](https://github.com/VSCodeVim/Vim/issues/1758)
- Incomplete selection/copy [\#1755](https://github.com/VSCodeVim/Vim/issues/1755)
- Missing last character when transfering word from doc to native search bar. [\#1719](https://github.com/VSCodeVim/Vim/issues/1719)
- Add Selection To Next Find Match selects whole word in insert mode [\#1705](https://github.com/VSCodeVim/Vim/issues/1705)
- Double-click on word misses last character [\#1590](https://github.com/VSCodeVim/Vim/issues/1590)
- Selection highlight display inconsistent [\#1455](https://github.com/VSCodeVim/Vim/issues/1455)
- Multi-Cursor selection [\#1160](https://github.com/VSCodeVim/Vim/issues/1160)

**Merged pull requests:**

- fixes \#1861 [\#1868](https://github.com/VSCodeVim/Vim/pull/1868) (@xconverge)
- Fix off by one error in visual mode [\#1862](https://github.com/VSCodeVim/Vim/pull/1862) (@Chillee)

## [v0.8.7](https://github.com/vscodevim/vim/tree/v0.8.7) (2017-06-23)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.8.6...v0.8.7)

**Closed issues:**

- keybinding question [\#1866](https://github.com/VSCodeVim/Vim/issues/1866)
- can't remap U/shift + u [\#1865](https://github.com/VSCodeVim/Vim/issues/1865)
- Provide more accurate highlight in visual mode [\#1863](https://github.com/VSCodeVim/Vim/issues/1863)
- P doesn't create an undo stop [\#1857](https://github.com/VSCodeVim/Vim/issues/1857)
- Neovim Integration not work on Windows [\#1853](https://github.com/VSCodeVim/Vim/issues/1853)
- Swap Escape with CapsLock doesn't works [\#1849](https://github.com/VSCodeVim/Vim/issues/1849)
- Append text at the end of the line \(N times\) [\#1843](https://github.com/VSCodeVim/Vim/issues/1843)
- Can't interact with more than 32660 characters [\#1726](https://github.com/VSCodeVim/Vim/issues/1726)
- Revert file with `:e!` [\#1351](https://github.com/VSCodeVim/Vim/issues/1351)

**Merged pull requests:**

- Added :only command and corresponding shortcuts [\#1882](https://github.com/VSCodeVim/Vim/pull/1882) (@LeonB)
- Select in visual mode when scrolling [\#1859](https://github.com/VSCodeVim/Vim/pull/1859) (@Chillee)
- Fixes \#1857: P not creating an undo stop [\#1858](https://github.com/VSCodeVim/Vim/pull/1858) (@Chillee)
- Fixes \#979: Adds q! to close without saving [\#1854](https://github.com/VSCodeVim/Vim/pull/1854) (@Chillee)
- Update README.md \(minor\) [\#1851](https://github.com/VSCodeVim/Vim/pull/1851) (@BlueDrink9)
- fixes \#1843 A and I preceded by count [\#1846](https://github.com/VSCodeVim/Vim/pull/1846) (@xconverge)
- WIP Fixes \#754: Adds j,k,o,\<Enter\>, gg, G, ctrl+d, and ctrl+u commands for navigating inside the file explorer [\#1718](https://github.com/VSCodeVim/Vim/pull/1718) (@Chillee)

## [v0.8.6](https://github.com/vscodevim/vim/tree/v0.8.6) (2017-06-15)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.8.5...v0.8.6)

**Closed issues:**

- Intellisense menu goes away on every second keystroke [\#1841](https://github.com/VSCodeVim/Vim/issues/1841)
- Intellisense with word wrap breaks below the wrap [\#1836](https://github.com/VSCodeVim/Vim/issues/1836)
- In large file\(more than 10M\) all keys do nothing and I switch back to small file, everything work fine [\#1834](https://github.com/VSCodeVim/Vim/issues/1834)
- Mac Sierra useSystemKeyboard breaks some basic keybindings \(dd and cw yw\) etc. [\#1830](https://github.com/VSCodeVim/Vim/issues/1830)
- Intellisense does not work after fold [\#1829](https://github.com/VSCodeVim/Vim/issues/1829)
- Typing cc clears line but won't position cursor and sometimes won't indent correctly [\#1828](https://github.com/VSCodeVim/Vim/issues/1828)
- Folds/wraps cause intellisense failures [\#1827](https://github.com/VSCodeVim/Vim/issues/1827)
- jump to line in command-mode doesn't work. [\#1826](https://github.com/VSCodeVim/Vim/issues/1826)
- yiw doesn't place cursor at the beginning of the word [\#1817](https://github.com/VSCodeVim/Vim/issues/1817)
- Undo Redo functionality quit working with upgrade to May 1.13 release [\#1814](https://github.com/VSCodeVim/Vim/issues/1814)
- Undo does not restore all changes [\#1794](https://github.com/VSCodeVim/Vim/issues/1794)
- Undo does not work after save [\#1783](https://github.com/VSCodeVim/Vim/issues/1783)
- Navigation doesn't work after enabling neovim integration [\#1773](https://github.com/VSCodeVim/Vim/issues/1773)

**Merged pull requests:**

- Removed solid block cursor [\#1842](https://github.com/VSCodeVim/Vim/pull/1842) (@Chillee)
- Fix yiw cursor pos [\#1837](https://github.com/VSCodeVim/Vim/pull/1837) (@xconverge)
- Fixes \#1794: Undo not undoing all changes [\#1833](https://github.com/VSCodeVim/Vim/pull/1833) (@Chillee)
- Fixes \#1827: Autocomplete fails when any lines are wrapped/folded [\#1832](https://github.com/VSCodeVim/Vim/pull/1832) (@Chillee)
- Fixes \#1826: Jump to line with neovim disabled doesn't work [\#1831](https://github.com/VSCodeVim/Vim/pull/1831) (@Chillee)

## [v0.8.5](https://github.com/vscodevim/vim/tree/v0.8.5) (2017-06-11)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.8.4...v0.8.5)

**Closed issues:**

- Mapping openEditorAtIndex1 breaks text entry [\#1816](https://github.com/VSCodeVim/Vim/issues/1816)
- Can't re-insert Tab using `.` [\#1811](https://github.com/VSCodeVim/Vim/issues/1811)
- "We have now added Neovim integration" never goes away if clicking close; VS Code stops responding to commands if never pressed.   [\#1808](https://github.com/VSCodeVim/Vim/issues/1808)
- move section begin/end [\#1807](https://github.com/VSCodeVim/Vim/issues/1807)
- CMD-C removes Highlight immediately \(should remain\) [\#1804](https://github.com/VSCodeVim/Vim/issues/1804)
- Folds created with 'zc' immediately unfold [\#1803](https://github.com/VSCodeVim/Vim/issues/1803)
- Typing cc won't indent the line automatically [\#1802](https://github.com/VSCodeVim/Vim/issues/1802)
- :vsp should support path suggestion when I press the tab button [\#1799](https://github.com/VSCodeVim/Vim/issues/1799)
- Paste \[cmd+v\] to selected word not replace to last character \(blink cursor\) [\#1798](https://github.com/VSCodeVim/Vim/issues/1798)
- Pressing remapped Esc doesn't enter normal mode [\#1797](https://github.com/VSCodeVim/Vim/issues/1797)
- %s/str1/str2/ does not work [\#1793](https://github.com/VSCodeVim/Vim/issues/1793)
- Support U/u in V-Block mode [\#1792](https://github.com/VSCodeVim/Vim/issues/1792)
- Support ranges relative to current line number [\#1786](https://github.com/VSCodeVim/Vim/issues/1786)
- "Tab" doesn't move the selected line [\#1785](https://github.com/VSCodeVim/Vim/issues/1785)
- After a recent update y\#y no longer working [\#1781](https://github.com/VSCodeVim/Vim/issues/1781)
- When I enter a chinese text into a file，the focus will jump to the beginning of that string！ [\#1694](https://github.com/VSCodeVim/Vim/issues/1694)
- Multicursor Vscode Command broken in `v0.7.0` [\#1652](https://github.com/VSCodeVim/Vim/issues/1652)
- repeat inserted character/word \(e.g., 5i...\[esc\]\) multiline support [\#1523](https://github.com/VSCodeVim/Vim/issues/1523)
- Curosr moves to wrong a position when input word which has more than one letters with InputMethod.\(Ubuntu\) [\#1512](https://github.com/VSCodeVim/Vim/issues/1512)
- :e does not expand shell paths. [\#1200](https://github.com/VSCodeVim/Vim/issues/1200)

**Merged pull requests:**

- Fixes \#1814: Undo history getting deleted when file changes [\#1820](https://github.com/VSCodeVim/Vim/pull/1820) (@Chillee)
- Fixes \#1200: :e doesn't expand tildes [\#1819](https://github.com/VSCodeVim/Vim/pull/1819) (@Chillee)
- Fixes \#1786: Adds relative line ranges [\#1810](https://github.com/VSCodeVim/Vim/pull/1810) (@Chillee)
- Fixed \#1803: zc automatically reopens folds if the fold is performed in the middle. [\#1809](https://github.com/VSCodeVim/Vim/pull/1809) (@Chillee)
- Vertical split shortcut keys [\#1795](https://github.com/VSCodeVim/Vim/pull/1795) (@beefsack)

## [v0.8.4](https://github.com/vscodevim/vim/tree/v0.8.4) (2017-05-29)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.8.3...v0.8.4)

**Closed issues:**

- Incessant nagging: "We have now added Neovim integration" [\#1774](https://github.com/VSCodeVim/Vim/issues/1774)
- delete lines not function [\#1771](https://github.com/VSCodeVim/Vim/issues/1771)
- Backspace deletes more than one tab stop when using golang syntax format. [\#1768](https://github.com/VSCodeVim/Vim/issues/1768)
- Reflow \(`gq`\) removes spaces when joining lines [\#1765](https://github.com/VSCodeVim/Vim/issues/1765)
- Multiline delete doesn't allow for "d\[\# of lines\]d" syntax [\#1764](https://github.com/VSCodeVim/Vim/issues/1764)
- Shift left get wrong indent [\#1760](https://github.com/VSCodeVim/Vim/issues/1760)
- NeoVim update causes vim commands to no longer work on VSCode.  [\#1751](https://github.com/VSCodeVim/Vim/issues/1751)
- Pasteboard\(or register\) will be rewrite if paste something on visual mode [\#1743](https://github.com/VSCodeVim/Vim/issues/1743)
- Visual Mode Issues: R command [\#1307](https://github.com/VSCodeVim/Vim/issues/1307)

**Merged pull requests:**

- Fixes \#1743: Fixed pasting over visual mode with named register overwriting the named register [\#1777](https://github.com/VSCodeVim/Vim/pull/1777) (@Chillee)
- Fixes \#1760: Deindenting not working properly with neovim ex-commands [\#1770](https://github.com/VSCodeVim/Vim/pull/1770) (@Chillee)
- Fixes \#1768: Backspace deletes more than one tab when tabs are mandated by language specific settings [\#1769](https://github.com/VSCodeVim/Vim/pull/1769) (@Chillee)
- More v8 patches [\#1766](https://github.com/VSCodeVim/Vim/pull/1766) (@Chillee)
- fixed \#1027 maybe? [\#1740](https://github.com/VSCodeVim/Vim/pull/1740) (@Chillee)

## [v0.8.3](https://github.com/vscodevim/vim/tree/v0.8.3) (2017-05-26)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.8.2...v0.8.3)

**Closed issues:**

- New version \(0.8.2\) Breaks Emmet integration [\#1763](https://github.com/VSCodeVim/Vim/issues/1763)
- Extend visual range with } mangles visual range [\#1762](https://github.com/VSCodeVim/Vim/issues/1762)
- line move not working [\#1761](https://github.com/VSCodeVim/Vim/issues/1761)

## [v0.8.2](https://github.com/vscodevim/vim/tree/v0.8.2) (2017-05-26)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.8.1...v0.8.2)

**Closed issues:**

- Delete does not forward delete in insert mode [\#1756](https://github.com/VSCodeVim/Vim/issues/1756)
- Jump to line stops working with v0.8.0 [\#1754](https://github.com/VSCodeVim/Vim/issues/1754)
- Bug: "gq" does not work with jsdoc-style comments [\#1750](https://github.com/VSCodeVim/Vim/issues/1750)

**Merged pull requests:**

- Fixes \#1750: gq doesn't work for JSDoc type comments [\#1759](https://github.com/VSCodeVim/Vim/pull/1759) (@Chillee)
- Some patches for v0.8.0 [\#1757](https://github.com/VSCodeVim/Vim/pull/1757) (@Chillee)

## [v0.8.1](https://github.com/vscodevim/vim/tree/v0.8.1) (2017-05-26)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.8.0...v0.8.1)

**Closed issues:**

- After v.0.8.0 update tab completion no longer works [\#1752](https://github.com/VSCodeVim/Vim/issues/1752)
- O uses wrong indentation style \(spaces instead of tabs\) [\#1649](https://github.com/VSCodeVim/Vim/issues/1649)

**Merged pull requests:**

- Fixes \#1752: Tab Completion [\#1753](https://github.com/VSCodeVim/Vim/pull/1753) (@Chillee)

## [v0.8.0](https://github.com/vscodevim/vim/tree/v0.8.0) (2017-05-25)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.7.1...v0.8.0)

**Closed issues:**

- \<D-d\> in insert mode doesn't work when the word isn't by itself [\#1749](https://github.com/VSCodeVim/Vim/issues/1749)
- whole file delete/copy [\#1732](https://github.com/VSCodeVim/Vim/issues/1732)
- Add neovim integration [\#1724](https://github.com/VSCodeVim/Vim/issues/1724)
- Support search whole word [\#1723](https://github.com/VSCodeVim/Vim/issues/1723)
- VSCode Zen Mode Shortcut not working [\#1720](https://github.com/VSCodeVim/Vim/issues/1720)
- cc doesn't copy linewise. [\#1716](https://github.com/VSCodeVim/Vim/issues/1716)
- Last character in selection [\#1711](https://github.com/VSCodeVim/Vim/issues/1711)
- Vim refactor and enhancement [\#1706](https://github.com/VSCodeVim/Vim/issues/1706)
- Refactor the delete operator [\#1701](https://github.com/VSCodeVim/Vim/issues/1701)
- chinese input bugs [\#1699](https://github.com/VSCodeVim/Vim/issues/1699)
- Support for join lines \(:j\) [\#1698](https://github.com/VSCodeVim/Vim/issues/1698)
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
- Add support for Surround with repeated commands [\#1618](https://github.com/VSCodeVim/Vim/issues/1618)
- WISH: Implement Marked Block Shift Left/Right [\#1611](https://github.com/VSCodeVim/Vim/issues/1611)
- Undo don't work after full search and replace [\#1589](https://github.com/VSCodeVim/Vim/issues/1589)
- Shortcut to keep preview table open [\#1580](https://github.com/VSCodeVim/Vim/issues/1580)
- ^E stops scrolling down when the cursor reaches the top of the page [\#1544](https://github.com/VSCodeVim/Vim/issues/1544)
- Commentary toggle at start of current line comments previous line too [\#1534](https://github.com/VSCodeVim/Vim/issues/1534)
- Search/replace causes double replacement with capture group [\#1525](https://github.com/VSCodeVim/Vim/issues/1525)
- move line not worked [\#1524](https://github.com/VSCodeVim/Vim/issues/1524)
- Cannot search in visual mode [\#1520](https://github.com/VSCodeVim/Vim/issues/1520)
- No new blank line when `c' after `V' [\#1518](https://github.com/VSCodeVim/Vim/issues/1518)
- blank line regex doesn't work [\#1517](https://github.com/VSCodeVim/Vim/issues/1517)
- Inserting keywords on pressing arrow keys in visual mode [\#1458](https://github.com/VSCodeVim/Vim/issues/1458)
- Implement gqq [\#1450](https://github.com/VSCodeVim/Vim/issues/1450)
- Change configuration updates to monitor relevant changes instead of all changes [\#1438](https://github.com/VSCodeVim/Vim/issues/1438)
- This extension prevents 'find all reference' pop-up from closing using ESC key [\#1436](https://github.com/VSCodeVim/Vim/issues/1436)
- delete all lines containing \<string\> doesn't work  [\#1412](https://github.com/VSCodeVim/Vim/issues/1412)
- Visual block mode doesn't respect remapped navigation keys [\#1403](https://github.com/VSCodeVim/Vim/issues/1403)
- Support for \L, \U, \l, \u in regex replacements [\#1401](https://github.com/VSCodeVim/Vim/issues/1401)
- Tab in visual block mode applies to first line only [\#1400](https://github.com/VSCodeVim/Vim/issues/1400)
- Ctrl-a and Ctrl-x works not correctly when a word has more than one number [\#1376](https://github.com/VSCodeVim/Vim/issues/1376)
- Unable to dismiss the parameter info intellisense without using the mouse. [\#1360](https://github.com/VSCodeVim/Vim/issues/1360)
- Visual Mode Issues: C command [\#1305](https://github.com/VSCodeVim/Vim/issues/1305)
- Highlighted character jumps around when highlighting text. [\#1247](https://github.com/VSCodeVim/Vim/issues/1247)
- Substitute/Find and Replace with Relative Line Numbers [\#1237](https://github.com/VSCodeVim/Vim/issues/1237)
- Pasting after deleting a line leaves cursor in wrong position [\#1218](https://github.com/VSCodeVim/Vim/issues/1218)
- y}p handles newlines incorrectly [\#1197](https://github.com/VSCodeVim/Vim/issues/1197)
- d} deletes extra \(empty\) line [\#1196](https://github.com/VSCodeVim/Vim/issues/1196)
- Actions after visual line indent are relative to where cursor started [\#1143](https://github.com/VSCodeVim/Vim/issues/1143)
- Wrong cursor placement after indenting multiple lines [\#1135](https://github.com/VSCodeVim/Vim/issues/1135)
- gt/T doesn't take editor groups in account [\#1131](https://github.com/VSCodeVim/Vim/issues/1131)

**Merged pull requests:**

- Fixes \#1749: \<D-d\> in insert mode doesn't work when the word isn't by itself [\#1748](https://github.com/VSCodeVim/Vim/pull/1748) (@Chillee)
- Added automatic changelog generator [\#1747](https://github.com/VSCodeVim/Vim/pull/1747) (@Chillee)
- Actually readded \<c-j\> and \<c-k\> [\#1730](https://github.com/VSCodeVim/Vim/pull/1730) (@Chillee)
- Revert "Unfixes \#1720" [\#1729](https://github.com/VSCodeVim/Vim/pull/1729) (@Chillee)
- Unfixes \#1720 [\#1728](https://github.com/VSCodeVim/Vim/pull/1728) (@Chillee)
- Embedding Neovim for Ex commands [\#1725](https://github.com/VSCodeVim/Vim/pull/1725) (@Chillee)
- Fixes \#1720: Removed unused \<c- \> bindings from package.json [\#1722](https://github.com/VSCodeVim/Vim/pull/1722) (@Chillee)
- Fixes \#1376: \<C-a\> doesn't work correctly when a word has more than 1 number [\#1721](https://github.com/VSCodeVim/Vim/pull/1721) (@Chillee)
- Fixes \#1715: Adds multicursor paste [\#1717](https://github.com/VSCodeVim/Vim/pull/1717) (@Chillee)
- Fixes \#1534, \#1518, \#1716, \#1618, \#1450: Refactored repeating motions [\#1712](https://github.com/VSCodeVim/Vim/pull/1712) (@Chillee)
- Fixes \#1520: search in visual/visualLine/visualBlock mode [\#1710](https://github.com/VSCodeVim/Vim/pull/1710) (@Chillee)
- Fixes \#1403: VisualBlock doesn't respect keybindings. [\#1709](https://github.com/VSCodeVim/Vim/pull/1709) (@Chillee)
- Fixes \#1655: Extends gf to line numbers [\#1708](https://github.com/VSCodeVim/Vim/pull/1708) (@Chillee)
- Fixes \#1436: extension prevents 'find all references' pop-up from closing through \<esc\> if it's empty. [\#1707](https://github.com/VSCodeVim/Vim/pull/1707) (@Chillee)
- Fixes \#1668: Self closing tags not properly handled. [\#1702](https://github.com/VSCodeVim/Vim/pull/1702) (@Chillee)
- Fixes \#1674: repeating . with characters like " or \) leaves cursor in wrong place [\#1700](https://github.com/VSCodeVim/Vim/pull/1700) (@Chillee)
- remove system clipboard hack for UTF-8 [\#1695](https://github.com/VSCodeVim/Vim/pull/1695) (@xconverge)
- Fixes \#1684: Fixed gq spacing issues [\#1686](https://github.com/VSCodeVim/Vim/pull/1686) (@Chillee)
- Fixed some regressions I introduced [\#1681](https://github.com/VSCodeVim/Vim/pull/1681) (@Chillee)
- feat\(surround\): support complex tags surround [\#1680](https://github.com/VSCodeVim/Vim/pull/1680) (@admosity)
- Fixes \#1400, \#612, \#1632, \#1634, \#1531, \#1458: Tab isn't handled properly for insert and visualblockinsert modes [\#1663](https://github.com/VSCodeVim/Vim/pull/1663) (@Chillee)
- Fixes \#792: Selecting range before Ex-commands highlights initial text [\#1659](https://github.com/VSCodeVim/Vim/pull/1659) (@Chillee)
- Cobbweb/more readme fixes [\#1656](https://github.com/VSCodeVim/Vim/pull/1656) (@cobbweb)
- Fixes \#1256 and \#394: Fixes delete key and adds functionality [\#1644](https://github.com/VSCodeVim/Vim/pull/1644) (@Chillee)
- Fixes \#1196, \#1197: d}/y} not working correctly [\#1621](https://github.com/VSCodeVim/Vim/pull/1621) (@Chillee)
- Fixing the automatic fold expansion \(\#1004\) [\#1552](https://github.com/VSCodeVim/Vim/pull/1552) (@Chillee)
- Fix visual mode bugs\#1304to\#1308 [\#1322](https://github.com/VSCodeVim/Vim/pull/1322) (@xlaech)

## [v0.7.1](https://github.com/vscodevim/vim/tree/v0.7.1) (2017-05-10)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.7.0...v0.7.1)

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

**Merged pull requests:**

- Changes tabs to navigate inside the same split [\#1677](https://github.com/VSCodeVim/Vim/pull/1677) (@vinicio)
- clean up tests. increase timeout [\#1672](https://github.com/VSCodeVim/Vim/pull/1672) (@jpoon)
- Fixes \#1585: Added \<C-w\> j and \<C-w\> k [\#1666](https://github.com/VSCodeVim/Vim/pull/1666) (@Chillee)
- Add :close support based on :quit [\#1665](https://github.com/VSCodeVim/Vim/pull/1665) (@mspaulding06)
- Fixes \#1280: Pasting over selection doesn't yank deleted section [\#1651](https://github.com/VSCodeVim/Vim/pull/1651) (@Chillee)
- Fixes \#1535, \#1467, \#1311: D-d doesn't work in insert mode [\#1631](https://github.com/VSCodeVim/Vim/pull/1631) (@Chillee)

## [v0.7.0](https://github.com/vscodevim/vim/tree/v0.7.0) (2017-05-05)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.20...v0.7.0)

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

**Merged pull requests:**

- Join HTML on single line to prevent extraneous \<br\>s [\#1643](https://github.com/VSCodeVim/Vim/pull/1643) (@cobbweb)
- Refactor [\#1642](https://github.com/VSCodeVim/Vim/pull/1642) (@rebornix)
- Fixes \#1637, \#1638: z- and z\<CR\> movements [\#1640](https://github.com/VSCodeVim/Vim/pull/1640) (@Chillee)
- Fixes \#1503: Undo history isn't kept when switching tabs [\#1629](https://github.com/VSCodeVim/Vim/pull/1629) (@Chillee)
- Fixes \#1441: Ctrl-c dropping a character when selecting from right to left in insert mode [\#1628](https://github.com/VSCodeVim/Vim/pull/1628) (@Chillee)
- Fixes \#1300: Fixed bug with recently submitted tag PR [\#1625](https://github.com/VSCodeVim/Vim/pull/1625) (@Chillee)
- Fixes \#1137: i\_\<C-w\> deletes through whitespace at beginning of line [\#1624](https://github.com/VSCodeVim/Vim/pull/1624) (@Chillee)
- Further work on tag matching \(based off of \#1454\) [\#1620](https://github.com/VSCodeVim/Vim/pull/1620) (@Chillee)
- Toggle vim [\#1619](https://github.com/VSCodeVim/Vim/pull/1619) (@rebornix)
- Fixes \#1588: \<C-a\> does wrong things if cursor is to the right of a number \(and there's a number on the next line\) [\#1617](https://github.com/VSCodeVim/Vim/pull/1617) (@Chillee)
- Visualstar [\#1616](https://github.com/VSCodeVim/Vim/pull/1616) (@mikew)
- outfiles needs to be globbed [\#1615](https://github.com/VSCodeVim/Vim/pull/1615) (@jpoon)
- Upgrade typescript 2.2.1-\>2.3.2. tslint 3.10.2-\>2.3.2. Fix errors [\#1614](https://github.com/VSCodeVim/Vim/pull/1614) (@jpoon)
- Fix warning [\#1613](https://github.com/VSCodeVim/Vim/pull/1613) (@jpoon)
- Stopped getLineMaxColumn from erroring on line 0 [\#1610](https://github.com/VSCodeVim/Vim/pull/1610) (@Chillee)
- use editor from event fixes \#1607 [\#1608](https://github.com/VSCodeVim/Vim/pull/1608) (@brandoncc)
- Fixes \#1532: gd doesn't set desiredColumn properly [\#1605](https://github.com/VSCodeVim/Vim/pull/1605) (@Chillee)
- Fixes \#1594: \<Copy\> drops the first and last line when selecting in visual line mode from the bottom up [\#1604](https://github.com/VSCodeVim/Vim/pull/1604) (@Chillee)
- Fixes \#1575: Adds support for searching for strings with newlines [\#1603](https://github.com/VSCodeVim/Vim/pull/1603) (@Chillee)
- Fix status bar color when change mode [\#1602](https://github.com/VSCodeVim/Vim/pull/1602) (@zelphir)
- Made command line persistent when switching windows [\#1601](https://github.com/VSCodeVim/Vim/pull/1601) (@Chillee)
- Fixes \#890, \#1377: Selection \(both visual/visualline\) is very wonky with gj and gk [\#1600](https://github.com/VSCodeVim/Vim/pull/1600) (@Chillee)
- Fixes \#1251: gq always adds an extra space to beginning of block. [\#1596](https://github.com/VSCodeVim/Vim/pull/1596) (@Chillee)
- Fixes \#1599: dot command doesn't work in macros [\#1595](https://github.com/VSCodeVim/Vim/pull/1595) (@Chillee)
- Fixes \#1369: Change on a selection where endpoint was at beginning of line misses last character [\#1560](https://github.com/VSCodeVim/Vim/pull/1560) (@Chillee)
- Add support for indent objects [\#1550](https://github.com/VSCodeVim/Vim/pull/1550) (@mikew)
- Navigate between view [\#1504](https://github.com/VSCodeVim/Vim/pull/1504) (@lyup)

## [v0.6.20](https://github.com/vscodevim/vim/tree/v0.6.20) (2017-04-26)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.19...v0.6.20)

## [v0.6.19](https://github.com/vscodevim/vim/tree/v0.6.19) (2017-04-26)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.18...v0.6.19)

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

**Merged pull requests:**

- Fixes \#1573: Backspace at beginning of file causes subsequent operation to nop [\#1577](https://github.com/VSCodeVim/Vim/pull/1577) (@Chillee)
- Fix logo src so logo displays inside VSCode [\#1572](https://github.com/VSCodeVim/Vim/pull/1572) (@cobbweb)
- fixes \#1449 [\#1571](https://github.com/VSCodeVim/Vim/pull/1571) (@azngeoffdog)
- fixes \#1252 [\#1569](https://github.com/VSCodeVim/Vim/pull/1569) (@xconverge)
- fixes \#1486 :wqa command [\#1568](https://github.com/VSCodeVim/Vim/pull/1568) (@xconverge)
- fixes \#1357 [\#1567](https://github.com/VSCodeVim/Vim/pull/1567) (@xconverge)
- Fix surround aliases [\#1564](https://github.com/VSCodeVim/Vim/pull/1564) (@xconverge)

## [v0.6.18](https://github.com/vscodevim/vim/tree/v0.6.18) (2017-04-24)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.17...v0.6.18)

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

**Merged pull requests:**

- update clipboardy library with windows utf-8 fix [\#1559](https://github.com/VSCodeVim/Vim/pull/1559) (@xconverge)
- Fixes \#1539: Displaying values in register stops displaying anything after the newline [\#1558](https://github.com/VSCodeVim/Vim/pull/1558) (@Chillee)
- Fixes \#1539: Viewing register value displays incorrectly for macros [\#1557](https://github.com/VSCodeVim/Vim/pull/1557) (@Chillee)
- Fixes \#1554, \#1553: Fixed daW bugs [\#1555](https://github.com/VSCodeVim/Vim/pull/1555) (@Chillee)
- Fixes \#1193, \#1350, \#967: Fixes daw bugs [\#1549](https://github.com/VSCodeVim/Vim/pull/1549) (@Chillee)
- Allow users to use VSCode keybinding for remapping [\#1548](https://github.com/VSCodeVim/Vim/pull/1548) (@rebornix)
- README enhancements [\#1547](https://github.com/VSCodeVim/Vim/pull/1547) (@cobbweb)
- Fixes \#1533: \<Copy\> not activating when \<C-c\> is pressed [\#1542](https://github.com/VSCodeVim/Vim/pull/1542) (@Chillee)
- Fixes \#1528: daw on end of word doesn't delete properly [\#1536](https://github.com/VSCodeVim/Vim/pull/1536) (@Chillee)
- Fixes \#1513: Backspace on middle of whitespace only line fails [\#1514](https://github.com/VSCodeVim/Vim/pull/1514) (@Chillee)

## [v0.6.17](https://github.com/vscodevim/vim/tree/v0.6.17) (2017-04-20)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.16...v0.6.17)

**Closed issues:**

- Counted replace broken [\#1530](https://github.com/VSCodeVim/Vim/issues/1530)
- Repeated `s` behaves incorrectly [\#1519](https://github.com/VSCodeVim/Vim/issues/1519)
- macOs copy and paste chinese will result messy code [\#1392](https://github.com/VSCodeVim/Vim/issues/1392)
- surround should be repeatable with . [\#1244](https://github.com/VSCodeVim/Vim/issues/1244)
- Multi-Cursor deletion [\#1161](https://github.com/VSCodeVim/Vim/issues/1161)

**Merged pull requests:**

- Allow user to change status bar color based on mode [\#1529](https://github.com/VSCodeVim/Vim/pull/1529) (@xconverge)
- Fix README description for `af` [\#1522](https://github.com/VSCodeVim/Vim/pull/1522) (@esturcke)
- fixes \#1519 [\#1521](https://github.com/VSCodeVim/Vim/pull/1521) (@xconverge)
- make surround repeatable with dot [\#1515](https://github.com/VSCodeVim/Vim/pull/1515) (@xconverge)
- \[WIP\] change system clipboard library to a newer more maintained library [\#1487](https://github.com/VSCodeVim/Vim/pull/1487) (@xconverge)

## [v0.6.16](https://github.com/vscodevim/vim/tree/v0.6.16) (2017-04-16)
[Full Changelog](https://github.com/vscodevim/vim/compare/0.6.15...v0.6.16)

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

**Merged pull requests:**

- added cmd\_line commands to remapper [\#1516](https://github.com/VSCodeVim/Vim/pull/1516) (@xconverge)
- fixes \#1507 and removes workspace settings that should not be there [\#1509](https://github.com/VSCodeVim/Vim/pull/1509) (@xconverge)
- Add line comment operator [\#1506](https://github.com/VSCodeVim/Vim/pull/1506) (@fiedler)
- Add 5i= or 4a- so that the previously inserted text is repeated upon exiting to normal mode [\#1495](https://github.com/VSCodeVim/Vim/pull/1495) (@xconverge)
- Add ability to turn surround plugin off [\#1494](https://github.com/VSCodeVim/Vim/pull/1494) (@xconverge)
- Added new style settings \(color, size, etc.\) for easymotion markers [\#1493](https://github.com/VSCodeVim/Vim/pull/1493) (@edasaki)
- fixes \#1475 [\#1485](https://github.com/VSCodeVim/Vim/pull/1485) (@xconverge)
- fix for double clicking a word with mouse not showing selection properly [\#1484](https://github.com/VSCodeVim/Vim/pull/1484) (@xconverge)
- fix easymotion j and k [\#1474](https://github.com/VSCodeVim/Vim/pull/1474) (@xconverge)

## [0.6.15](https://github.com/vscodevim/vim/tree/0.6.15) (2017-04-07)
[Full Changelog](https://github.com/vscodevim/vim/compare/0.6.14...0.6.15)

## [0.6.14](https://github.com/vscodevim/vim/tree/0.6.14) (2017-04-07)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.13...0.6.14)

**Closed issues:**

- Latest update changed insert cursor [\#1473](https://github.com/VSCodeVim/Vim/issues/1473)
- Insert mode cursor is now the block instead of the pipe [\#1470](https://github.com/VSCodeVim/Vim/issues/1470)

**Merged pull requests:**

- Fix tables in roadmap [\#1469](https://github.com/VSCodeVim/Vim/pull/1469) (@xconverge)
- Fix visual block mode not updating multicursor selection [\#1468](https://github.com/VSCodeVim/Vim/pull/1468) (@xconverge)
- Fix type suggestion for handleKeys object [\#1465](https://github.com/VSCodeVim/Vim/pull/1465) (@abhiranjankumar00)

## [v0.6.13](https://github.com/vscodevim/vim/tree/v0.6.13) (2017-04-04)
[Full Changelog](https://github.com/vscodevim/vim/compare/0.6.12...v0.6.13)

**Merged pull requests:**

- fixes \#1448 [\#1462](https://github.com/VSCodeVim/Vim/pull/1462) (@xconverge)
- fix multi line in 'at' and 'it' commands [\#1454](https://github.com/VSCodeVim/Vim/pull/1454) (@jrenton)

## [0.6.12](https://github.com/vscodevim/vim/tree/0.6.12) (2017-04-04)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.11...0.6.12)

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

**Merged pull requests:**

- fixes \#1432 [\#1434](https://github.com/VSCodeVim/Vim/pull/1434) (@xconverge)
- fixes \#1312 [\#1433](https://github.com/VSCodeVim/Vim/pull/1433) (@xconverge)
- Change easymotion decoration colors to use searchHighlight colors [\#1431](https://github.com/VSCodeVim/Vim/pull/1431) (@xconverge)
- minor cleanup to improve leader usage with \<space\> [\#1429](https://github.com/VSCodeVim/Vim/pull/1429) (@xconverge)
- gUU and guu [\#1428](https://github.com/VSCodeVim/Vim/pull/1428) (@xconverge)
- Allowing user to selectively disable some key combos [\#1425](https://github.com/VSCodeVim/Vim/pull/1425) (@xconverge)
- Remapper cleanup key history [\#1416](https://github.com/VSCodeVim/Vim/pull/1416) (@xconverge)
- fix undo points when moving around in insert with mouse or arrow keys [\#1413](https://github.com/VSCodeVim/Vim/pull/1413) (@xconverge)
- update readme for plugins [\#1411](https://github.com/VSCodeVim/Vim/pull/1411) (@xconverge)
- Allow users to use their own cursor style for insert from editor.cursorStyle [\#1399](https://github.com/VSCodeVim/Vim/pull/1399) (@xconverge)

## [v0.6.11](https://github.com/vscodevim/vim/tree/v0.6.11) (2017-03-19)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.10...v0.6.11)

**Closed issues:**

- Keybindings not working in 10.0.2 [\#1410](https://github.com/VSCodeVim/Vim/issues/1410)
- Motion keys {h,j,k,l} don't move more than one position upon holding down [\#1407](https://github.com/VSCodeVim/Vim/issues/1407)
- Three letter keybindings fail to match on version 0.6.6 [\#1405](https://github.com/VSCodeVim/Vim/issues/1405)

**Merged pull requests:**

- Fix comment syntax for shell commands. [\#1408](https://github.com/VSCodeVim/Vim/pull/1408) (@frewsxcv)
- Increase timeout for some test cases in mocha [\#1379](https://github.com/VSCodeVim/Vim/pull/1379) (@xconverge)

## [v0.6.10](https://github.com/vscodevim/vim/tree/v0.6.10) (2017-03-18)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.9...v0.6.10)

**Closed issues:**

- Feature request: Support Ctrl+O Ctrl+I in command mode to navigate cursor locations [\#1253](https://github.com/VSCodeVim/Vim/issues/1253)

## [v0.6.9](https://github.com/vscodevim/vim/tree/v0.6.9) (2017-03-18)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.7...v0.6.9)

## [v0.6.7](https://github.com/vscodevim/vim/tree/v0.6.7) (2017-03-18)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.8...v0.6.7)

## [v0.6.8](https://github.com/vscodevim/vim/tree/v0.6.8) (2017-03-18)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.6...v0.6.8)

**Closed issues:**

- Changing the open tab changes cursor to non-block [\#1404](https://github.com/VSCodeVim/Vim/issues/1404)

**Merged pull requests:**

- fix bracket motion behavior for use with % and a count, or \[\( and a c… [\#1406](https://github.com/VSCodeVim/Vim/pull/1406) (@xconverge)
- fix for cursor not changing correctly, workaround for vscode issue [\#1402](https://github.com/VSCodeVim/Vim/pull/1402) (@xconverge)

## [v0.6.6](https://github.com/vscodevim/vim/tree/v0.6.6) (2017-03-17)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.5...v0.6.6)

**Closed issues:**

- Relative line move with remapped hjkl keys not supported [\#1233](https://github.com/VSCodeVim/Vim/issues/1233)

**Merged pull requests:**

- Use block cursor in visual & underline in replace [\#1394](https://github.com/VSCodeVim/Vim/pull/1394) (@net)
- Perform remapped commands when prefix by a number [\#1359](https://github.com/VSCodeVim/Vim/pull/1359) (@bdauria)

## [v0.6.5](https://github.com/vscodevim/vim/tree/v0.6.5) (2017-03-12)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.4...v0.6.5)

## [v0.6.4](https://github.com/vscodevim/vim/tree/v0.6.4) (2017-03-12)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.3...v0.6.4)

**Closed issues:**

- Macro can't delete characters in some situations [\#1389](https://github.com/VSCodeVim/Vim/issues/1389)
- Macros don't repeat EscInInsertMode [\#1388](https://github.com/VSCodeVim/Vim/issues/1388)
- The 'jump to n percentage of file' function seems not working [\#1385](https://github.com/VSCodeVim/Vim/issues/1385)
- Executing a macro that runs many operators creates many undo points [\#1382](https://github.com/VSCodeVim/Vim/issues/1382)
- Find/Replace on visual block selection is not working [\#1250](https://github.com/VSCodeVim/Vim/issues/1250)

**Merged pull requests:**

- Update README.md [\#1390](https://github.com/VSCodeVim/Vim/pull/1390) (@xconverge)
- fixes \#1385 % motion with a count [\#1387](https://github.com/VSCodeVim/Vim/pull/1387) (@xconverge)
- fixes \#1382 [\#1386](https://github.com/VSCodeVim/Vim/pull/1386) (@xconverge)

## [v0.6.3](https://github.com/vscodevim/vim/tree/v0.6.3) (2017-03-11)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.0...v0.6.3)

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

**Merged pull requests:**

- fixes \#1373 [\#1374](https://github.com/VSCodeVim/Vim/pull/1374) (@xconverge)
- Remove log file. [\#1368](https://github.com/VSCodeVim/Vim/pull/1368) (@frewsxcv)
- Remove our modified older typings [\#1367](https://github.com/VSCodeVim/Vim/pull/1367) (@xconverge)
- \[WIP\] fix travis due to double digit version numbers [\#1366](https://github.com/VSCodeVim/Vim/pull/1366) (@xconverge)
- Fixed numbered registered macros from overwriting themselves [\#1362](https://github.com/VSCodeVim/Vim/pull/1362) (@xconverge)
- Update config options without restarting [\#1361](https://github.com/VSCodeVim/Vim/pull/1361) (@xconverge)
- Index fixes [\#1190](https://github.com/VSCodeVim/Vim/pull/1190) (@xconverge)

## [v0.6.0](https://github.com/vscodevim/vim/tree/v0.6.0) (2017-03-03)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.5.3...v0.6.0)

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
- Visual Mode Issues: p command after Y [\#1308](https://github.com/VSCodeVim/Vim/issues/1308)
- Visual Mode Issues: X command [\#1304](https://github.com/VSCodeVim/Vim/issues/1304)
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

**Merged pull requests:**

- Fix clipboard copy [\#1349](https://github.com/VSCodeVim/Vim/pull/1349) (@johnfn)
- regex match [\#1346](https://github.com/VSCodeVim/Vim/pull/1346) (@rebornix)
- Add limited support for :sort [\#1342](https://github.com/VSCodeVim/Vim/pull/1342) (@jordan-heemskerk)
- Override VSCode copy command. \#1337, \#616. [\#1339](https://github.com/VSCodeVim/Vim/pull/1339) (@johnfn)
- Fix \#1318 [\#1338](https://github.com/VSCodeVim/Vim/pull/1338) (@rebornix)
- Fix \#1329 failing build by removing undefined in configuration.ts [\#1332](https://github.com/VSCodeVim/Vim/pull/1332) (@misoguy)
- fixes \#1327 [\#1331](https://github.com/VSCodeVim/Vim/pull/1331) (@xconverge)
- fixes \#1320 [\#1325](https://github.com/VSCodeVim/Vim/pull/1325) (@xconverge)
- fixes \#1313 [\#1324](https://github.com/VSCodeVim/Vim/pull/1324) (@xconverge)
- Add ctrl-w q action to quit current window. [\#1317](https://github.com/VSCodeVim/Vim/pull/1317) (@tail)
- Fix lint issue. [\#1316](https://github.com/VSCodeVim/Vim/pull/1316) (@tail)
- Fix c on line beginning\#1302 [\#1303](https://github.com/VSCodeVim/Vim/pull/1303) (@xlaech)
- fixes travis with minor hack used in tests [\#1301](https://github.com/VSCodeVim/Vim/pull/1301) (@xconverge)
- D in visual mode behaves like d [\#1297](https://github.com/VSCodeVim/Vim/pull/1297) (@xlaech)
- Fix for \#1293 [\#1296](https://github.com/VSCodeVim/Vim/pull/1296) (@xlaech)
- Update readme for some clarity on using settings [\#1295](https://github.com/VSCodeVim/Vim/pull/1295) (@xconverge)
- fixes \#1290, visual block still has the same issue though [\#1291](https://github.com/VSCodeVim/Vim/pull/1291) (@xconverge)
- More surround fixes [\#1289](https://github.com/VSCodeVim/Vim/pull/1289) (@xconverge)

## [v0.5.3](https://github.com/vscodevim/vim/tree/v0.5.3) (2017-02-12)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.5.0...v0.5.3)

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

**Merged pull requests:**

- fixes \#1258 [\#1286](https://github.com/VSCodeVim/Vim/pull/1286) (@xconverge)
- avoid using user remapping in test mode [\#1278](https://github.com/VSCodeVim/Vim/pull/1278) (@rufusroflpunch)
- Support exact and inexact current word search [\#1277](https://github.com/VSCodeVim/Vim/pull/1277) (@rhys-vdw)
- fixes \#1271 [\#1274](https://github.com/VSCodeVim/Vim/pull/1274) (@xconverge)
- fixes \#1199 easymotion in visual mode [\#1273](https://github.com/VSCodeVim/Vim/pull/1273) (@xconverge)
- fixes \#1145 [\#1272](https://github.com/VSCodeVim/Vim/pull/1272) (@xconverge)
- Delete matching bracket upon backspace [\#1267](https://github.com/VSCodeVim/Vim/pull/1267) (@rufusroflpunch)
- Clearing commandList for remapped commands [\#1263](https://github.com/VSCodeVim/Vim/pull/1263) (@rufusroflpunch)
- Added tag text to status bar in surround mode [\#1254](https://github.com/VSCodeVim/Vim/pull/1254) (@xconverge)
- Fix autoindent when opening a line above [\#1249](https://github.com/VSCodeVim/Vim/pull/1249) (@inejge)
- Fixes README spelling mistake [\#1246](https://github.com/VSCodeVim/Vim/pull/1246) (@eastwood)

## [v0.5.0](https://github.com/vscodevim/vim/tree/v0.5.0) (2017-01-23)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.5.1...v0.5.0)

## [v0.5.1](https://github.com/vscodevim/vim/tree/v0.5.1) (2017-01-23)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.10...v0.5.1)

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

**Merged pull requests:**

- Surround [\#1238](https://github.com/VSCodeVim/Vim/pull/1238) (@johnfn)
- Support "gf" in es6 import statements by adding the file extension [\#1227](https://github.com/VSCodeVim/Vim/pull/1227) (@aminroosta)
- fixes \#1214 [\#1217](https://github.com/VSCodeVim/Vim/pull/1217) (@Platzer)

## [v0.4.10](https://github.com/vscodevim/vim/tree/v0.4.10) (2016-12-22)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.9...v0.4.10)

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

**Merged pull requests:**

- fixes \#1132 [\#1187](https://github.com/VSCodeVim/Vim/pull/1187) (@xconverge)
- fixes \#1173 [\#1186](https://github.com/VSCodeVim/Vim/pull/1186) (@xconverge)
- Fixed register tests breaking due to \#1183 [\#1185](https://github.com/VSCodeVim/Vim/pull/1185) (@vikramthyagarajan)
- fixes \#1180 [\#1183](https://github.com/VSCodeVim/Vim/pull/1183) (@xconverge)
- Adds documentation for adding leader bindings [\#1182](https://github.com/VSCodeVim/Vim/pull/1182) (@eastwood)
- Implements Global state [\#1179](https://github.com/VSCodeVim/Vim/pull/1179) (@vikramthyagarajan)
- fixes \#1176 [\#1177](https://github.com/VSCodeVim/Vim/pull/1177) (@xconverge)
- Select inner vi\( fix [\#1175](https://github.com/VSCodeVim/Vim/pull/1175) (@xconverge)
- fixes \#1170 [\#1174](https://github.com/VSCodeVim/Vim/pull/1174) (@xconverge)
- Fixes travis [\#1169](https://github.com/VSCodeVim/Vim/pull/1169) (@xconverge)
- control key bindings respect the useCtrlKey setting [\#1151](https://github.com/VSCodeVim/Vim/pull/1151) (@xwvvvvwx)
- fixes \#657 implements search history [\#1147](https://github.com/VSCodeVim/Vim/pull/1147) (@xconverge)
- More click past eol o no [\#1146](https://github.com/VSCodeVim/Vim/pull/1146) (@xconverge)
- Reselect visual implemented \(gv\) [\#1141](https://github.com/VSCodeVim/Vim/pull/1141) (@xconverge)
- fixes \#1136 [\#1139](https://github.com/VSCodeVim/Vim/pull/1139) (@xconverge)
- minor fixes for \# and \* after using :nohl [\#1134](https://github.com/VSCodeVim/Vim/pull/1134) (@xconverge)
- Updated useCtrlKeys default value [\#1126](https://github.com/VSCodeVim/Vim/pull/1126) (@Mxbonn)
- fixes \#1063 [\#1124](https://github.com/VSCodeVim/Vim/pull/1124) (@xconverge)

## [v0.4.9](https://github.com/vscodevim/vim/tree/v0.4.9) (2016-12-05)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.8...v0.4.9)

**Closed issues:**

- o\<tab\> inserts the string "\<tab\>" [\#1121](https://github.com/VSCodeVim/Vim/issues/1121)

## [v0.4.8](https://github.com/vscodevim/vim/tree/v0.4.8) (2016-12-05)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.7...v0.4.8)

**Closed issues:**

- Holding h,j,k or l to move around results in cursor hopping back and forth [\#1120](https://github.com/VSCodeVim/Vim/issues/1120)
- VSCodeVim keeps overwriting editor.cursorBlinking to "blink" in my User settings [\#1119](https://github.com/VSCodeVim/Vim/issues/1119)
- Selecting to end of word, then pasting to clipboard, then loses the last character [\#1118](https://github.com/VSCodeVim/Vim/issues/1118)
- Remapping navigation keys no longer work [\#1116](https://github.com/VSCodeVim/Vim/issues/1116)
- Navigation problems with arrow keys [\#1115](https://github.com/VSCodeVim/Vim/issues/1115)

**Merged pull requests:**

- Update readme for easymotion [\#1114](https://github.com/VSCodeVim/Vim/pull/1114) (@xconverge)

## [v0.4.7](https://github.com/vscodevim/vim/tree/v0.4.7) (2016-12-05)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.6...v0.4.7)

**Closed issues:**

- Show command in status bar as it's being entered \(showcmd\) [\#1109](https://github.com/VSCodeVim/Vim/issues/1109)
- Blink cursor only on insert mode [\#1105](https://github.com/VSCodeVim/Vim/issues/1105)
- `dit` and `cit` do not work for multi-line [\#1078](https://github.com/VSCodeVim/Vim/issues/1078)
- \>\#k and \<\#k ignore the current line when in the left-most column. [\#1058](https://github.com/VSCodeVim/Vim/issues/1058)

**Merged pull requests:**

- Fix minor typo [\#1113](https://github.com/VSCodeVim/Vim/pull/1113) (@xconverge)
- \[WIP\] initial leader fixes [\#1112](https://github.com/VSCodeVim/Vim/pull/1112) (@xconverge)
- Added more aliases for nohl [\#1111](https://github.com/VSCodeVim/Vim/pull/1111) (@xconverge)
- Turns highlighting back on after nohl if you try to go to a new searc… [\#1110](https://github.com/VSCodeVim/Vim/pull/1110) (@xconverge)

## [v0.4.6](https://github.com/vscodevim/vim/tree/v0.4.6) (2016-12-04)
[Full Changelog](https://github.com/vscodevim/vim/compare/0.4.5...v0.4.6)

## [0.4.5](https://github.com/vscodevim/vim/tree/0.4.5) (2016-12-04)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.5...0.4.5)

**Closed issues:**

- in visual mode type e ,not end of the word [\#1107](https://github.com/VSCodeVim/Vim/issues/1107)

**Merged pull requests:**

- \[WIP\] gq [\#1106](https://github.com/VSCodeVim/Vim/pull/1106) (@johnfn)

## [v0.4.5](https://github.com/vscodevim/vim/tree/v0.4.5) (2016-12-02)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.4...v0.4.5)

**Closed issues:**

- If you press \<esc\> in Normal Mode, we should close out of any tooltips/popups [\#1104](https://github.com/VSCodeVim/Vim/issues/1104)
- Please make InsertMode mode by default for create new file. [\#1103](https://github.com/VSCodeVim/Vim/issues/1103)
- Visual mode stops working [\#1101](https://github.com/VSCodeVim/Vim/issues/1101)
- VIM emulation - Ctrl-o in insert mode does not work as expected [\#1097](https://github.com/VSCodeVim/Vim/issues/1097)
- VS Code can't search with spaces [\#1094](https://github.com/VSCodeVim/Vim/issues/1094)
- vim.scroll setting doesnt' work [\#1093](https://github.com/VSCodeVim/Vim/issues/1093)
- Word boundaries broken [\#1090](https://github.com/VSCodeVim/Vim/issues/1090)
- setting to open files in Insert mode by default [\#1088](https://github.com/VSCodeVim/Vim/issues/1088)

**Merged pull requests:**

- Override home key \(for pressing home in visual for example\) [\#1100](https://github.com/VSCodeVim/Vim/pull/1100) (@xconverge)
- avoid syncing style back to config [\#1099](https://github.com/VSCodeVim/Vim/pull/1099) (@rebornix)
- Implement open file command - Issue \#801 [\#1098](https://github.com/VSCodeVim/Vim/pull/1098) (@jamirvin)

## [v0.4.4](https://github.com/vscodevim/vim/tree/v0.4.4) (2016-11-29)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.3...v0.4.4)

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

**Merged pull requests:**

- Removed debug print [\#1083](https://github.com/VSCodeVim/Vim/pull/1083) (@xconverge)
- Update roadmap for ctrl-o [\#1082](https://github.com/VSCodeVim/Vim/pull/1082) (@xconverge)
- fixes \#1076 [\#1077](https://github.com/VSCodeVim/Vim/pull/1077) (@xconverge)
- fixes \#1073 [\#1074](https://github.com/VSCodeVim/Vim/pull/1074) (@xconverge)
- fixes \#1065 [\#1071](https://github.com/VSCodeVim/Vim/pull/1071) (@xconverge)
- fixes \#1023 [\#1069](https://github.com/VSCodeVim/Vim/pull/1069) (@xconverge)

## [v0.4.3](https://github.com/vscodevim/vim/tree/v0.4.3) (2016-11-19)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.2...v0.4.3)

**Closed issues:**

- Support ctrl-w ctrl-w to cycle focus between open windows/editors [\#1064](https://github.com/VSCodeVim/Vim/issues/1064)
- \<Ctrl-W\> \<Arrow-Key\> doesn't work [\#1060](https://github.com/VSCodeVim/Vim/issues/1060)

**Merged pull requests:**

- fixes \#1034 [\#1068](https://github.com/VSCodeVim/Vim/pull/1068) (@xconverge)
- fixes \#1035 [\#1067](https://github.com/VSCodeVim/Vim/pull/1067) (@xconverge)
- fixes \#1064 [\#1066](https://github.com/VSCodeVim/Vim/pull/1066) (@xconverge)
- How can I fix travis failure [\#1062](https://github.com/VSCodeVim/Vim/pull/1062) (@rebornix)

## [v0.4.2](https://github.com/vscodevim/vim/tree/v0.4.2) (2016-11-17)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.1...v0.4.2)

**Closed issues:**

- use j, k for select file up and down in explorer like atom  [\#1059](https://github.com/VSCodeVim/Vim/issues/1059)

## [v0.4.1](https://github.com/vscodevim/vim/tree/v0.4.1) (2016-10-31)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.0...v0.4.1)

## [v0.4.0](https://github.com/vscodevim/vim/tree/v0.4.0) (2016-10-24)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.3.8...v0.4.0)

## [v0.3.8](https://github.com/vscodevim/vim/tree/v0.3.8) (2016-10-18)
[Full Changelog](https://github.com/vscodevim/vim/compare/0.3.7...v0.3.8)

## [0.3.7](https://github.com/vscodevim/vim/tree/0.3.7) (2016-10-12)
[Full Changelog](https://github.com/vscodevim/vim/compare/0.3.6...0.3.7)

## [0.3.6](https://github.com/vscodevim/vim/tree/0.3.6) (2016-10-12)
[Full Changelog](https://github.com/vscodevim/vim/compare/0.3.5...0.3.6)

## [0.3.5](https://github.com/vscodevim/vim/tree/0.3.5) (2016-10-10)
[Full Changelog](https://github.com/vscodevim/vim/compare/0.3.4...0.3.5)

## [0.3.4](https://github.com/vscodevim/vim/tree/0.3.4) (2016-10-10)
[Full Changelog](https://github.com/vscodevim/vim/compare/0.3.3...0.3.4)

## [0.3.3](https://github.com/vscodevim/vim/tree/0.3.3) (2016-10-08)
[Full Changelog](https://github.com/vscodevim/vim/compare/0.3.2...0.3.3)

## [0.3.2](https://github.com/vscodevim/vim/tree/0.3.2) (2016-10-08)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.3.1...0.3.2)

## [v0.3.1](https://github.com/vscodevim/vim/tree/v0.3.1) (2016-10-08)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.3.0...v0.3.1)

## [v0.3.0](https://github.com/vscodevim/vim/tree/v0.3.0) (2016-10-03)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.2.0...v0.3.0)

## [v0.2.0](https://github.com/vscodevim/vim/tree/v0.2.0) (2016-09-21)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.11...v0.2.0)

## [v0.1.11](https://github.com/vscodevim/vim/tree/v0.1.11) (2016-09-20)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.10...v0.1.11)

## [v0.1.10](https://github.com/vscodevim/vim/tree/v0.1.10) (2016-09-06)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.9...v0.1.10)

## [v0.1.9](https://github.com/vscodevim/vim/tree/v0.1.9) (2016-09-05)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.8...v0.1.9)

## [v0.1.8](https://github.com/vscodevim/vim/tree/v0.1.8) (2016-09-04)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.7...v0.1.8)

## [v0.1.7](https://github.com/vscodevim/vim/tree/v0.1.7) (2016-08-14)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.6...v0.1.7)

## [v0.1.6](https://github.com/vscodevim/vim/tree/v0.1.6) (2016-08-09)
[Full Changelog](https://github.com/vscodevim/vim/compare/0.1.5...v0.1.6)

## [0.1.5](https://github.com/vscodevim/vim/tree/0.1.5) (2016-08-09)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.5...0.1.5)

## [v0.1.5](https://github.com/vscodevim/vim/tree/v0.1.5) (2016-08-09)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.4...v0.1.5)

## [v0.1.4](https://github.com/vscodevim/vim/tree/v0.1.4) (2016-07-28)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.3...v0.1.4)

## [v0.1.3](https://github.com/vscodevim/vim/tree/v0.1.3) (2016-07-19)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.2...v0.1.3)

## [v0.1.2](https://github.com/vscodevim/vim/tree/v0.1.2) (2016-07-13)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.1...v0.1.2)

## [v0.1.1](https://github.com/vscodevim/vim/tree/v0.1.1) (2016-07-08)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1...v0.1.1)

## [v0.1](https://github.com/vscodevim/vim/tree/v0.1) (2016-07-08)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.28...v0.1)

## [v0.0.28](https://github.com/vscodevim/vim/tree/v0.0.28) (2016-06-24)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.27...v0.0.28)

## [v0.0.27](https://github.com/vscodevim/vim/tree/v0.0.27) (2016-06-23)
[Full Changelog](https://github.com/vscodevim/vim/compare/0.0.26...v0.0.27)

## [0.0.26](https://github.com/vscodevim/vim/tree/0.0.26) (2016-06-22)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.26...0.0.26)

## [v0.0.26](https://github.com/vscodevim/vim/tree/v0.0.26) (2016-06-22)
[Full Changelog](https://github.com/vscodevim/vim/compare/0.0.25...v0.0.26)

## [0.0.25](https://github.com/vscodevim/vim/tree/0.0.25) (2016-06-20)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.25...0.0.25)

## [v0.0.25](https://github.com/vscodevim/vim/tree/v0.0.25) (2016-06-20)
[Full Changelog](https://github.com/vscodevim/vim/compare/0.0.24...v0.0.25)

## [0.0.24](https://github.com/vscodevim/vim/tree/0.0.24) (2016-06-19)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.24...0.0.24)

## [v0.0.24](https://github.com/vscodevim/vim/tree/v0.0.24) (2016-06-19)
[Full Changelog](https://github.com/vscodevim/vim/compare/0.0.23...v0.0.24)

## [0.0.23](https://github.com/vscodevim/vim/tree/0.0.23) (2016-06-19)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.23...0.0.23)

## [v0.0.23](https://github.com/vscodevim/vim/tree/v0.0.23) (2016-06-19)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.22...v0.0.23)

## [v0.0.22](https://github.com/vscodevim/vim/tree/v0.0.22) (2016-06-18)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.21...v0.0.22)

## [v0.0.21](https://github.com/vscodevim/vim/tree/v0.0.21) (2016-06-17)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.20...v0.0.21)

## [v0.0.20](https://github.com/vscodevim/vim/tree/v0.0.20) (2016-06-13)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.19...v0.0.20)

## [v0.0.19](https://github.com/vscodevim/vim/tree/v0.0.19) (2016-06-07)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.18...v0.0.19)

## [v0.0.18](https://github.com/vscodevim/vim/tree/v0.0.18) (2016-05-19)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.17...v0.0.18)

## [v0.0.17](https://github.com/vscodevim/vim/tree/v0.0.17) (2016-05-17)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.16...v0.0.17)

## [v0.0.16](https://github.com/vscodevim/vim/tree/v0.0.16) (2016-05-03)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.15...v0.0.16)

## [v0.0.15](https://github.com/vscodevim/vim/tree/v0.0.15) (2016-03-22)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.14...v0.0.15)

## [v0.0.14](https://github.com/vscodevim/vim/tree/v0.0.14) (2016-03-21)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.13...v0.0.14)

## [v0.0.13](https://github.com/vscodevim/vim/tree/v0.0.13) (2016-03-18)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.12...v0.0.13)

## [v0.0.12](https://github.com/vscodevim/vim/tree/v0.0.12) (2016-03-04)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.11...v0.0.12)

## [v0.0.11](https://github.com/vscodevim/vim/tree/v0.0.11) (2016-02-18)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.10...v0.0.11)

## [v0.0.10](https://github.com/vscodevim/vim/tree/v0.0.10) (2016-02-01)
[Full Changelog](https://github.com/vscodevim/vim/compare/0.0.9...v0.0.10)

## [0.0.9](https://github.com/vscodevim/vim/tree/0.0.9) (2016-01-06)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.9...0.0.9)

## [v0.0.9](https://github.com/vscodevim/vim/tree/v0.0.9) (2016-01-06)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.8...v0.0.9)

## [v0.0.8](https://github.com/vscodevim/vim/tree/v0.0.8) (2016-01-03)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.7...v0.0.8)

## [v0.0.7](https://github.com/vscodevim/vim/tree/v0.0.7) (2016-01-03)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.6...v0.0.7)

## [v0.0.6](https://github.com/vscodevim/vim/tree/v0.0.6) (2015-12-30)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.5...v0.0.6)

## [v0.0.5](https://github.com/vscodevim/vim/tree/v0.0.5) (2015-12-09)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.3...v0.0.5)

## [v0.0.3](https://github.com/vscodevim/vim/tree/v0.0.3) (2015-12-04)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.2...v0.0.3)

## [v0.0.2](https://github.com/vscodevim/vim/tree/v0.0.2) (2015-11-29)
[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.1...v0.0.2)

## [v0.0.1](https://github.com/vscodevim/vim/tree/v0.0.1) (2015-11-29)


\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*