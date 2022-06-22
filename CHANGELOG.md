# Change Log

## [v1.22.2](https://github.com/vscodevim/vim/tree/v1.22.2) (2022-02-18)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.22.1...v1.22.2)

**Fixed Bugs:**

- Failed to handle key `j`: Cannot read property 'substring' of undefined [\#7512](https://github.com/VSCodeVim/Vim/issues/7512)
- 1.22 broken for browser [\#7469](https://github.com/VSCodeVim/Vim/issues/7469)
- Tab completion of file names should be case insensitive on Windows [\#7160](https://github.com/VSCodeVim/Vim/issues/7160)

**Merged pull requests:**

- Fix extension for web [\#7520](https://github.com/VSCodeVim/Vim/pull/7520) ([jeanp413](https://github.com/jeanp413))
- fix bugs with: Failed to handle key ... Cannot read property 'substring' of undefined [\#7513](https://github.com/VSCodeVim/Vim/pull/7513) ([elazarcoh](https://github.com/elazarcoh))
- Tab completion of file names is case insensitive on Windows [\#7471](https://github.com/VSCodeVim/Vim/pull/7471) ([elazarcoh](https://github.com/elazarcoh))

## [v1.22.1](https://github.com/vscodevim/vim/tree/v1.22.1) (2022-02-08)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.22.0...v1.22.1)

**Fixed Bugs:**

- `\#` does not work with `visualstar` enabled [\#7463](https://github.com/VSCodeVim/Vim/issues/7463)
- `\*` does not reliably update search highlights [\#7462](https://github.com/VSCodeVim/Vim/issues/7462)

**Merged pull requests:**

- Added documentation for complex keyboard shortcuts [\#6944](https://github.com/VSCodeVim/Vim/pull/6944) ([w-cantin](https://github.com/w-cantin))

## [v1.22.0](https://github.com/vscodevim/vim/tree/v1.22.0) (2022-02-07)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.21.10...v1.22.0)

**Enhancements:**

- Vim filter with WSL2 is unavailable [\#7100](https://github.com/VSCodeVim/Vim/issues/7100)

**Fixed Bugs:**

- `O` does not properly preserve indentation [\#7423](https://github.com/VSCodeVim/Vim/issues/7423)
- `:marks` to list marks doesn't work [\#7367](https://github.com/VSCodeVim/Vim/issues/7367)
- `cgn` fails when the match is one character long [\#7291](https://github.com/VSCodeVim/Vim/issues/7291)
- Notebook-cells duplicate marks [\#7280](https://github.com/VSCodeVim/Vim/issues/7280)
- Command line `move` command throws `E488: Trailing characters` [\#7207](https://github.com/VSCodeVim/Vim/issues/7207)
- Opening search in multiple editors leads to invalid state [\#7038](https://github.com/VSCodeVim/Vim/issues/7038)
- `:s` does not properly handle capture groups \(`\0`, `\1`, ...\) [\#6963](https://github.com/VSCodeVim/Vim/issues/6963)
- Undo doesn't work in Notebook Cell [\#6960](https://github.com/VSCodeVim/Vim/issues/6960)
- Cannot paste with `\<D-v\>` in command-line mode on OSX. Works with `\<C-v\>` [\#6922](https://github.com/VSCodeVim/Vim/issues/6922)
- Exclude `:w`, `:q`, and `:wq` from dot command [\#6829](https://github.com/VSCodeVim/Vim/issues/6829)

**Closed issues:**

- why sneak doesn't highlight matching results using different characters as expected? [\#7429](https://github.com/VSCodeVim/Vim/issues/7429)
- gh to show variable value in debug mode [\#7409](https://github.com/VSCodeVim/Vim/issues/7409)
- Vimrc file won't reload after saving file with vimrcPath's home environment variable [\#7359](https://github.com/VSCodeVim/Vim/issues/7359)
- vim.editVimrc command failed with vimrcPath's home environment variable [\#7358](https://github.com/VSCodeVim/Vim/issues/7358)
- Keep selection when copying text [\#7352](https://github.com/VSCodeVim/Vim/issues/7352)
- Type lower case "j" in insert mode has strange cursor behavior. [\#7351](https://github.com/VSCodeVim/Vim/issues/7351)
- `vim.mode == 'Normal'` in key binding is triggering in replace mode [\#7256](https://github.com/VSCodeVim/Vim/issues/7256)
- Use a separate color for the current match while searching [\#7212](https://github.com/VSCodeVim/Vim/issues/7212)
- Can't install in Azure Data Studio from VSIX package [\#7079](https://github.com/VSCodeVim/Vim/issues/7079)

**Merged pull requests:**

- Fixed a bug where insertLineAbove would leave extra whitespace. [\#7450](https://github.com/VSCodeVim/Vim/pull/7450) ([half-potato](https://github.com/half-potato))
- add sentence when currentChar is undefined [\#7439](https://github.com/VSCodeVim/Vim/pull/7439) ([monjara](https://github.com/monjara))
- Exclude :w, :q, and :wq from dot command [\#7428](https://github.com/VSCodeVim/Vim/pull/7428) ([justalmill](https://github.com/justalmill))
- Fixed insertLineBefore indent behavior [\#7424](https://github.com/VSCodeVim/Vim/pull/7424) ([half-potato](https://github.com/half-potato))
- Implement `inccommand` [\#7416](https://github.com/VSCodeVim/Vim/pull/7416) ([adrsm108](https://github.com/adrsm108))
- added enable key-repeating doc for Codium Exploration Users [\#7408](https://github.com/VSCodeVim/Vim/pull/7408) ([AMMAR-62](https://github.com/AMMAR-62))
- Disable other extensions while running tests for avoiding unexpected side effect [\#7376](https://github.com/VSCodeVim/Vim/pull/7376) ([waynewaynetsai](https://github.com/waynewaynetsai))
- Fix \<D-c\> override system-clipboard issue for macOS users [\#7375](https://github.com/VSCodeVim/Vim/pull/7375) ([waynewaynetsai](https://github.com/waynewaynetsai))
- fix typo in README [\#7365](https://github.com/VSCodeVim/Vim/pull/7365) ([ambiguous48](https://github.com/ambiguous48))
- Fix .vimrc file's issues with vimrcPath's home environment variable [\#7360](https://github.com/VSCodeVim/Vim/pull/7360) ([waynewaynetsai](https://github.com/waynewaynetsai))
- Update README.md [\#7311](https://github.com/VSCodeVim/Vim/pull/7311) ([xerosanyam](https://github.com/xerosanyam))
- Silence failing tests on Windows and add Windows build step [\#7293](https://github.com/VSCodeVim/Vim/pull/7293) ([tagniam](https://github.com/tagniam))
- Add `vim.shell` setting for custom `!` shell [\#7255](https://github.com/VSCodeVim/Vim/pull/7255) ([tagniam](https://github.com/tagniam))
- Add silent option to key remappings [\#7253](https://github.com/VSCodeVim/Vim/pull/7253) ([mly32](https://github.com/mly32))
- Refactor `externalCommand.ts` to not use temporary files [\#7252](https://github.com/VSCodeVim/Vim/pull/7252) ([tagniam](https://github.com/tagniam))
- fix \#6922: paste with \<D-v\> in command-line mode [\#7227](https://github.com/VSCodeVim/Vim/pull/7227) ([Injae-Lee](https://github.com/Injae-Lee))
- Improve incremental search [\#7224](https://github.com/VSCodeVim/Vim/pull/7224) ([adrsm108](https://github.com/adrsm108))
- search operator `\%V` [\#7215](https://github.com/VSCodeVim/Vim/pull/7215) ([elazarcoh](https://github.com/elazarcoh))
- Fix a typo in the bug report template [\#7205](https://github.com/VSCodeVim/Vim/pull/7205) ([brettcannon](https://github.com/brettcannon))
- Fix release date error [\#7178](https://github.com/VSCodeVim/Vim/pull/7178) ([oo6](https://github.com/oo6))
- Added documentation for argument text objects [\#6942](https://github.com/VSCodeVim/Vim/pull/6942) ([w-cantin](https://github.com/w-cantin))

## [v1.21.10](https://github.com/vscodevim/vim/tree/v1.21.10) (2021-10-19)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.21.9...v1.21.10)

**Fixed Bugs:**

- `:tabo\[nly\]` and `:tabc\[lose\]` throw `E488` in version 1.21.9 [\#7171](https://github.com/VSCodeVim/Vim/issues/7171)

## [v1.21.9](https://github.com/vscodevim/vim/tree/v1.21.9) (2021-10-18)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.21.8...v1.21.9)

**Fixed Bugs:**

- /pattern/s/.../.../ doesn't work [\#7151](https://github.com/VSCodeVim/Vim/issues/7151)
- 1.21.8 does not work in web worker anymore [\#7150](https://github.com/VSCodeVim/Vim/issues/7150)
- `\*` throws an error when `wordSeparators` doesn't have `/` [\#7135](https://github.com/VSCodeVim/Vim/issues/7135)
- `iskeyword` doesn't work for multiple languages [\#7123](https://github.com/VSCodeVim/Vim/issues/7123)
- Ex "copy" command with `.`, `-`, or `+` \(current, previous, or next line\) at end of command stopped working [\#7058](https://github.com/VSCodeVim/Vim/issues/7058)

**Closed issues:**

- README.md missing installation item: linux setup [\#7080](https://github.com/VSCodeVim/Vim/issues/7080)

**Merged pull requests:**

- Load process polyfill automatically, required by util [\#7156](https://github.com/VSCodeVim/Vim/pull/7156) ([jeanp413](https://github.com/jeanp413))
- Add pane resize keybindings [\#7138](https://github.com/VSCodeVim/Vim/pull/7138) ([tagniam](https://github.com/tagniam))
- Update ROADMAP.ZH.md [\#7137](https://github.com/VSCodeVim/Vim/pull/7137) ([hellorayza](https://github.com/hellorayza))
- iskeyword is evaluated when a command is called \(\#7123\) [\#7126](https://github.com/VSCodeVim/Vim/pull/7126) ([shinichy](https://github.com/shinichy))
- Fix bang command with ranges [\#7122](https://github.com/VSCodeVim/Vim/pull/7122) ([tagniam](https://github.com/tagniam))
- \#6553: capture file mode and restore it after force write [\#7092](https://github.com/VSCodeVim/Vim/pull/7092) ([joecrop](https://github.com/joecrop))

## [v1.21.8](https://github.com/vscodevim/vim/tree/v1.21.8) (2021-09-29)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.21.7...v1.21.8)

**Enhancements:**

- Support `:substitute`'s `n` flag \(count matches without substituting\) [\#7081](https://github.com/VSCodeVim/Vim/issues/7081)
- Support `\['` and `\]'` \(move to nearby lowercase mark\) commands [\#7041](https://github.com/VSCodeVim/Vim/issues/7041)

**Closed issues:**

- Inconsistent indentation? [\#7107](https://github.com/VSCodeVim/Vim/issues/7107)
- Cannot change to normal mode. [\#7106](https://github.com/VSCodeVim/Vim/issues/7106)
- Simple movement like HJKL should not be recorded in jump history for Ctrl-O and Ctrl-I [\#7102](https://github.com/VSCodeVim/Vim/issues/7102)

**Merged pull requests:**

- fix ROADMAP.md typo [\#7066](https://github.com/VSCodeVim/Vim/pull/7066) ([mly32](https://github.com/mly32))
- make vim strict ui extension [\#7049](https://github.com/VSCodeVim/Vim/pull/7049) ([sandy081](https://github.com/sandy081))
- Added documentation for all Vim Modes [\#6945](https://github.com/VSCodeVim/Vim/pull/6945) ([w-cantin](https://github.com/w-cantin))

## [v1.21.7](https://github.com/vscodevim/vim/tree/v1.21.7) (2021-08-31)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.21.6...v1.21.7)

**Enhancements:**

- `:delete` and `:yank` should support `{count}` argument [\#6995](https://github.com/VSCodeVim/Vim/issues/6995)

**Fixed Bugs:**

- Failed to handle key=\<C-e\>. Cannot read property 'end' of undefined [\#7027](https://github.com/VSCodeVim/Vim/issues/7027)
- Failed to handle key=\<Esc\>. e.getTransformation is not a function [\#7009](https://github.com/VSCodeVim/Vim/issues/7009)

**Closed issues:**

- Why vim-surround command csw" \(word surround\) is not working now? [\#7003](https://github.com/VSCodeVim/Vim/issues/7003)
- Allow for appending to \[a-z\] registers [\#6965](https://github.com/VSCodeVim/Vim/issues/6965)

**Merged pull requests:**

- Show command and search when showmodename is disabled [\#7021](https://github.com/VSCodeVim/Vim/pull/7021) ([BlakeWilliams](https://github.com/BlakeWilliams))
- Adds count argument to `:yank` and `:delete` commands [\#7007](https://github.com/VSCodeVim/Vim/pull/7007) ([DevinLeamy](https://github.com/DevinLeamy))
- fix: \<tab\> behavior in replace mode [\#6997](https://github.com/VSCodeVim/Vim/pull/6997) ([Komar0ff](https://github.com/Komar0ff))
- Append to \[a-z\] registers [\#6971](https://github.com/VSCodeVim/Vim/pull/6971) ([DevinLeamy](https://github.com/DevinLeamy))

## [v1.21.6](https://github.com/vscodevim/vim/tree/v1.21.6) (2021-08-11)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.21.5...v1.21.6)

**Fixed Bugs:**

- Backslashes must be duplicated in :s substitution [\#6890](https://github.com/VSCodeVim/Vim/issues/6890)
- Failed to handle key=\<Esc\>. Overlapping ranges are not allowed! [\#6888](https://github.com/VSCodeVim/Vim/issues/6888)
- Failed to handle key=:. No cursor index - this should never ever happen! [\#6887](https://github.com/VSCodeVim/Vim/issues/6887)
- `:marks` show error position when focusing on another file [\#6886](https://github.com/VSCodeVim/Vim/issues/6886)
- Failed to handle key=.. Illegal argument: line must be non-negative [\#6870](https://github.com/VSCodeVim/Vim/issues/6870)
- Repeating with `.` does not play nice with auto-matching quotes [\#6819](https://github.com/VSCodeVim/Vim/issues/6819)

**Closed issues:**

- s [\#6959](https://github.com/VSCodeVim/Vim/issues/6959)
- Make "gd" Open definition to the side in Search Editor [\#6921](https://github.com/VSCodeVim/Vim/issues/6921)
- Failed to handle key=\<C-o\>. Could NOT open editor for "file:///home/fabrice/CRIStAL/Speed/examples/train_example.py". [\#6868](https://github.com/VSCodeVim/Vim/issues/6868)
- Failed to handle key=2. Cannot read property 'length' of undefined [\#6861](https://github.com/VSCodeVim/Vim/issues/6861)
- Failed to handle key=.. Overlapping ranges are not allowed! [\#6840](https://github.com/VSCodeVim/Vim/issues/6840)

**Merged pull requests:**

- Fix history navigation in VS Code interactive window [\#6980](https://github.com/VSCodeVim/Vim/pull/6980) ([rebornix](https://github.com/rebornix))
- Remove look behind for Safari [\#6937](https://github.com/VSCodeVim/Vim/pull/6937) ([rebornix](https://github.com/rebornix))
- Fix /\\c by requiring odd number of \'s before c for case \(in\)sensitivity [\#6900](https://github.com/VSCodeVim/Vim/pull/6900) ([edemaine](https://github.com/edemaine))
- Fix escaping in :s substitutions [\#6891](https://github.com/VSCodeVim/Vim/pull/6891) ([edemaine](https://github.com/edemaine))
- Argument text object documentation [\#6857](https://github.com/VSCodeVim/Vim/pull/6857) ([w-cantin](https://github.com/w-cantin))
- Add debuggingForeground to colorCustomizations [\#6852](https://github.com/VSCodeVim/Vim/pull/6852) ([lmlorca](https://github.com/lmlorca))

## [v1.21.5](https://github.com/vscodevim/vim/tree/v1.21.5) (2021-07-06)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.21.4...v1.21.5)

**Fixed Bugs:**

- :sort u merges two duplicates [\#6825](https://github.com/VSCodeVim/Vim/issues/6825)
- setting space as leader key does not work anymore [\#6824](https://github.com/VSCodeVim/Vim/issues/6824)
- Problems with \<leader\> key and remapping in the latest version [\#6821](https://github.com/VSCodeVim/Vim/issues/6821)

**Merged pull requests:**

- Fix sort unique bug [\#6835](https://github.com/VSCodeVim/Vim/pull/6835) ([sixskys](https://github.com/sixskys))

## [v1.21.4](https://github.com/vscodevim/vim/tree/v1.21.4) (2021-07-02)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.21.3...v1.21.4)

**Fixed Bugs:**

- `2i"` should act like `a"`, but exclude whitespace before/after the quotes [\#6806](https://github.com/VSCodeVim/Vim/issues/6806)

## [v1.21.3](https://github.com/vscodevim/vim/tree/v1.21.3) (2021-06-18)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.21.2...v1.21.3)

## [v1.21.2](https://github.com/vscodevim/vim/tree/v1.21.2) (2021-06-11)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.21.1...v1.21.2)

## [v1.21.1](https://github.com/vscodevim/vim/tree/v1.21.1) (2021-06-10)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.21.0...v1.21.1)

## [v1.21.0](https://github.com/vscodevim/vim/tree/v1.21.0) (2021-06-09)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.20.3...v1.21.0)

## [v1.20.3](https://github.com/vscodevim/vim/tree/v1.20.3) (2021-05-18)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.20.2...v1.20.3)

## [v1.20.2](https://github.com/vscodevim/vim/tree/v1.20.2) (2021-04-30)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.20.1...v1.20.2)

## [v1.20.1](https://github.com/vscodevim/vim/tree/v1.20.1) (2021-04-25)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.20.0...v1.20.1)

## [v1.20.0](https://github.com/vscodevim/vim/tree/v1.20.0) (2021-04-17)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.19.3...v1.20.0)

## [v1.19.3](https://github.com/vscodevim/vim/tree/v1.19.3) (2021-03-29)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.19.2...v1.19.3)

## [v1.19.2](https://github.com/vscodevim/vim/tree/v1.19.2) (2021-03-24)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.19.1...v1.19.2)

## [v1.19.1](https://github.com/vscodevim/vim/tree/v1.19.1) (2021-03-21)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.19.0...v1.19.1)

## [v1.19.0](https://github.com/vscodevim/vim/tree/v1.19.0) (2021-03-19)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.18.9...v1.19.0)

## [v1.18.9](https://github.com/vscodevim/vim/tree/v1.18.9) (2021-02-05)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.18.8...v1.18.9)

## [v1.18.8](https://github.com/vscodevim/vim/tree/v1.18.8) (2021-02-02)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.18.7...v1.18.8)

## [v1.18.7](https://github.com/vscodevim/vim/tree/v1.18.7) (2021-02-01)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.18.5...v1.18.7)

## [v1.18.5](https://github.com/vscodevim/vim/tree/v1.18.5) (2020-12-10)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.18.4...v1.18.5)

## [v1.18.4](https://github.com/vscodevim/vim/tree/v1.18.4) (2020-12-07)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.18.3...v1.18.4)

## [v1.18.3](https://github.com/vscodevim/vim/tree/v1.18.3) (2020-12-07)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.18.2...v1.18.3)

## [v1.18.2](https://github.com/vscodevim/vim/tree/v1.18.2) (2020-12-07)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.18.0...v1.18.2)

## [v1.18.0](https://github.com/vscodevim/vim/tree/v1.18.0) (2020-12-06)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.17.1...v1.18.0)

## [v1.17.1](https://github.com/vscodevim/vim/tree/v1.17.1) (2020-09-25)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.17.0...v1.17.1)

## [v1.17.0](https://github.com/vscodevim/vim/tree/v1.17.0) (2020-09-22)

[Full Changelog](https://github.com/vscodevim/vim/compare/beta...v1.17.0)

## [beta](https://github.com/vscodevim/vim/tree/beta) (2020-09-21)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.16.0...beta)

## [v1.11.0](https://github.com/vscodevim/vim/tree/v1.11.0) (2019-09-28)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.10.2...v1.11.0)

**Enhancements:**

- Support VSCode's View: Toggle Panel in vim mode. [\#4103](https://github.com/VSCodeVim/Vim/issues/4103)
- Store subparsers in terms of abbreviation and full command [\#4094](https://github.com/VSCodeVim/Vim/issues/4094)
- directories are un-completable with tab-completion [\#4085](https://github.com/VSCodeVim/Vim/issues/4085)
- Command mode status bar is too small [\#4077](https://github.com/VSCodeVim/Vim/issues/4077)
- set cursorcolumn [\#4076](https://github.com/VSCodeVim/Vim/issues/4076)
- Support for whichwarp [\#4068](https://github.com/VSCodeVim/Vim/issues/4068)
- Command line does not support Ctrl-W [\#4027](https://github.com/VSCodeVim/Vim/issues/4027)
- Add setting to swap ; with : in Easymotion [\#4020](https://github.com/VSCodeVim/Vim/issues/4020)
- Allow for placeholders in rebindings [\#4012](https://github.com/VSCodeVim/Vim/issues/4012)
- Support :his\[tory\] [\#3949](https://github.com/VSCodeVim/Vim/issues/3949)
- Support gdefault option [\#3594](https://github.com/VSCodeVim/Vim/issues/3594)

**Fixed Bugs:**

- Find and replace all occurances in current line does not work [\#4067](https://github.com/VSCodeVim/Vim/issues/4067)
- Commentary does not work in visual block mode [\#4036](https://github.com/VSCodeVim/Vim/issues/4036)
- Change operator doesn't behave linewise when appropriate [\#4024](https://github.com/VSCodeVim/Vim/issues/4024)
- \$ command takes newline in visual mode [\#3970](https://github.com/VSCodeVim/Vim/issues/3970)
- Text reflow doesn't respect tabs [\#3929](https://github.com/VSCodeVim/Vim/issues/3929)
- commands \(d, y, c...\) don't work with the smart selection [\#3850](https://github.com/VSCodeVim/Vim/issues/3850)
- :split Can't Open Files With Names That Include Spaces [\#3824](https://github.com/VSCodeVim/Vim/issues/3824)
- Unexpected jumping after deleting a line with 'd-d' [\#3804](https://github.com/VSCodeVim/Vim/issues/3804)
- jk doesn't respect tab size [\#3796](https://github.com/VSCodeVim/Vim/issues/3796)
- 'dd' followed by any character jumps cursor to end of file. [\#3713](https://github.com/VSCodeVim/Vim/issues/3713)
- In ctrl v mode, c doesn't change all instances [\#3601](https://github.com/VSCodeVim/Vim/issues/3601)

**Closed issues:**

- gf doesn't work for files not from current directory [\#4099](https://github.com/VSCodeVim/Vim/issues/4099)
- ViM extension makes VSCode super slow, typing is almost impossible. [\#4088](https://github.com/VSCodeVim/Vim/issues/4088)
- mapping control-something to escape in insert doesn't work [\#4062](https://github.com/VSCodeVim/Vim/issues/4062)
- When Overtype extension presents, VSCodeVim stops working. [\#4046](https://github.com/VSCodeVim/Vim/issues/4046)
- \<C-v\> in search mode doesn't respect cursor position [\#4044](https://github.com/VSCodeVim/Vim/issues/4044)
- Tests for special keys on command line [\#4040](https://github.com/VSCodeVim/Vim/issues/4040)
- Cannot find module 'winston-transport' [\#4029](https://github.com/VSCodeVim/Vim/issues/4029)
- How to re-map ":e" to ":w"? [\#4026](https://github.com/VSCodeVim/Vim/issues/4026)
- Ctrl+h ignores useCtrlKeys and handleKeys binds [\#4019](https://github.com/VSCodeVim/Vim/issues/4019)
- It is possible to scroll the cursor out of screen [\#3846](https://github.com/VSCodeVim/Vim/issues/3846)
- ModeHandler messages not coming through debug console [\#3828](https://github.com/VSCodeVim/Vim/issues/3828)
- :o fails in remote SSH [\#3815](https://github.com/VSCodeVim/Vim/issues/3815)
- Being able to disable VIM on startup [\#3783](https://github.com/VSCodeVim/Vim/issues/3783)
- Autocomplete feature [\#3570](https://github.com/VSCodeVim/Vim/issues/3570)

**Merged pull requests:**

- Use command abbreviations [\#4106](https://github.com/VSCodeVim/Vim/pull/4106) ([J-Fields](https://github.com/J-Fields))
- Update dependency @types/node to v12.7.8 [\#4100](https://github.com/VSCodeVim/Vim/pull/4100) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency @types/node to v12.7.7 [\#4097](https://github.com/VSCodeVim/Vim/pull/4097) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency sinon to v7.5.0 [\#4095](https://github.com/VSCodeVim/Vim/pull/4095) ([renovate[bot]](https://github.com/apps/renovate))
- Tests for special keys on the command line [\#4090](https://github.com/VSCodeVim/Vim/pull/4090) ([J-Fields](https://github.com/J-Fields))
- Add shift+tab support for cmd line [\#4089](https://github.com/VSCodeVim/Vim/pull/4089) ([stevenguh](https://github.com/stevenguh))
- Update dependency ts-loader to v6.1.2 [\#4087](https://github.com/VSCodeVim/Vim/pull/4087) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency ts-loader to v6.1.1 [\#4084](https://github.com/VSCodeVim/Vim/pull/4084) ([renovate[bot]](https://github.com/apps/renovate))
- Add missing `to` in CONTRIBUTING.md [\#4080](https://github.com/VSCodeVim/Vim/pull/4080) ([caleywoods](https://github.com/caleywoods))
- Fix incorrect position when editing the same file in 2 splits [\#4074](https://github.com/VSCodeVim/Vim/pull/4074) ([uHOOCCOOHu](https://github.com/uHOOCCOOHu))
- Smile command [\#4070](https://github.com/VSCodeVim/Vim/pull/4070) ([caleywoods](https://github.com/caleywoods))
- Update dependency @types/node to v12.7.5 [\#4066](https://github.com/VSCodeVim/Vim/pull/4066) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency ts-loader to v6.1.0 [\#4065](https://github.com/VSCodeVim/Vim/pull/4065) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency typescript to v3.6.3 [\#4064](https://github.com/VSCodeVim/Vim/pull/4064) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency tslint to v5.20.0 [\#4060](https://github.com/VSCodeVim/Vim/pull/4060) ([renovate[bot]](https://github.com/apps/renovate))
- Don't use lodash for things ES6 supports natively [\#4056](https://github.com/VSCodeVim/Vim/pull/4056) ([J-Fields](https://github.com/J-Fields))
- Pin dependencies [\#4051](https://github.com/VSCodeVim/Vim/pull/4051) ([renovate[bot]](https://github.com/apps/renovate))
- Fix gq to handle tab indentation [\#4050](https://github.com/VSCodeVim/Vim/pull/4050) ([orn688](https://github.com/orn688))
- Add flag to replace `f` with a single-character sneak [\#4048](https://github.com/VSCodeVim/Vim/pull/4048) ([J-Fields](https://github.com/J-Fields))
- \<C-v\> doesn't respect the cursor in search mode [\#4045](https://github.com/VSCodeVim/Vim/pull/4045) ([stevenguh](https://github.com/stevenguh))
- Fix dependencies [\#4037](https://github.com/VSCodeVim/Vim/pull/4037) ([J-Fields](https://github.com/J-Fields))
- Update dependency @types/node to v12.7.4 [\#4033](https://github.com/VSCodeVim/Vim/pull/4033) ([renovate[bot]](https://github.com/apps/renovate))
- Refactor the existing file opening and auto completion [\#4032](https://github.com/VSCodeVim/Vim/pull/4032) ([stevenguh](https://github.com/stevenguh))
- Remove word in command line with \<C-w\> [\#4031](https://github.com/VSCodeVim/Vim/pull/4031) ([stevenguh](https://github.com/stevenguh))
- Update dependency sinon to v7.4.2 [\#4030](https://github.com/VSCodeVim/Vim/pull/4030) ([renovate[bot]](https://github.com/apps/renovate))
- Implement `nowrapscan` [\#4028](https://github.com/VSCodeVim/Vim/pull/4028) ([contrib15](https://github.com/contrib15))
- linewise change operator [\#4025](https://github.com/VSCodeVim/Vim/pull/4025) ([JoshuaRichards](https://github.com/JoshuaRichards))
- Fix gj/gk so it maintains cursor position [\#3890](https://github.com/VSCodeVim/Vim/pull/3890) ([hetmankp](https://github.com/hetmankp))
- WebPack builds for improved loading times [\#3889](https://github.com/VSCodeVim/Vim/pull/3889) ([ianjfrosst](https://github.com/ianjfrosst))

## [v1.10.2](https://github.com/vscodevim/vim/tree/v1.10.2) (2019-09-01)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.10.1...v1.10.2)

**Closed issues:**

- Cut release 1.10.1 [\#4022](https://github.com/VSCodeVim/Vim/issues/4022)

**Merged pull requests:**

- Fix case sensitive sorting [\#4023](https://github.com/VSCodeVim/Vim/pull/4023) ([noslaver](https://github.com/noslaver))

## [v1.10.1](https://github.com/vscodevim/vim/tree/v1.10.1) (2019-08-31)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.10.0...v1.10.1)

**Fixed Bugs:**

- ReplaceWithRegister doesn't work in visual mode [\#4015](https://github.com/VSCodeVim/Vim/issues/4015)
- \<C-n\> not working in 1.10.0 [\#4011](https://github.com/VSCodeVim/Vim/issues/4011)
- zh/zl/zH/zL not working properly [\#4008](https://github.com/VSCodeVim/Vim/issues/4008)

**Closed issues:**

- Ctrl-P and Ctrl-N can‘t work in the latest version [\#4017](https://github.com/VSCodeVim/Vim/issues/4017)
- d Command Removes Mode Text [\#3781](https://github.com/VSCodeVim/Vim/issues/3781)
- Yanking "clears" mode \(or makes it disappear\) from status bar until INSERT mode [\#3488](https://github.com/VSCodeVim/Vim/issues/3488)

**Merged pull requests:**

- Update dependency @types/node to v12.7.3 [\#4021](https://github.com/VSCodeVim/Vim/pull/4021) ([renovate[bot]](https://github.com/apps/renovate))
- Make ReplaceWithRegister work in visual mode [\#4016](https://github.com/VSCodeVim/Vim/pull/4016) ([stevenguh](https://github.com/stevenguh))
- :w write in background [\#4013](https://github.com/VSCodeVim/Vim/pull/4013) ([stevenguh](https://github.com/stevenguh))
- Update dependency typescript to v3.6.2 [\#4010](https://github.com/VSCodeVim/Vim/pull/4010) ([renovate[bot]](https://github.com/apps/renovate))

## [v1.10.0](https://github.com/vscodevim/vim/tree/v1.10.0) (2019-08-28)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.9.0...v1.10.0)

**Enhancements:**

- \<C-b\> and \<C-e\> should be equivalent to \<Home\> and \<End\> on command line / search bar [\#3995](https://github.com/VSCodeVim/Vim/issues/3995)
- Support `when` for contextual keybindings [\#3994](https://github.com/VSCodeVim/Vim/issues/3994)
- Del should work on command/search line [\#3992](https://github.com/VSCodeVim/Vim/issues/3992)
- Home/End should work on command/search line [\#3991](https://github.com/VSCodeVim/Vim/issues/3991)
- `Ctrl-R` should allow pasting from a register when typing a command, as in insert mode [\#3950](https://github.com/VSCodeVim/Vim/issues/3950)
- Ctrl-P and Ctrl-N should be equivalent to Up / Down when entering a command or search [\#3942](https://github.com/VSCodeVim/Vim/issues/3942)
- Support ignorecase for sort command [\#3939](https://github.com/VSCodeVim/Vim/issues/3939)
- Support search offsets [\#3917](https://github.com/VSCodeVim/Vim/issues/3917)
- Enhancement: sneak one char jump. [\#3907](https://github.com/VSCodeVim/Vim/issues/3907)
- Simple undo command behaviour from vi/vim not implemented [\#3649](https://github.com/VSCodeVim/Vim/issues/3649)

**Fixed Bugs:**

- Variable highlighting not working [\#3982](https://github.com/VSCodeVim/Vim/issues/3982)
- Change side in diff mode [\#3979](https://github.com/VSCodeVim/Vim/issues/3979)
- Annoying brackets autoremoving [\#3936](https://github.com/VSCodeVim/Vim/issues/3936)
- "Search forward" functionality is not case sensitive [\#3764](https://github.com/VSCodeVim/Vim/issues/3764)
- Does not start up with VSCode and no vim commands work [\#3753](https://github.com/VSCodeVim/Vim/issues/3753)

**Closed issues:**

- `/` is not case sensitive [\#3980](https://github.com/VSCodeVim/Vim/issues/3980)
- Will VIM extension be compatible with python interactive window in the next update? [\#3973](https://github.com/VSCodeVim/Vim/issues/3973)
- visual mode block copy/past [\#3971](https://github.com/VSCodeVim/Vim/issues/3971)
- range yank does not work [\#3931](https://github.com/VSCodeVim/Vim/issues/3931)
- Console warning [\#3926](https://github.com/VSCodeVim/Vim/issues/3926)
- :wq does not close window if there are unsaved changes [\#3922](https://github.com/VSCodeVim/Vim/issues/3922)
- make easymotion looks exactly the vim-easymotion way [\#3901](https://github.com/VSCodeVim/Vim/issues/3901)
- bug to record macro [\#3898](https://github.com/VSCodeVim/Vim/issues/3898)
- Faulty link in readme [\#3827](https://github.com/VSCodeVim/Vim/issues/3827)
- Navigation in the explorer pane vim way \(j , k\) doesn't work after window reload [\#3760](https://github.com/VSCodeVim/Vim/issues/3760)
- Easy motion shows error when jumping to brackets and backslash [\#3685](https://github.com/VSCodeVim/Vim/issues/3685)
- I can't continuous movement the cursor ,and copy or delete more line. [\#3634](https://github.com/VSCodeVim/Vim/issues/3634)
- Why don't work command mode? [\#3500](https://github.com/VSCodeVim/Vim/issues/3500)
- Tab completion for `:vnew` and `:tabnew` [\#3479](https://github.com/VSCodeVim/Vim/issues/3479)
- Yank lines in 1 window should be available for pasting in another window [\#3401](https://github.com/VSCodeVim/Vim/issues/3401)

**Merged pull requests:**

- Update dependency @types/lodash to v4.14.138 [\#4003](https://github.com/VSCodeVim/Vim/pull/4003) ([renovate[bot]](https://github.com/apps/renovate))
- Fix typo in README.md [\#4002](https://github.com/VSCodeVim/Vim/pull/4002) ([jedevc](https://github.com/jedevc))
- Implement single char sneak [\#3999](https://github.com/VSCodeVim/Vim/pull/3999) ([JohnnyUrosevic](https://github.com/JohnnyUrosevic))
- fix :wq in remote [\#3998](https://github.com/VSCodeVim/Vim/pull/3998) ([stevenguh](https://github.com/stevenguh))
- Update dependency tslint to v5.19.0 [\#3987](https://github.com/VSCodeVim/Vim/pull/3987) ([renovate[bot]](https://github.com/apps/renovate))
- Fix console warning [\#3985](https://github.com/VSCodeVim/Vim/pull/3985) ([huww98](https://github.com/huww98))
- Fix duplicated command added in c542b42 [\#3984](https://github.com/VSCodeVim/Vim/pull/3984) ([huww98](https://github.com/huww98))
- Update dependency @types/lodash to v4.14.137 [\#3983](https://github.com/VSCodeVim/Vim/pull/3983) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency @types/node to v12.7.2 [\#3981](https://github.com/VSCodeVim/Vim/pull/3981) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency @types/node to v12.7.1 [\#3967](https://github.com/VSCodeVim/Vim/pull/3967) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency @types/node to v12.7.0 [\#3964](https://github.com/VSCodeVim/Vim/pull/3964) ([renovate[bot]](https://github.com/apps/renovate))
- Disallow all forms of :help [\#3962](https://github.com/VSCodeVim/Vim/pull/3962) ([J-Fields](https://github.com/J-Fields))
- Be clear in package.json that vim.statusBarColorControl reduces performance [\#3961](https://github.com/VSCodeVim/Vim/pull/3961) ([J-Fields](https://github.com/J-Fields))
- Update dependency sinon to v7.4.1 [\#3958](https://github.com/VSCodeVim/Vim/pull/3958) ([renovate[bot]](https://github.com/apps/renovate))
- Implement `q/` and `q?` [\#3956](https://github.com/VSCodeVim/Vim/pull/3956) ([J-Fields](https://github.com/J-Fields))
- When the `c` \(confirm\) flag is used in a `:s` command, don't use neovim [\#3955](https://github.com/VSCodeVim/Vim/pull/3955) ([J-Fields](https://github.com/J-Fields))
- `\<C-f\>` shows command history when pressed on command line [\#3954](https://github.com/VSCodeVim/Vim/pull/3954) ([J-Fields](https://github.com/J-Fields))
- Fix `gC` in visual mode [\#3948](https://github.com/VSCodeVim/Vim/pull/3948) ([J-Fields](https://github.com/J-Fields))
- Roll back dependency sinon to 7.3.2 [\#3947](https://github.com/VSCodeVim/Vim/pull/3947) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency sinon to v7.4.0 [\#3944](https://github.com/VSCodeVim/Vim/pull/3944) ([renovate[bot]](https://github.com/apps/renovate))
- Allow \<C-p\> and \<C-n\> to be used as prev/next when entering a command or search [\#3943](https://github.com/VSCodeVim/Vim/pull/3943) ([J-Fields](https://github.com/J-Fields))
- Respect `editor.autoClosingBrackets` and `editor.autoClosingQuotes` when deleting a bracket/quote [\#3941](https://github.com/VSCodeVim/Vim/pull/3941) ([J-Fields](https://github.com/J-Fields))
- added option to ignore case when sorting [\#3938](https://github.com/VSCodeVim/Vim/pull/3938) ([noslaver](https://github.com/noslaver))
- Update dependency @types/node to v12.6.9 [\#3937](https://github.com/VSCodeVim/Vim/pull/3937) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency vscode to v1.1.36 [\#3933](https://github.com/VSCodeVim/Vim/pull/3933) ([renovate[bot]](https://github.com/apps/renovate))
- Implement search offsets [\#3918](https://github.com/VSCodeVim/Vim/pull/3918) ([J-Fields](https://github.com/J-Fields))

## [v1.9.0](https://github.com/vscodevim/vim/tree/v1.9.0) (2019-07-29)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.8.2...v1.9.0)

**Enhancements:**

- Support ampersand \("&"\) action in normal mode [\#3808](https://github.com/VSCodeVim/Vim/issues/3808)

**Fixed Bugs:**

- At beginning of line with all spaces, backspace causes error [\#3915](https://github.com/VSCodeVim/Vim/issues/3915)
- Go to Line Using \[line\]+gg Throws Exception [\#3845](https://github.com/VSCodeVim/Vim/issues/3845)
- Easymotion uses RegExp [\#3844](https://github.com/VSCodeVim/Vim/issues/3844)
- `%` doesn't ignore unmatched `\>` [\#3807](https://github.com/VSCodeVim/Vim/issues/3807)
- Regression: full path to nvim is now required [\#3754](https://github.com/VSCodeVim/Vim/issues/3754)

**Closed issues:**

- Mapping s in Visual Mode causes strange mistake [\#3788](https://github.com/VSCodeVim/Vim/issues/3788)

**Merged pull requests:**

- Make `C` work with registers [\#3927](https://github.com/VSCodeVim/Vim/pull/3927) ([J-Fields](https://github.com/J-Fields))
- Implement ampersand \(&\) action [\#3925](https://github.com/VSCodeVim/Vim/pull/3925) ([J-Fields](https://github.com/J-Fields))
- Move prettier configuration to .prettierrc [\#3921](https://github.com/VSCodeVim/Vim/pull/3921) ([kizza](https://github.com/kizza))
- Handle backspace on first character of all-space line correctly [\#3916](https://github.com/VSCodeVim/Vim/pull/3916) ([J-Fields](https://github.com/J-Fields))
- Fix f/F/t/T with \<tab\> [\#3914](https://github.com/VSCodeVim/Vim/pull/3914) ([J-Fields](https://github.com/J-Fields))
- Make `%` skip over characters such as '\>' [\#3913](https://github.com/VSCodeVim/Vim/pull/3913) ([J-Fields](https://github.com/J-Fields))
- Do not treat easymotion input as regex unless it's a letter [\#3911](https://github.com/VSCodeVim/Vim/pull/3911) ([J-Fields](https://github.com/J-Fields))
- fix\(deps\): update dependency lodash to v4.17.15 [\#3906](https://github.com/VSCodeVim/Vim/pull/3906) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency mocha to v6.2.0 [\#3905](https://github.com/VSCodeVim/Vim/pull/3905) ([renovate[bot]](https://github.com/apps/renovate))
- Fixes \#3754. Don't require full path to neovim [\#3903](https://github.com/VSCodeVim/Vim/pull/3903) ([notskm](https://github.com/notskm))
- chore\(deps\): update dependency @types/node to v12.6.8 [\#3902](https://github.com/VSCodeVim/Vim/pull/3902) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency @types/node to v12.6.6 [\#3897](https://github.com/VSCodeVim/Vim/pull/3897) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency @types/node to v12.6.4 [\#3896](https://github.com/VSCodeVim/Vim/pull/3896) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency @types/node to v12.6.3 [\#3893](https://github.com/VSCodeVim/Vim/pull/3893) ([renovate[bot]](https://github.com/apps/renovate))
- Add ReplaceWithRegister plugin [\#3887](https://github.com/VSCodeVim/Vim/pull/3887) ([kizza](https://github.com/kizza))

## [v1.8.2](https://github.com/vscodevim/vim/tree/v1.8.2) (2019-07-15)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.8.1...v1.8.2)

**Fixed Bugs:**

- GoToDefinition make invalid history when use C\# extension [\#3865](https://github.com/VSCodeVim/Vim/issues/3865)
- Invisible "WORD" in roadmap [\#3823](https://github.com/VSCodeVim/Vim/issues/3823)

**Closed issues:**

- Identifier highlights do not appear with keyboard movement [\#3885](https://github.com/VSCodeVim/Vim/issues/3885)
- Cursor width when indent using tabs [\#3856](https://github.com/VSCodeVim/Vim/issues/3856)
- cw without yank [\#3836](https://github.com/VSCodeVim/Vim/issues/3836)
- Frozen in 'Activating Extensions' [\#3826](https://github.com/VSCodeVim/Vim/issues/3826)
- How can we make a normal-mode shift-enter mapping? [\#3814](https://github.com/VSCodeVim/Vim/issues/3814)
- Input response is too slow after updating vsc to the latest version\(1.34.0\) [\#3810](https://github.com/VSCodeVim/Vim/issues/3810)
- Yank + motion only working partially [\#3794](https://github.com/VSCodeVim/Vim/issues/3794)
- vim mode does not work after upgrading to 1.8.1 [\#3791](https://github.com/VSCodeVim/Vim/issues/3791)
- Save File Using leader leader [\#3790](https://github.com/VSCodeVim/Vim/issues/3790)
- space + tab transforme to solo tab [\#3789](https://github.com/VSCodeVim/Vim/issues/3789)
- Unable to replace single quotes surrounding string with double quotes like I can in Vim [\#3657](https://github.com/VSCodeVim/Vim/issues/3657)
- cannot bind "," [\#3565](https://github.com/VSCodeVim/Vim/issues/3565)

**Merged pull requests:**

- fix\(deps\): update dependency lodash to v4.17.14 [\#3884](https://github.com/VSCodeVim/Vim/pull/3884) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency @types/node to v12.6.2 [\#3882](https://github.com/VSCodeVim/Vim/pull/3882) ([renovate[bot]](https://github.com/apps/renovate))
- fix\(deps\): update dependency lodash to v4.17.13 [\#3881](https://github.com/VSCodeVim/Vim/pull/3881) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency typescript to v3.5.3 [\#3878](https://github.com/VSCodeVim/Vim/pull/3878) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency @types/lodash to v4.14.136 [\#3877](https://github.com/VSCodeVim/Vim/pull/3877) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency @types/node to v12.6.1 [\#3876](https://github.com/VSCodeVim/Vim/pull/3876) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency tslint to v5.18.0 [\#3874](https://github.com/VSCodeVim/Vim/pull/3874) ([renovate[bot]](https://github.com/apps/renovate))
- fix: fix build break [\#3873](https://github.com/VSCodeVim/Vim/pull/3873) ([jpoon](https://github.com/jpoon))
- chore: fix URL for input method setting [\#3870](https://github.com/VSCodeVim/Vim/pull/3870) ([AndersDJohnson](https://github.com/AndersDJohnson))
- Assign activeTextEditor to local variable first. [\#3866](https://github.com/VSCodeVim/Vim/pull/3866) ([yaegaki](https://github.com/yaegaki))
- Update dependency @types/node to v12.0.12 [\#3862](https://github.com/VSCodeVim/Vim/pull/3862) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency @types/node to v12.0.11 [\#3861](https://github.com/VSCodeVim/Vim/pull/3861) ([renovate[bot]](https://github.com/apps/renovate))
- fix log message for 'vim.debug.silent' [\#3859](https://github.com/VSCodeVim/Vim/pull/3859) ([stfnwp](https://github.com/stfnwp))
- Update dependency @types/node to v12.0.10 [\#3858](https://github.com/VSCodeVim/Vim/pull/3858) ([renovate-bot](https://github.com/renovate-bot))
- Fix build per microsoft/vscode\#75873 [\#3857](https://github.com/VSCodeVim/Vim/pull/3857) ([octref](https://github.com/octref))
- Update dependency vscode to v1.1.35 [\#3855](https://github.com/VSCodeVim/Vim/pull/3855) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency @types/lodash to v4.14.135 [\#3854](https://github.com/VSCodeVim/Vim/pull/3854) ([renovate[bot]](https://github.com/apps/renovate))
- pull request to fix the issue \#3845 [\#3853](https://github.com/VSCodeVim/Vim/pull/3853) ([zhuzisheng](https://github.com/zhuzisheng))
- upgrade pkgs [\#3843](https://github.com/VSCodeVim/Vim/pull/3843) ([jpoon](https://github.com/jpoon))
- Fix broken links in README.md [\#3842](https://github.com/VSCodeVim/Vim/pull/3842) ([aquova](https://github.com/aquova))
- Update dependency typescript to v3.5.2 [\#3834](https://github.com/VSCodeVim/Vim/pull/3834) ([renovate[bot]](https://github.com/apps/renovate))
- Fix WORD wrapped in pipes [\#3829](https://github.com/VSCodeVim/Vim/pull/3829) ([scebotari66](https://github.com/scebotari66))
- Update dependency prettier to v1.18.2 [\#3819](https://github.com/VSCodeVim/Vim/pull/3819) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency prettier to v1.18.0 [\#3818](https://github.com/VSCodeVim/Vim/pull/3818) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency @types/lodash to v4.14.134 [\#3817](https://github.com/VSCodeVim/Vim/pull/3817) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency @types/lodash to v4.14.133 [\#3802](https://github.com/VSCodeVim/Vim/pull/3802) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency tslint to v5.17.0 [\#3801](https://github.com/VSCodeVim/Vim/pull/3801) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency @types/mocha to v5.2.7 [\#3800](https://github.com/VSCodeVim/Vim/pull/3800) ([renovate[bot]](https://github.com/apps/renovate))
- Consolidate documentation for visual modes [\#3799](https://github.com/VSCodeVim/Vim/pull/3799) ([max-sixty](https://github.com/max-sixty))
- Update dependency typescript to v3.5.1 [\#3798](https://github.com/VSCodeVim/Vim/pull/3798) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency @types/sinon to v7.0.12 [\#3795](https://github.com/VSCodeVim/Vim/pull/3795) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency @types/lodash to v4.14.132 [\#3792](https://github.com/VSCodeVim/Vim/pull/3792) ([renovate[bot]](https://github.com/apps/renovate))

## [v1.8.1](https://github.com/vscodevim/vim/tree/v1.8.1) (2019-05-22)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.8.0...v1.8.1)

**Fixed Bugs:**

- Vim extension UI "blocks" on remote development save [\#3777](https://github.com/VSCodeVim/Vim/issues/3777)
- Cancelling a search should not undo :noh [\#3748](https://github.com/VSCodeVim/Vim/issues/3748)
- \<C-c\> and \<C-\[\> don't cancel search [\#3668](https://github.com/VSCodeVim/Vim/issues/3668)
- \<C-u\>/\<C-b\> don't move cursor if the first line is visible [\#3648](https://github.com/VSCodeVim/Vim/issues/3648)
- vim.statusBarColors.normal reports type error [\#3607](https://github.com/VSCodeVim/Vim/issues/3607)

**Closed issues:**

- Copy inside of words after typing ci" [\#3758](https://github.com/VSCodeVim/Vim/issues/3758)

**Merged pull requests:**

- Update dependency @types/lodash to v4.14.130 [\#3784](https://github.com/VSCodeVim/Vim/pull/3784) ([renovate[bot]](https://github.com/apps/renovate))
- Update ROADMAP.ZH.md [\#3782](https://github.com/VSCodeVim/Vim/pull/3782) ([sxlwar](https://github.com/sxlwar))
- Make the write command non-blocking on remote files [\#3778](https://github.com/VSCodeVim/Vim/pull/3778) ([suo](https://github.com/suo))
- Fix MoveHalfPageUp \(\<C-u\>\) when first line is visible. [\#3776](https://github.com/VSCodeVim/Vim/pull/3776) ([faldah](https://github.com/faldah))
- Update dependency @types/lodash to v4.14.129 [\#3771](https://github.com/VSCodeVim/Vim/pull/3771) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency @types/lodash to v4.14.127 [\#3770](https://github.com/VSCodeVim/Vim/pull/3770) ([renovate[bot]](https://github.com/apps/renovate))
- Fix statusBarColors linting in vscode user settings. [\#3767](https://github.com/VSCodeVim/Vim/pull/3767) ([faldah](https://github.com/faldah))
- Update dependency prettier to v1.17.1 [\#3765](https://github.com/VSCodeVim/Vim/pull/3765) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency @types/lodash to v4.14.126 [\#3755](https://github.com/VSCodeVim/Vim/pull/3755) ([renovate[bot]](https://github.com/apps/renovate))
- Make sure :noh disables hlsearch until the next search is done [\#3749](https://github.com/VSCodeVim/Vim/pull/3749) ([J-Fields](https://github.com/J-Fields))

## [v1.8.0](https://github.com/vscodevim/vim/tree/v1.8.0) (2019-05-10)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.7.1...v1.8.0)

**Enhancements:**

- :reg should show multiple registers if given multiple arguments [\#3610](https://github.com/VSCodeVim/Vim/issues/3610)
- :reg should not show the \_ \(black hole\) register [\#3606](https://github.com/VSCodeVim/Vim/issues/3606)
- Implement the % \(file name\) and : \(last executed command\) registers [\#3605](https://github.com/VSCodeVim/Vim/issues/3605)
- The . \(last inserted text\) register should be read-only [\#3604](https://github.com/VSCodeVim/Vim/issues/3604)

**Fixed Bugs:**

- Backspace in command line mode should return to normal mode if the command is empty [\#3729](https://github.com/VSCodeVim/Vim/issues/3729)

**Closed issues:**

- Tab to spaces setting in vscode not applying when extension is enabled [\#3732](https://github.com/VSCodeVim/Vim/issues/3732)
- %d/string/d" does not work [\#3709](https://github.com/VSCodeVim/Vim/issues/3709)
- Extension issue [\#3615](https://github.com/VSCodeVim/Vim/issues/3615)
- Support the / register [\#3542](https://github.com/VSCodeVim/Vim/issues/3542)

**Merged pull requests:**

- Show search results in the overview ruler [\#3750](https://github.com/VSCodeVim/Vim/pull/3750) ([J-Fields](https://github.com/J-Fields))
- Update dependency @types/lodash to v4.14.125 [\#3747](https://github.com/VSCodeVim/Vim/pull/3747) ([renovate[bot]](https://github.com/apps/renovate))
- \<C-\[\> and \<C-c\> should terminate search mode [\#3746](https://github.com/VSCodeVim/Vim/pull/3746) ([hkleynhans](https://github.com/hkleynhans))
- Update dependency vscode to v1.1.34 [\#3739](https://github.com/VSCodeVim/Vim/pull/3739) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency gulp to v4.0.2 [\#3738](https://github.com/VSCodeVim/Vim/pull/3738) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency @types/lodash to v4.14.124 [\#3737](https://github.com/VSCodeVim/Vim/pull/3737) ([renovate[bot]](https://github.com/apps/renovate))
- Fix replace character \(`r`\) behavior with newline [\#3735](https://github.com/VSCodeVim/Vim/pull/3735) ([J-Fields](https://github.com/J-Fields))
- Show `match {x} of {y}` in the status bar when searching [\#3734](https://github.com/VSCodeVim/Vim/pull/3734) ([J-Fields](https://github.com/J-Fields))
- Keymapping bindings inconsistently cased \#3012 [\#3731](https://github.com/VSCodeVim/Vim/pull/3731) ([ObliviousJamie](https://github.com/ObliviousJamie))
- Return to normal mode after hitting \<BS\> on empty command line [\#3730](https://github.com/VSCodeVim/Vim/pull/3730) ([J-Fields](https://github.com/J-Fields))
- Various improvements to registers [\#3728](https://github.com/VSCodeVim/Vim/pull/3728) ([J-Fields](https://github.com/J-Fields))
- Add tab completion on vim command line [\#3639](https://github.com/VSCodeVim/Vim/pull/3639) ([keith-ferney](https://github.com/keith-ferney))

## [v1.7.1](https://github.com/vscodevim/vim/tree/v1.7.1) (2019-05-05)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.7.0...v1.7.1)

**Enhancements:**

- Set extensionKind in package.json to support Remote Development [\#3720](https://github.com/VSCodeVim/Vim/issues/3720)
- gf doesn't work with filepath:linenumber format [\#3710](https://github.com/VSCodeVim/Vim/issues/3710)
- Hive ctrl+G show which file is editing been supported? [\#3700](https://github.com/VSCodeVim/Vim/issues/3700)

**Fixed Bugs:**

- Replace \(:%s\) confirm text is wrong [\#3715](https://github.com/VSCodeVim/Vim/issues/3715)

**Merged pull requests:**

- Update dependency untildify to v4 [\#3725](https://github.com/VSCodeVim/Vim/pull/3725) ([renovate[bot]](https://github.com/apps/renovate))
- Add searches from \* and \# to the search history [\#3724](https://github.com/VSCodeVim/Vim/pull/3724) ([J-Fields](https://github.com/J-Fields))
- Implement Ctrl+G and :file [\#3723](https://github.com/VSCodeVim/Vim/pull/3723) ([J-Fields](https://github.com/J-Fields))
- Correct replacement confirmation text [\#3722](https://github.com/VSCodeVim/Vim/pull/3722) ([J-Fields](https://github.com/J-Fields))
- Set "extensionKind": "ui" to support remote development [\#3721](https://github.com/VSCodeVim/Vim/pull/3721) ([mjbvz](https://github.com/mjbvz))

## [v1.7.0](https://github.com/vscodevim/vim/tree/v1.7.0) (2019-04-30)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.4.0...v1.7.0)

**Fixed Bugs:**

- vim.debug.suppress invalid [\#3703](https://github.com/VSCodeVim/Vim/issues/3703)
- cw, dw, vw doesn't work with non-ascii char earlier in line [\#3680](https://github.com/VSCodeVim/Vim/issues/3680)
- Word seperate doesn't works well [\#3665](https://github.com/VSCodeVim/Vim/issues/3665)
- catastrophic performance [\#3654](https://github.com/VSCodeVim/Vim/issues/3654)

**Closed issues:**

- Ctrl keys can not be remapped in insert mode [\#3697](https://github.com/VSCodeVim/Vim/issues/3697)
- Surround: Implement whitespace configuration [\#3681](https://github.com/VSCodeVim/Vim/issues/3681)
- :\[line number\]d causes type error [\#3678](https://github.com/VSCodeVim/Vim/issues/3678)
- How to fit VIM search on IDE footer with long git branch name? [\#3652](https://github.com/VSCodeVim/Vim/issues/3652)
- cannot open or close directories with L key in file navigation [\#3576](https://github.com/VSCodeVim/Vim/issues/3576)
- VsCodeVim makes workbench.tree.indent not effective [\#3561](https://github.com/VSCodeVim/Vim/issues/3561)
- Ex command 'copy' throws "failed to handle key=.undefined" error [\#3505](https://github.com/VSCodeVim/Vim/issues/3505)
- All mappings in Visual mode do not work when you just enter Visual mod by pressing v [\#3503](https://github.com/VSCodeVim/Vim/issues/3503)

**Merged pull requests:**

- Fix reverse selecting in normal mode. [\#3712](https://github.com/VSCodeVim/Vim/pull/3712) ([kroton](https://github.com/kroton))
- chore\(deps\): update dependency typescript to v3.4.5 [\#3701](https://github.com/VSCodeVim/Vim/pull/3701) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency gulp to v4.0.1 [\#3698](https://github.com/VSCodeVim/Vim/pull/3698) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency typescript to v3.4.4 [\#3690](https://github.com/VSCodeVim/Vim/pull/3690) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency mocha to v6.1.4 [\#3689](https://github.com/VSCodeVim/Vim/pull/3689) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency sinon to v7.3.2 [\#3686](https://github.com/VSCodeVim/Vim/pull/3686) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency tslint to v5.16.0 [\#3683](https://github.com/VSCodeVim/Vim/pull/3683) ([renovate[bot]](https://github.com/apps/renovate))
- docs: update slackin link [\#3679](https://github.com/VSCodeVim/Vim/pull/3679) ([khoitd1997](https://github.com/khoitd1997))
- Update dependency typescript to v3.4.3 [\#3677](https://github.com/VSCodeVim/Vim/pull/3677) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency prettier to v1.17.0 [\#3676](https://github.com/VSCodeVim/Vim/pull/3676) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency mocha to v6.1.3 [\#3675](https://github.com/VSCodeVim/Vim/pull/3675) ([renovate[bot]](https://github.com/apps/renovate))
- Add note about unsupported motions [\#3670](https://github.com/VSCodeVim/Vim/pull/3670) ([karlhorky](https://github.com/karlhorky))
- Fix word separation [\#3667](https://github.com/VSCodeVim/Vim/pull/3667) ([ajalab](https://github.com/ajalab))
- Update dependency typescript to v3.4.2 [\#3664](https://github.com/VSCodeVim/Vim/pull/3664) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency mocha to v6.1.2 [\#3663](https://github.com/VSCodeVim/Vim/pull/3663) ([renovate[bot]](https://github.com/apps/renovate))
- Fixes \#2754. Ctrl+d/u pull cursor along when screen moves past cursor [\#3658](https://github.com/VSCodeVim/Vim/pull/3658) ([mayhewluke](https://github.com/mayhewluke))
- Implement \<C-w\> s [\#3563](https://github.com/VSCodeVim/Vim/pull/3563) ([aminroosta](https://github.com/aminroosta))

## [v1.4.0](https://github.com/vscodevim/vim/tree/v1.4.0) (2019-04-08)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.3.0...v1.4.0)

**Fixed Bugs:**

- Performance degradation of word motions in v1.3.0 [\#3660](https://github.com/VSCodeVim/Vim/issues/3660)

**Closed issues:**

- Adding vim style 'Go to Symbol in Workspace' shortcut [\#3624](https://github.com/VSCodeVim/Vim/issues/3624)

**Merged pull requests:**

- Improve performance of word motions [\#3662](https://github.com/VSCodeVim/Vim/pull/3662) ([ajalab](https://github.com/ajalab))
- Update dependency tslint to v5.15.0 [\#3647](https://github.com/VSCodeVim/Vim/pull/3647) ([renovate[bot]](https://github.com/apps/renovate))
- Update dependency @types/mocha to v5.2.6 [\#3646](https://github.com/VSCodeVim/Vim/pull/3646) ([renovate[bot]](https://github.com/apps/renovate))
- Document display line movement best practices [\#3623](https://github.com/VSCodeVim/Vim/pull/3623) ([karlhorky](https://github.com/karlhorky))
- Only use regex lookbehind where supported [\#3525](https://github.com/VSCodeVim/Vim/pull/3525) ([JKillian](https://github.com/JKillian))

## [v1.3.0](https://github.com/vscodevim/vim/tree/v1.3.0) (2019-04-02)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.2.0...v1.3.0)

**Enhancements:**

- Better non-ASCII character support in word motions [\#3612](https://github.com/VSCodeVim/Vim/issues/3612)

**Fixed Bugs:**

- Preview file from explorer is not tracked as jump [\#3507](https://github.com/VSCodeVim/Vim/issues/3507)
- ‘W’ and 'w' shortcut keys do not support Chinese characters！ [\#3439](https://github.com/VSCodeVim/Vim/issues/3439)

**Closed issues:**

- emmet with vscode vim [\#3644](https://github.com/VSCodeVim/Vim/issues/3644)
- How do I insert a linebreak where the cursor is without entering into insert mode in VSCodeVim? [\#3636](https://github.com/VSCodeVim/Vim/issues/3636)
- Hitting backspace with an empty search should return to normal mode [\#3619](https://github.com/VSCodeVim/Vim/issues/3619)
- Search state should not change until a new search command is completed [\#3616](https://github.com/VSCodeVim/Vim/issues/3616)
- Jumping to a mark that is off-screen should center the view around the mark [\#3609](https://github.com/VSCodeVim/Vim/issues/3609)
- The original vim's redo command \(Ctrl+Shift+R\) doesn't work [\#3608](https://github.com/VSCodeVim/Vim/issues/3608)
- vim-surround does not work with multiple cursors [\#3600](https://github.com/VSCodeVim/Vim/issues/3600)
- digraphs cannot be inputted in different order [\#3599](https://github.com/VSCodeVim/Vim/issues/3599)
- gU/gu does not work in visual mode [\#3491](https://github.com/VSCodeVim/Vim/issues/3491)
- Error when executing 'View Latex PDF'-command from latex-workshop-plugin [\#3484](https://github.com/VSCodeVim/Vim/issues/3484)

**Merged pull requests:**

- chore\(deps\): update dependency vscode to v1.1.33 [\#3643](https://github.com/VSCodeVim/Vim/pull/3643) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency typescript to v3.4.1 [\#3642](https://github.com/VSCodeVim/Vim/pull/3642) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency @types/sinon to v7.0.11 [\#3641](https://github.com/VSCodeVim/Vim/pull/3641) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency @types/diff to v4.0.2 [\#3640](https://github.com/VSCodeVim/Vim/pull/3640) ([renovate[bot]](https://github.com/apps/renovate))
- Digraphs: Allow input in reverse order \(fixes \#3599\) [\#3635](https://github.com/VSCodeVim/Vim/pull/3635) ([jbaiter](https://github.com/jbaiter))
- Assign lastClosedModeHandler when onDidCloseTextDocument. [\#3630](https://github.com/VSCodeVim/Vim/pull/3630) ([yaegaki](https://github.com/yaegaki))
- When backspace is hit on an empty search, cancel the search [\#3626](https://github.com/VSCodeVim/Vim/pull/3626) ([J-Fields](https://github.com/J-Fields))
- Mark several features that have been implemented as complete in ROADMAP.md [\#3620](https://github.com/VSCodeVim/Vim/pull/3620) ([J-Fields](https://github.com/J-Fields))
- When a search is cancelled, revert to previous search state [\#3617](https://github.com/VSCodeVim/Vim/pull/3617) ([J-Fields](https://github.com/J-Fields))
- Support word motions for non-ASCII characters [\#3614](https://github.com/VSCodeVim/Vim/pull/3614) ([ajalab](https://github.com/ajalab))
- Support for gU and gu in visual mode [\#3603](https://github.com/VSCodeVim/Vim/pull/3603) ([J-Fields](https://github.com/J-Fields))
- Chinese translation of ROADMAP.MD [\#3597](https://github.com/VSCodeVim/Vim/pull/3597) ([sxlwar](https://github.com/sxlwar))
- fix\(deps\): update dependency neovim to v4.5.0 [\#3555](https://github.com/VSCodeVim/Vim/pull/3555) ([renovate[bot]](https://github.com/apps/renovate))

## [v1.2.0](https://github.com/vscodevim/vim/tree/v1.2.0) (2019-03-17)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.1.0...v1.2.0)

**Enhancements:**

- The small delete register "- doesn't work [\#3492](https://github.com/VSCodeVim/Vim/issues/3492)

**Closed issues:**

- Extension causes high cpu load [\#3587](https://github.com/VSCodeVim/Vim/issues/3587)
- Custom keybind breaks search [\#3558](https://github.com/VSCodeVim/Vim/issues/3558)
- vim-auto-save [\#3550](https://github.com/VSCodeVim/Vim/issues/3550)
- Extension causes high cpu load [\#3546](https://github.com/VSCodeVim/Vim/issues/3546)
- Extension causes high cpu load [\#3533](https://github.com/VSCodeVim/Vim/issues/3533)
- The extension don't work with Java Extension Pack [\#3526](https://github.com/VSCodeVim/Vim/issues/3526)
- command 'toggleVim' not found. [\#3524](https://github.com/VSCodeVim/Vim/issues/3524)
- Error when upgraded to 1.1.0 [\#3521](https://github.com/VSCodeVim/Vim/issues/3521)
- TaskQueue: Error running task. Invalid regular expression: [\#3519](https://github.com/VSCodeVim/Vim/issues/3519)
- Chinese i18n support? [\#3497](https://github.com/VSCodeVim/Vim/issues/3497)

**Merged pull requests:**

- Add yank highlighting \(REBASED\) [\#3593](https://github.com/VSCodeVim/Vim/pull/3593) ([epeli](https://github.com/epeli))
- chore\(deps\): update dependency tslint to v5.14.0 [\#3586](https://github.com/VSCodeVim/Vim/pull/3586) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency gulp-typescript to v5.0.1 [\#3585](https://github.com/VSCodeVim/Vim/pull/3585) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency @types/sinon to v7.0.10 [\#3583](https://github.com/VSCodeVim/Vim/pull/3583) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency @types/lodash to v4.14.123 [\#3582](https://github.com/VSCodeVim/Vim/pull/3582) ([renovate[bot]](https://github.com/apps/renovate))
- Fix TOC [\#3574](https://github.com/VSCodeVim/Vim/pull/3574) ([mtsmfm](https://github.com/mtsmfm))
- chore\(deps\): update dependency @types/sinon to v7.0.9 [\#3568](https://github.com/VSCodeVim/Vim/pull/3568) ([renovate[bot]](https://github.com/apps/renovate))
- Bump minimum VSCode version to 1.31.0 [\#3567](https://github.com/VSCodeVim/Vim/pull/3567) ([JKillian](https://github.com/JKillian))
- docs: remove outdated notes on splits from roadmap [\#3564](https://github.com/VSCodeVim/Vim/pull/3564) ([JKillian](https://github.com/JKillian))
- chore\(deps\): update dependency @types/lodash to v4.14.122 [\#3557](https://github.com/VSCodeVim/Vim/pull/3557) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency sinon to v7.2.7 [\#3554](https://github.com/VSCodeVim/Vim/pull/3554) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency sinon to v7.2.6 [\#3552](https://github.com/VSCodeVim/Vim/pull/3552) ([renovate[bot]](https://github.com/apps/renovate))
- Add small deletions to small delete register [\#3544](https://github.com/VSCodeVim/Vim/pull/3544) ([rickythefox](https://github.com/rickythefox))
- chore\(deps\): update dependency tslint to v5.13.1 [\#3541](https://github.com/VSCodeVim/Vim/pull/3541) ([renovate[bot]](https://github.com/apps/renovate))
- Mod:change sneak sneakUseIgnorecaseAndSmartcase default value explana… [\#3540](https://github.com/VSCodeVim/Vim/pull/3540) ([duguanyue](https://github.com/duguanyue))
- Fix links in README [\#3534](https://github.com/VSCodeVim/Vim/pull/3534) ([yorinasub17](https://github.com/yorinasub17))
- chore\(deps\): update dependency mocha to v6.0.2 [\#3529](https://github.com/VSCodeVim/Vim/pull/3529) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency @types/sinon to v7.0.8 [\#3528](https://github.com/VSCodeVim/Vim/pull/3528) ([renovate[bot]](https://github.com/apps/renovate))

## [v1.1.0](https://github.com/vscodevim/vim/tree/v1.1.0) (2019-02-24)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.0.8...v1.1.0)

**Fixed Bugs:**

- vim.searchHighlightColor does not work [\#3489](https://github.com/VSCodeVim/Vim/issues/3489)
- Error when jumping to undefined mark [\#3468](https://github.com/VSCodeVim/Vim/issues/3468)

**Closed issues:**

- \[Feature request\]: Add the ability to copy the current query into clipboard. [\#3493](https://github.com/VSCodeVim/Vim/issues/3493)
- Not working on vscode 1.31.0 [\#3473](https://github.com/VSCodeVim/Vim/issues/3473)
- Extension causes high cpu load [\#3471](https://github.com/VSCodeVim/Vim/issues/3471)
- Error when using the `\> motion [\#3452](https://github.com/VSCodeVim/Vim/issues/3452)
- Show mark label like VIM in visual studio [\#3406](https://github.com/VSCodeVim/Vim/issues/3406)

**Merged pull requests:**

- Fixes vim.searchHighlightColor [\#3517](https://github.com/VSCodeVim/Vim/pull/3517) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency tslint to v5.13.0 [\#3516](https://github.com/VSCodeVim/Vim/pull/3516) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency vscode to v1.1.30 [\#3513](https://github.com/VSCodeVim/Vim/pull/3513) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency typescript to v3.3.3333 [\#3512](https://github.com/VSCodeVim/Vim/pull/3512) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency mocha to v6.0.1 [\#3511](https://github.com/VSCodeVim/Vim/pull/3511) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency gulp-tslint to v8.1.4 [\#3510](https://github.com/VSCodeVim/Vim/pull/3510) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency mocha to v6 [\#3499](https://github.com/VSCodeVim/Vim/pull/3499) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency gulp-sourcemaps to v2.6.5 [\#3498](https://github.com/VSCodeVim/Vim/pull/3498) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency @types/node to v10.12.27 [\#3496](https://github.com/VSCodeVim/Vim/pull/3496) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency @types/lodash to v4.14.121 [\#3487](https://github.com/VSCodeVim/Vim/pull/3487) ([renovate[bot]](https://github.com/apps/renovate))
- Add CamelCaseMotion plugin [\#3483](https://github.com/VSCodeVim/Vim/pull/3483) ([JKillian](https://github.com/JKillian))
- chore\(deps\): update dependency @types/node to v9.6.42 [\#3478](https://github.com/VSCodeVim/Vim/pull/3478) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency vscode to v1.1.29 [\#3476](https://github.com/VSCodeVim/Vim/pull/3476) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency typescript to v3.3.3 [\#3475](https://github.com/VSCodeVim/Vim/pull/3475) ([renovate[bot]](https://github.com/apps/renovate))
- Set \< and \> marks when yanking in visual mode. [\#3472](https://github.com/VSCodeVim/Vim/pull/3472) ([rickythefox](https://github.com/rickythefox))
- Fixes \#3468 [\#3469](https://github.com/VSCodeVim/Vim/pull/3469) ([hnefatl](https://github.com/hnefatl))
- chore\(deps\): update dependency prettier to v1.16.4 [\#3465](https://github.com/VSCodeVim/Vim/pull/3465) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency gulp-git to v2.9.0 [\#3464](https://github.com/VSCodeVim/Vim/pull/3464) ([renovate[bot]](https://github.com/apps/renovate))
- Digraph support [\#3407](https://github.com/VSCodeVim/Vim/pull/3407) ([jbaiter](https://github.com/jbaiter))

## [v1.0.8](https://github.com/vscodevim/vim/tree/v1.0.8) (2019-02-07)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.0.7...v1.0.8)

**Fixed Bugs:**

- Cursor jumps after building with CMake [\#3462](https://github.com/VSCodeVim/Vim/issues/3462)
- Illegal Value for Line using any input mode while WallabyJs || Quokka is running [\#3459](https://github.com/VSCodeVim/Vim/issues/3459)
- Cursor jumps up to the beginning of a file after saving. [\#3444](https://github.com/VSCodeVim/Vim/issues/3444)

**Merged pull requests:**

- fix: cursor jumps when selection changes to output window [\#3463](https://github.com/VSCodeVim/Vim/pull/3463) ([jpoon](https://github.com/jpoon))
- feat: configuration validators [\#3451](https://github.com/VSCodeVim/Vim/pull/3451) ([jpoon](https://github.com/jpoon))
- fix: de-dupe cursors [\#3449](https://github.com/VSCodeVim/Vim/pull/3449) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency @types/diff to v4.0.1 [\#3448](https://github.com/VSCodeVim/Vim/pull/3448) ([renovate[bot]](https://github.com/apps/renovate))
- v1.0.7 [\#3447](https://github.com/VSCodeVim/Vim/pull/3447) ([jpoon](https://github.com/jpoon))
- refactor: no need for so many different ways to create a position object [\#3446](https://github.com/VSCodeVim/Vim/pull/3446) ([jpoon](https://github.com/jpoon))

## [v1.0.7](https://github.com/vscodevim/vim/tree/v1.0.7) (2019-02-02)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.0.6...v1.0.7)

**Fixed Bugs:**

- Illegal value for line error using command-mode range deletion [\#3441](https://github.com/VSCodeVim/Vim/issues/3441)
- Extension crash or hangs when failing to call nvim [\#3433](https://github.com/VSCodeVim/Vim/issues/3433)

**Merged pull requests:**

- \[Bugfix\] - sentences backward [\#3445](https://github.com/VSCodeVim/Vim/pull/3445) ([esetnik](https://github.com/esetnik))
- refactor: rename cursorPositionJustBeforeAnythingHappened to cursorsInitialState [\#3443](https://github.com/VSCodeVim/Vim/pull/3443) ([jpoon](https://github.com/jpoon))
- fix: ensure cursor is in bounds. closes \#3441 [\#3442](https://github.com/VSCodeVim/Vim/pull/3442) ([jpoon](https://github.com/jpoon))
- fix: validate that remappings are string arrays [\#3440](https://github.com/VSCodeVim/Vim/pull/3440) ([jpoon](https://github.com/jpoon))
- v1.0.6 [\#3438](https://github.com/VSCodeVim/Vim/pull/3438) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency typescript to v3.3.1 [\#3436](https://github.com/VSCodeVim/Vim/pull/3436) ([renovate[bot]](https://github.com/apps/renovate))
- Adopt latest list navigation support [\#3432](https://github.com/VSCodeVim/Vim/pull/3432) ([joaomoreno](https://github.com/joaomoreno))

## [v1.0.6](https://github.com/vscodevim/vim/tree/v1.0.6) (2019-02-01)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.0.5...v1.0.6)

**Fixed Bugs:**

- Bad interaction between 1.0.5 and jscode-java-pack [\#3431](https://github.com/VSCodeVim/Vim/issues/3431)
- Release 1.0.4 doesn't contain listed changes [\#3429](https://github.com/VSCodeVim/Vim/issues/3429)

**Merged pull requests:**

- fix: check neovim configurations and timeout on nvim attach [\#3437](https://github.com/VSCodeVim/Vim/pull/3437) ([jpoon](https://github.com/jpoon))
- fix: revert back to previous non-async code when syncing cursor [\#3435](https://github.com/VSCodeVim/Vim/pull/3435) ([jpoon](https://github.com/jpoon))
- feat: output commit hash. closes \#3429 [\#3430](https://github.com/VSCodeVim/Vim/pull/3430) ([jpoon](https://github.com/jpoon))

## [v1.0.5](https://github.com/vscodevim/vim/tree/v1.0.5) (2019-01-31)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.0.4...v1.0.5)

**Merged pull requests:**

- chore\(deps\): update dependency prettier to v1.16.3 [\#3428](https://github.com/VSCodeVim/Vim/pull/3428) ([renovate[bot]](https://github.com/apps/renovate))
- v1.0.4 [\#3427](https://github.com/VSCodeVim/Vim/pull/3427) ([jpoon](https://github.com/jpoon))

## [v1.0.4](https://github.com/vscodevim/vim/tree/v1.0.4) (2019-01-31)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.0.3...v1.0.4)

**Fixed Bugs:**

- "Delete surrounding quotes" doesn't work in certain cases [\#3415](https://github.com/VSCodeVim/Vim/issues/3415)
- 'gd' is working correctly, but an error occurs. [\#3387](https://github.com/VSCodeVim/Vim/issues/3387)

**Closed issues:**

- Extension causes high cpu load [\#3400](https://github.com/VSCodeVim/Vim/issues/3400)

**Merged pull requests:**

- fix ds" with nested quotes and add some tests - fixes \#3415 [\#3426](https://github.com/VSCodeVim/Vim/pull/3426) ([esetnik](https://github.com/esetnik))
- chore\(deps\): update dependency @types/diff to v4 [\#3425](https://github.com/VSCodeVim/Vim/pull/3425) ([renovate[bot]](https://github.com/apps/renovate))
- fix: single-key remappings were being ignored [\#3424](https://github.com/VSCodeVim/Vim/pull/3424) ([jpoon](https://github.com/jpoon))
- fix\(deps\): update dependency winston to v3.2.1 [\#3423](https://github.com/VSCodeVim/Vim/pull/3423) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency prettier to v1.16.2 [\#3422](https://github.com/VSCodeVim/Vim/pull/3422) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency @types/sinon to v7.0.5 [\#3421](https://github.com/VSCodeVim/Vim/pull/3421) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency @types/diff to v3.5.3 [\#3420](https://github.com/VSCodeVim/Vim/pull/3420) ([renovate[bot]](https://github.com/apps/renovate))
- fix: validate configurations once, instead of every key press [\#3418](https://github.com/VSCodeVim/Vim/pull/3418) ([jpoon](https://github.com/jpoon))
- Run `closeMarkersNavigation` on ESC. Fix \#3367 [\#3416](https://github.com/VSCodeVim/Vim/pull/3416) ([octref](https://github.com/octref))
- chore\(deps\): update dependency vscode to v1.1.28 [\#3412](https://github.com/VSCodeVim/Vim/pull/3412) ([renovate-bot](https://github.com/renovate-bot))
- refactor: make globalstate singleton class [\#3411](https://github.com/VSCodeVim/Vim/pull/3411) ([jpoon](https://github.com/jpoon))
- Misc async fixes - new revision [\#3410](https://github.com/VSCodeVim/Vim/pull/3410) ([xconverge](https://github.com/xconverge))
- fix: closes \#3157 [\#3409](https://github.com/VSCodeVim/Vim/pull/3409) ([jpoon](https://github.com/jpoon))
- fix \#3157: register single onDidChangeTextDocument handler and delegate to appropriate mode handler [\#3408](https://github.com/VSCodeVim/Vim/pull/3408) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency prettier to v1.16.1 [\#3405](https://github.com/VSCodeVim/Vim/pull/3405) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency vscode to v1.1.27 [\#3403](https://github.com/VSCodeVim/Vim/pull/3403) ([renovate-bot](https://github.com/renovate-bot))
- fix address 'gf' bug. `replace file://` method [\#3402](https://github.com/VSCodeVim/Vim/pull/3402) ([pikulev](https://github.com/pikulev))
- bump version [\#3399](https://github.com/VSCodeVim/Vim/pull/3399) ([jpoon](https://github.com/jpoon))

## [v1.0.3](https://github.com/vscodevim/vim/tree/v1.0.3) (2019-01-20)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.0.2...v1.0.3)

**Merged pull requests:**

- fix rangeerror. action buttons on log messages. [\#3398](https://github.com/VSCodeVim/Vim/pull/3398) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency prettier to v1.16.0 [\#3397](https://github.com/VSCodeVim/Vim/pull/3397) ([renovate-bot](https://github.com/renovate-bot))
- fix: gf over a 'file://...' path and \#3310 issue \(v2\) [\#3396](https://github.com/VSCodeVim/Vim/pull/3396) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency sinon to v7.2.3 [\#3394](https://github.com/VSCodeVim/Vim/pull/3394) ([renovate-bot](https://github.com/renovate-bot))
- fix: 3350 [\#3393](https://github.com/VSCodeVim/Vim/pull/3393) ([jpoon](https://github.com/jpoon))
- docs: change slackin host [\#3392](https://github.com/VSCodeVim/Vim/pull/3392) ([jpoon](https://github.com/jpoon))
- Update dependency @types/lodash to v4.14.120 [\#3385](https://github.com/VSCodeVim/Vim/pull/3385) ([renovate-bot](https://github.com/renovate-bot))
- Update dependency typescript to v3.2.4 [\#3384](https://github.com/VSCodeVim/Vim/pull/3384) ([renovate-bot](https://github.com/renovate-bot))
- Update dependency @types/sinon to v7.0.4 [\#3383](https://github.com/VSCodeVim/Vim/pull/3383) ([renovate-bot](https://github.com/renovate-bot))
- Fixes \#3378 [\#3381](https://github.com/VSCodeVim/Vim/pull/3381) ([xconverge](https://github.com/xconverge))
- fixes \#3374 [\#3380](https://github.com/VSCodeVim/Vim/pull/3380) ([xconverge](https://github.com/xconverge))

## [v1.0.2](https://github.com/vscodevim/vim/tree/v1.0.2) (2019-01-16)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.0.1...v1.0.2)

## [v1.0.1](https://github.com/vscodevim/vim/tree/v1.0.1) (2019-01-06)

[Full Changelog](https://github.com/vscodevim/vim/compare/v1.0.0...v1.0.1)

## [v1.0.0](https://github.com/vscodevim/vim/tree/v1.0.0) (2019-01-05)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.17.3...v1.0.0)

The first commit to this project was a little over 3 years ago, and what a journey it's been. To celebrate the new year, we are pushing out v1.0.0 of VSCodeVim! In addition to this project reaching such an amazing milestone, but in my personal life, I'll soon be celebrating the birth of my first-born. With that in mind, over the last few weeks I've tried to close out as many issues as I could before all my spare time is filled with diapers and bottles. Thanks to amazing team of maintainers, contributors, and users that have brought us to where we are today and where we'll go tomorrow.

**Breaking Change:**

- `vim.debug.loggingLevel` has been removed. In it's place we now have `vim.debug.loggingLevelForConsole`. For full details, see the [settings section of our README](https://github.com/VSCodeVim/Vim#vscodevim-settings).

**Enhancements:**

- feat: change debug configurations to loggingLevelForConsole, loggingLevelForAlert [\#3325](https://github.com/VSCodeVim/Vim/pull/3325) ([jpoon](https://github.com/jpoon))

**Fixed Bugs:**

- Status Bar Color did not changed with the mode [\#3316](https://github.com/VSCodeVim/Vim/issues/3316)
- Error when remapping to commands with name starting with "extension." [\#3307](https://github.com/VSCodeVim/Vim/issues/3307)

**Closed issues:**

- gf: 'try to find it with the same extension'-code doesn't work [\#3309](https://github.com/VSCodeVim/Vim/issues/3309)
- Extension causes high cpu load [\#3289](https://github.com/VSCodeVim/Vim/issues/3289)
- The Vim plugin can not edit except i/a/s [\#3270](https://github.com/VSCodeVim/Vim/issues/3270)
- Keyboard stops working with VSCode when indenting multiline \[MacOS Mojave\] [\#3206](https://github.com/VSCodeVim/Vim/issues/3206)
- ctrl o shortcut not work sometimes [\#3074](https://github.com/VSCodeVim/Vim/issues/3074)

**Merged pull requests:**

- fix: closes \#3316 [\#3321](https://github.com/VSCodeVim/Vim/pull/3321) ([jpoon](https://github.com/jpoon))
- fix: Actually fix \#3295. [\#3320](https://github.com/VSCodeVim/Vim/pull/3320) ([jpoon](https://github.com/jpoon))
- refactor: disableExtension configuration should follow pattern of rest of configs [\#3318](https://github.com/VSCodeVim/Vim/pull/3318) ([jpoon](https://github.com/jpoon))
- feat: show vim errors in vscode informational window [\#3315](https://github.com/VSCodeVim/Vim/pull/3315) ([jpoon](https://github.com/jpoon))
- fix: log warning if remapped command does not exist. closes \#3307 [\#3314](https://github.com/VSCodeVim/Vim/pull/3314) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency @types/sinon to v7.0.3 [\#3313](https://github.com/VSCodeVim/Vim/pull/3313) ([renovate-bot](https://github.com/renovate-bot))
- v0.17.3 [\#3306](https://github.com/VSCodeVim/Vim/pull/3306) ([jpoon](https://github.com/jpoon))

## [v0.17.3](https://github.com/vscodevim/vim/tree/v0.17.3) (2018-12-30)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.17.2...v0.17.3)

**Enhancements:**

- :on is not an editor command [\#3286](https://github.com/VSCodeVim/Vim/issues/3286)
- editor.wordSeparators setting is ignored [\#3166](https://github.com/VSCodeVim/Vim/issues/3166)
- save \(:w or :wq\) with SSHFS and LiveShare guest don't work properly [\#2956](https://github.com/VSCodeVim/Vim/issues/2956)

**Fixed Bugs:**

- \<c-o\> jumps back to wrong location after 'gd' [\#3277](https://github.com/VSCodeVim/Vim/issues/3277)

**Closed issues:**

- Either slash or colon not working [\#3291](https://github.com/VSCodeVim/Vim/issues/3291)
- s and S Key Commands Not Working [\#3274](https://github.com/VSCodeVim/Vim/issues/3274)
- Extension Host is unresponsive [\#3056](https://github.com/VSCodeVim/Vim/issues/3056)
- Vim mode randomly not functional - show warning [\#2725](https://github.com/VSCodeVim/Vim/issues/2725)
- Is hanging. [\#2629](https://github.com/VSCodeVim/Vim/issues/2629)

**Merged pull requests:**

- fix: sync editor.wordSeparators and vim.iskeyword. closes \#3166 [\#3305](https://github.com/VSCodeVim/Vim/pull/3305) ([jpoon](https://github.com/jpoon))
- feat: add on as alias for only [\#3303](https://github.com/VSCodeVim/Vim/pull/3303) ([jpoon](https://github.com/jpoon))
- fix: \#3277 [\#3302](https://github.com/VSCodeVim/Vim/pull/3302) ([jpoon](https://github.com/jpoon))
- fix saving remote file error [\#3281](https://github.com/VSCodeVim/Vim/pull/3281) ([zhuzisheng](https://github.com/zhuzisheng))

## [v0.17.2](https://github.com/vscodevim/vim/tree/v0.17.2) (2018-12-28)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.17.1...v0.17.2)

**Fixed Bugs:**

- v0.17.1 prints `\<tab\>` string for every tab keystroke [\#3298](https://github.com/VSCodeVim/Vim/issues/3298)

**Merged pull requests:**

- fix: v0.17.1 regression [\#3299](https://github.com/VSCodeVim/Vim/pull/3299) ([jpoon](https://github.com/jpoon))
- v0.17.0-\>v0.17.1 [\#3297](https://github.com/VSCodeVim/Vim/pull/3297) ([jpoon](https://github.com/jpoon))

## [v0.17.1](https://github.com/vscodevim/vim/tree/v0.17.1) (2018-12-28)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.17.0...v0.17.1)

**Fixed Bugs:**

- Keybindings reset on invalid command [\#3295](https://github.com/VSCodeVim/Vim/issues/3295)

**Closed issues:**

- For easy motion plugin, allow user to remap leader key. [\#3244](https://github.com/VSCodeVim/Vim/issues/3244)
- after opening user settings, all Vim keybindings are disabled [\#3029](https://github.com/VSCodeVim/Vim/issues/3029)

**Merged pull requests:**

- fix: ignore remappings with non-existent commands. fixes \#3295 [\#3296](https://github.com/VSCodeVim/Vim/pull/3296) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update node.js to v8.15 [\#3294](https://github.com/VSCodeVim/Vim/pull/3294) ([renovate-bot](https://github.com/renovate-bot))
- fix: slightly improve perf by caching vscode context [\#3293](https://github.com/VSCodeVim/Vim/pull/3293) ([jpoon](https://github.com/jpoon))
- fix: disable nvim shada [\#3288](https://github.com/VSCodeVim/Vim/pull/3288) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency @types/sinon to v7.0.2 [\#3279](https://github.com/VSCodeVim/Vim/pull/3279) ([renovate-bot](https://github.com/renovate-bot))
- refactor: status bar [\#3276](https://github.com/VSCodeVim/Vim/pull/3276) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency @types/node to v9.6.41 [\#3275](https://github.com/VSCodeVim/Vim/pull/3275) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency tslint to v5.12.0 [\#3272](https://github.com/VSCodeVim/Vim/pull/3272) ([renovate-bot](https://github.com/renovate-bot))
- Release [\#3271](https://github.com/VSCodeVim/Vim/pull/3271) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency typescript to v3.2.2 [\#3234](https://github.com/VSCodeVim/Vim/pull/3234) ([renovate-bot](https://github.com/renovate-bot))

## [v0.17.0](https://github.com/vscodevim/vim/tree/v0.17.0) (2018-12-17)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.16.14...v0.17.0)

**Fixed Bugs:**

- Running :reg when clipboard is empty causes an error [\#2898](https://github.com/VSCodeVim/Vim/issues/2898)

**Merged pull requests:**

- Change to use native vscode clipboard [\#3261](https://github.com/VSCodeVim/Vim/pull/3261) ([xconverge](https://github.com/xconverge))
- chore\(deps\): update dependency @types/sinon to v7 [\#3259](https://github.com/VSCodeVim/Vim/pull/3259) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency sinon to v7.2.1 [\#3258](https://github.com/VSCodeVim/Vim/pull/3258) ([renovate-bot](https://github.com/renovate-bot))
- v0.16.13 -\> v0.16.14 [\#3257](https://github.com/VSCodeVim/Vim/pull/3257) ([jpoon](https://github.com/jpoon))

## [v0.16.14](https://github.com/vscodevim/vim/tree/v0.16.14) (2018-12-11)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.16.13...v0.16.14)

**Enhancements:**

- Add support for new grid layout with splits [\#2696](https://github.com/VSCodeVim/Vim/issues/2696)

**Fixed Bugs:**

- It seems % command is not treated like a motion [\#3138](https://github.com/VSCodeVim/Vim/issues/3138)

**Closed issues:**

- vim.normalModeKeyBindingsNonRecursive do not work [\#3247](https://github.com/VSCodeVim/Vim/issues/3247)
- Status bar in zen mode [\#3245](https://github.com/VSCodeVim/Vim/issues/3245)
- When closing a window with `:q` VS Code now selects the tab "before" the one you were previously on [\#2984](https://github.com/VSCodeVim/Vim/issues/2984)

**Merged pull requests:**

- chore\(deps\): update dependency vscode to v1.1.26 [\#3256](https://github.com/VSCodeVim/Vim/pull/3256) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency sinon to v7.2.0 [\#3255](https://github.com/VSCodeVim/Vim/pull/3255) ([renovate-bot](https://github.com/renovate-bot))
- Format operator fixes and tests [\#3254](https://github.com/VSCodeVim/Vim/pull/3254) ([watsoncj](https://github.com/watsoncj))
- Added common example for key remapping for £ [\#3250](https://github.com/VSCodeVim/Vim/pull/3250) ([ycmjason](https://github.com/ycmjason))
- chore\(deps\): update dependency @types/lodash to v4.14.119 [\#3246](https://github.com/VSCodeVim/Vim/pull/3246) ([renovate-bot](https://github.com/renovate-bot))
- Re-implement `` and '' with jumpTracker [\#3242](https://github.com/VSCodeVim/Vim/pull/3242) ([dsschnau](https://github.com/dsschnau))
- chore\(deps\): update dependency gulp-typescript to v5 [\#3240](https://github.com/VSCodeVim/Vim/pull/3240) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency prettier to v1.15.3 [\#3236](https://github.com/VSCodeVim/Vim/pull/3236) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency @types/node to v9.6.40 [\#3235](https://github.com/VSCodeVim/Vim/pull/3235) ([renovate-bot](https://github.com/renovate-bot))
- fix typo [\#3230](https://github.com/VSCodeVim/Vim/pull/3230) ([fourcels](https://github.com/fourcels))
- chore\(deps\): update node.js to v8.14 [\#3228](https://github.com/VSCodeVim/Vim/pull/3228) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency vscode to v1.1.24 [\#3224](https://github.com/VSCodeVim/Vim/pull/3224) ([renovate-bot](https://github.com/renovate-bot))
- Fix \#2984: wrong tab selected after :quit [\#3170](https://github.com/VSCodeVim/Vim/pull/3170) ([ohjames](https://github.com/ohjames))

## [v0.16.13](https://github.com/vscodevim/vim/tree/v0.16.13) (2018-11-27)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.16.12...v0.16.13)

**Fixed Bugs:**

- Finding with `?` renders `/` in the status bar instead of `?` [\#3211](https://github.com/VSCodeVim/Vim/issues/3211)
- Test docker - debconf enforces interactive during build [\#3168](https://github.com/VSCodeVim/Vim/issues/3168)

**Closed issues:**

- Problem with insert mode after highlighting in visual mode [\#3174](https://github.com/VSCodeVim/Vim/issues/3174)
- Recursive mapping V key [\#3173](https://github.com/VSCodeVim/Vim/issues/3173)
- Code Action not working when using Vim mappings [\#3160](https://github.com/VSCodeVim/Vim/issues/3160)

**Merged pull requests:**

- v0.16.13 [\#3223](https://github.com/VSCodeVim/Vim/pull/3223) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update node.js to v8.13 [\#3222](https://github.com/VSCodeVim/Vim/pull/3222) ([renovate-bot](https://github.com/renovate-bot))
- display '?' or '/' in status bar in search mode [\#3218](https://github.com/VSCodeVim/Vim/pull/3218) ([dsschnau](https://github.com/dsschnau))
- fix: upgrade sinon 5.0.5-\>5.0.7. prettier 1.14.3-\>1.15.2 [\#3217](https://github.com/VSCodeVim/Vim/pull/3217) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency @types/node to v9.6.39 [\#3215](https://github.com/VSCodeVim/Vim/pull/3215) ([renovate-bot](https://github.com/renovate-bot))
- Fix \#1287: CJK characters\(korean\) overlap each other in insert mode [\#3214](https://github.com/VSCodeVim/Vim/pull/3214) ([Injae-Lee](https://github.com/Injae-Lee))
- chore\(deps\): update dependency @types/node to v9.6.37 [\#3204](https://github.com/VSCodeVim/Vim/pull/3204) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency @types/lodash to v4.14.118 [\#3196](https://github.com/VSCodeVim/Vim/pull/3196) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update node.js to v8.12 [\#3194](https://github.com/VSCodeVim/Vim/pull/3194) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency @types/diff to v3.5.2 [\#3193](https://github.com/VSCodeVim/Vim/pull/3193) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency typescript to v3.1.6 [\#3188](https://github.com/VSCodeVim/Vim/pull/3188) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency @types/node to v9.6.36 [\#3187](https://github.com/VSCodeVim/Vim/pull/3187) ([renovate-bot](https://github.com/renovate-bot))
- docs: update roadmap for split and new [\#3184](https://github.com/VSCodeVim/Vim/pull/3184) ([jpoon](https://github.com/jpoon))
- fix: automerge renovate minor/patch [\#3183](https://github.com/VSCodeVim/Vim/pull/3183) ([jpoon](https://github.com/jpoon))
- Update dependency typescript to v3.1.5 [\#3182](https://github.com/VSCodeVim/Vim/pull/3182) ([renovate-bot](https://github.com/renovate-bot))
- Update dependency typescript to v3.1.4 [\#3175](https://github.com/VSCodeVim/Vim/pull/3175) ([renovate-bot](https://github.com/renovate-bot))
- Issue \#3168 - Ubuntu tests [\#3169](https://github.com/VSCodeVim/Vim/pull/3169) ([pschoffer](https://github.com/pschoffer))
- v0.16.12 [\#3165](https://github.com/VSCodeVim/Vim/pull/3165) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency sinon to v7.1.1 [\#3162](https://github.com/VSCodeVim/Vim/pull/3162) ([renovate-bot](https://github.com/renovate-bot))
- Convert synchronous funcs to async [\#3123](https://github.com/VSCodeVim/Vim/pull/3123) ([kylecarbs](https://github.com/kylecarbs))

## [v0.16.12](https://github.com/vscodevim/vim/tree/v0.16.12) (2018-10-26)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.16.11...v0.16.12)

**Fixed Bugs:**

- Gulp test with Docker fails to launch [\#3152](https://github.com/VSCodeVim/Vim/issues/3152)
- The link to \*Multi-Cursor\* mode in \_\_Table of content\_\_ doesn't work \(in repo\) [\#3149](https://github.com/VSCodeVim/Vim/issues/3149)
- Multi-Cursor + insertModeKeyBinding jk -\> \<Esc\> [\#2752](https://github.com/VSCodeVim/Vim/issues/2752)

**Merged pull requests:**

- Add more Docker documentation [\#3156](https://github.com/VSCodeVim/Vim/pull/3156) ([westim](https://github.com/westim))
- Fix 3152: Upgrade Docker prerequisite libgtk from 2.0 to 3.0 [\#3153](https://github.com/VSCodeVim/Vim/pull/3153) ([westim](https://github.com/westim))
- Fix \#3149: broken table of contents links [\#3151](https://github.com/VSCodeVim/Vim/pull/3151) ([westim](https://github.com/westim))
- Fix for \#2752 [\#3131](https://github.com/VSCodeVim/Vim/pull/3131) ([donald93](https://github.com/donald93))

## [v0.16.11](https://github.com/vscodevim/vim/tree/v0.16.11) (2018-10-19)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.16.10...v0.16.11)

**Closed issues:**

- Version 0.16.10 stuck in insert mode [\#3143](https://github.com/VSCodeVim/Vim/issues/3143)
- fold code block bug [\#3140](https://github.com/VSCodeVim/Vim/issues/3140)
- Escape key stopped being registered so can't exit insert mode [\#3139](https://github.com/VSCodeVim/Vim/issues/3139)

**Merged pull requests:**

- Prevent error on loading search history if no active editor on startup [\#3146](https://github.com/VSCodeVim/Vim/pull/3146) ([shawnaxsom](https://github.com/shawnaxsom))
- v0.16.10 [\#3137](https://github.com/VSCodeVim/Vim/pull/3137) ([jpoon](https://github.com/jpoon))

## [v0.16.10](https://github.com/vscodevim/vim/tree/v0.16.10) (2018-10-14)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.16.9...v0.16.10)

**Enhancements:**

- Previous searches are not saved across sessions [\#3098](https://github.com/VSCodeVim/Vim/issues/3098)
- substitution statefulness [\#3067](https://github.com/VSCodeVim/Vim/issues/3067)
- feat: implement 'changeWordIncludesWhitespace' option [\#2964](https://github.com/VSCodeVim/Vim/pull/2964) ([darfink](https://github.com/darfink))

**Fixed Bugs:**

- Wrong cursor position after using same file in two panels [\#2688](https://github.com/VSCodeVim/Vim/issues/2688)
- Search and replace doesn't work with current line \(.\) and relative lines [\#2384](https://github.com/VSCodeVim/Vim/issues/2384)

**Closed issues:**

- Broken on Insiders build [\#3119](https://github.com/VSCodeVim/Vim/issues/3119)
- Cannot bind \<C-h\> [\#3072](https://github.com/VSCodeVim/Vim/issues/3072)
- CTRL-\[ does not quit the command-line editing mode [\#3019](https://github.com/VSCodeVim/Vim/issues/3019)

**Merged pull requests:**

- chore\(deps\): update dependency sinon to v7 [\#3135](https://github.com/VSCodeVim/Vim/pull/3135) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency typescript to v3.1.3 [\#3130](https://github.com/VSCodeVim/Vim/pull/3130) ([renovate-bot](https://github.com/renovate-bot))
- Update dependency typescript to v3.1.2 [\#3122](https://github.com/VSCodeVim/Vim/pull/3122) ([renovate-bot](https://github.com/renovate-bot))
- Update dependency @types/node to v9.6.35 [\#3121](https://github.com/VSCodeVim/Vim/pull/3121) ([renovate-bot](https://github.com/renovate-bot))
- Update dependency @types/lodash to v4.14.117 [\#3120](https://github.com/VSCodeVim/Vim/pull/3120) ([renovate-bot](https://github.com/renovate-bot))
- Update dependency @types/sinon to v5.0.5 [\#3118](https://github.com/VSCodeVim/Vim/pull/3118) ([renovate-bot](https://github.com/renovate-bot))
- Save search history to a file like commandline history [\#3116](https://github.com/VSCodeVim/Vim/pull/3116) ([xconverge](https://github.com/xconverge))
- fix \(simpler\) - cursor whenever changing editors - closes \#2688 [\#3103](https://github.com/VSCodeVim/Vim/pull/3103) ([captaincaius](https://github.com/captaincaius))
- feature: relative, plus/minus ranges. closes \#2384 [\#3071](https://github.com/VSCodeVim/Vim/pull/3071) ([captaincaius](https://github.com/captaincaius))
- Adding state to substitution command [\#3068](https://github.com/VSCodeVim/Vim/pull/3068) ([captaincaius](https://github.com/captaincaius))

## [v0.16.9](https://github.com/vscodevim/vim/tree/v0.16.9) (2018-10-08)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.16.8...v0.16.9)

**Fixed Bugs:**

- Repeating command \(`.`\) after doing vim-easymotion find character command doesn't work. [\#3111](https://github.com/VSCodeVim/Vim/issues/3111)
- Incrementing / Decrementing numbers doesn't work when it's after a minus sign and a word [\#3057](https://github.com/VSCodeVim/Vim/issues/3057)
- Unexpected behavior with easymotion and `.` as repeat command [\#2310](https://github.com/VSCodeVim/Vim/issues/2310)

**Merged pull requests:**

- support "edit" command [\#3114](https://github.com/VSCodeVim/Vim/pull/3114) ([m59peacemaker](https://github.com/m59peacemaker))
- Minor C-a C-x fix [\#3113](https://github.com/VSCodeVim/Vim/pull/3113) ([xconverge](https://github.com/xconverge))
- Allow dot to repeat after doing any EasyMotion move [\#3112](https://github.com/VSCodeVim/Vim/pull/3112) ([xconverge](https://github.com/xconverge))

## [v0.16.8](https://github.com/vscodevim/vim/tree/v0.16.8) (2018-10-06)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.16.7...v0.16.8)

**Closed issues:**

- \<C -c\> stopped working this morning [\#3110](https://github.com/VSCodeVim/Vim/issues/3110)
- version 0.16.6 cause \<tab\> key insert string for unknown reason [\#3096](https://github.com/VSCodeVim/Vim/issues/3096)
- yank in visual mode doesn't update register 0 [\#3065](https://github.com/VSCodeVim/Vim/issues/3065)
- Paste the yanked text with "0p does no work [\#2554](https://github.com/VSCodeVim/Vim/issues/2554)
- Surround: Keep HTML attributes when changing tags [\#1938](https://github.com/VSCodeVim/Vim/issues/1938)

**Merged pull requests:**

- Fix issues with keybindings when changing to an editor in different mode [\#3108](https://github.com/VSCodeVim/Vim/pull/3108) ([shawnaxsom](https://github.com/shawnaxsom))
- README cleanup [\#3107](https://github.com/VSCodeVim/Vim/pull/3107) ([xconverge](https://github.com/xconverge))
- Update readme based on new feature for surround with attributes [\#3106](https://github.com/VSCodeVim/Vim/pull/3106) ([xconverge](https://github.com/xconverge))
- fixes \#1938 Allow to retain attributes when using surround [\#3105](https://github.com/VSCodeVim/Vim/pull/3105) ([xconverge](https://github.com/xconverge))
- Multiline yank writes to 0 register; fixes \#1214 [\#3087](https://github.com/VSCodeVim/Vim/pull/3087) ([JKillian](https://github.com/JKillian))

## [v0.16.7](https://github.com/vscodevim/vim/tree/v0.16.7) (2018-10-06)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.16.6...v0.16.7)

**Merged pull requests:**

- Update dependency @types/sinon to v5.0.4 [\#3104](https://github.com/VSCodeVim/Vim/pull/3104) ([renovate-bot](https://github.com/renovate-bot))
- Cleanup gt count command [\#3097](https://github.com/VSCodeVim/Vim/pull/3097) ([xconverge](https://github.com/xconverge))
- Update dependency @types/sinon to v5.0.3 [\#3093](https://github.com/VSCodeVim/Vim/pull/3093) ([renovate-bot](https://github.com/renovate-bot))
- Update dependency @types/node to v9.6.34 [\#3092](https://github.com/VSCodeVim/Vim/pull/3092) ([renovate-bot](https://github.com/renovate-bot))
- Update dependency sinon to v6.3.5 [\#3091](https://github.com/VSCodeVim/Vim/pull/3091) ([renovate-bot](https://github.com/renovate-bot))
- Remappings not applying with operators that enter insert mode [\#3090](https://github.com/VSCodeVim/Vim/pull/3090) ([shawnaxsom](https://github.com/shawnaxsom))
- v0.16.6 [\#3085](https://github.com/VSCodeVim/Vim/pull/3085) ([jpoon](https://github.com/jpoon))
- Add support for grid layout [\#2697](https://github.com/VSCodeVim/Vim/pull/2697) ([rodcloutier](https://github.com/rodcloutier))

## [v0.16.6](https://github.com/vscodevim/vim/tree/v0.16.6) (2018-10-02)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.16.5...v0.16.6)

**Fixed Bugs:**

- Confirm-Replace works incorrectly with global substitute for certain types of replace patterns [\#2950](https://github.com/VSCodeVim/Vim/issues/2950)
- Remapping `d` to always delete to black-hole [\#2672](https://github.com/VSCodeVim/Vim/issues/2672)

**Closed issues:**

- Visual Block Mode when not using Ctrl keys [\#3042](https://github.com/VSCodeVim/Vim/issues/3042)
- Investigate reducing startup activation time [\#2947](https://github.com/VSCodeVim/Vim/issues/2947)

**Merged pull requests:**

- Feature/fix black hole operator mappings [\#3081](https://github.com/VSCodeVim/Vim/pull/3081) ([shawnaxsom](https://github.com/shawnaxsom))
- Feature/insert mode optimizations [\#3078](https://github.com/VSCodeVim/Vim/pull/3078) ([shawnaxsom](https://github.com/shawnaxsom))
- Update dependency typescript to v3.1.1 [\#3077](https://github.com/VSCodeVim/Vim/pull/3077) ([renovate-bot](https://github.com/renovate-bot))
- Update dependency @types/node to v9.6.32 [\#3066](https://github.com/VSCodeVim/Vim/pull/3066) ([renovate-bot](https://github.com/renovate-bot))
- Fix substitute with gc flag [\#3055](https://github.com/VSCodeVim/Vim/pull/3055) ([tomotg](https://github.com/tomotg))

## [v0.16.5](https://github.com/vscodevim/vim/tree/v0.16.5) (2018-09-21)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.16.4...v0.16.5)

**Fixed Bugs:**

- keybinding \<c-f\> overwrite vscode's default behavior [\#3050](https://github.com/VSCodeVim/Vim/issues/3050)
- New Jump Tracker doesn't always handle that isn't left open in a tab [\#3039](https://github.com/VSCodeVim/Vim/issues/3039)
- Exiting CommandMode should mimic Vim behavior [\#3035](https://github.com/VSCodeVim/Vim/issues/3035)

**Closed issues:**

- C-o, C-i strange jumping behavior. [\#3047](https://github.com/VSCodeVim/Vim/issues/3047)
- Support vscode's color copy [\#3038](https://github.com/VSCodeVim/Vim/issues/3038)
- Possible for `:new` to a open a new editor in the current group without splitting? [\#2911](https://github.com/VSCodeVim/Vim/issues/2911)
- Support for ' ' \(Jump to previous cursor position\) [\#2031](https://github.com/VSCodeVim/Vim/issues/2031)

**Merged pull requests:**

- Update dependency prettier to v1.14.3 [\#3060](https://github.com/VSCodeVim/Vim/pull/3060) ([renovate-bot](https://github.com/renovate-bot))
- fix `\<C-f\>` in 「Insert」mode [\#3051](https://github.com/VSCodeVim/Vim/pull/3051) ([myhere](https://github.com/myhere))
- Support for line completion \(\<C-x\>\<C-l\>\) [\#3048](https://github.com/VSCodeVim/Vim/pull/3048) ([shawnaxsom](https://github.com/shawnaxsom))
- Update dependency lodash to v4.17.11 [\#3045](https://github.com/VSCodeVim/Vim/pull/3045) ([renovate-bot](https://github.com/renovate-bot))
- Fixed Jump Tracker jumps when jumping from a file that auto closes [\#3041](https://github.com/VSCodeVim/Vim/pull/3041) ([shawnaxsom](https://github.com/shawnaxsom))
- Fix: Missing bindings to exit CommandMode. closes \#3035 [\#3036](https://github.com/VSCodeVim/Vim/pull/3036) ([mxlian](https://github.com/mxlian))

## [v0.16.4](https://github.com/vscodevim/vim/tree/v0.16.4) (2018-09-10)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.16.3...v0.16.4)

**Enhancements:**

- \[FEATURE REQUEST\]visual line mode support A or I [\#2167](https://github.com/VSCodeVim/Vim/issues/2167)

**Closed issues:**

- Moving out of viewport centers the viewport when it shouldn't [\#2998](https://github.com/VSCodeVim/Vim/issues/2998)
- docs: all-contributors [\#2645](https://github.com/VSCodeVim/Vim/issues/2645)
- Make small movement command not registered to Ctrl+o [\#1933](https://github.com/VSCodeVim/Vim/issues/1933)

**Merged pull requests:**

- Feature/improved jump list [\#3028](https://github.com/VSCodeVim/Vim/pull/3028) ([shawnaxsom](https://github.com/shawnaxsom))
- I or A in visual/visual line mode creates multiple cursors \#2167 [\#2993](https://github.com/VSCodeVim/Vim/pull/2993) ([shawnaxsom](https://github.com/shawnaxsom))

## [v0.16.3](https://github.com/vscodevim/vim/tree/v0.16.3) (2018-09-05)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.16.2...v0.16.3)

**Enhancements:**

- Add activationEvent 'onCommand:type' to avoid missing keystrokes [\#3016](https://github.com/VSCodeVim/Vim/issues/3016)
- va{a{ doesn't work [\#2506](https://github.com/VSCodeVim/Vim/issues/2506)

**Closed issues:**

- Expand selection with inner tag selection command [\#2907](https://github.com/VSCodeVim/Vim/issues/2907)

**Merged pull requests:**

- fix: re-enable relativelinenumbers. closes \#3020 [\#3025](https://github.com/VSCodeVim/Vim/pull/3025) ([jpoon](https://github.com/jpoon))
- fix: add activationevent onCommand type. closes \#3016 [\#3023](https://github.com/VSCodeVim/Vim/pull/3023) ([jpoon](https://github.com/jpoon))
- Update dependency winston to v3.1.0 [\#3021](https://github.com/VSCodeVim/Vim/pull/3021) ([renovate-bot](https://github.com/renovate-bot))
- Update dependency diff-match-patch to v1.0.4 [\#3018](https://github.com/VSCodeVim/Vim/pull/3018) ([renovate-bot](https://github.com/renovate-bot))
- Update dependency @types/node to v9.6.31 [\#3011](https://github.com/VSCodeVim/Vim/pull/3011) ([renovate-bot](https://github.com/renovate-bot))
- Fix multiple issues with expand selection commands and pair/block movement [\#2921](https://github.com/VSCodeVim/Vim/pull/2921) ([xmbhasin](https://github.com/xmbhasin))

## [v0.16.2](https://github.com/vscodevim/vim/tree/v0.16.2) (2018-08-30)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.16.1...v0.16.2)

**Closed issues:**

- Intermediate cursor shape to show that a command is being entered [\#2999](https://github.com/VSCodeVim/Vim/issues/2999)

**Merged pull requests:**

- Revert "Center cursor vertically on movement out of viewport" [\#3009](https://github.com/VSCodeVim/Vim/pull/3009) ([hhu94](https://github.com/hhu94))
- Update dependency typescript to v3.0.3 [\#3008](https://github.com/VSCodeVim/Vim/pull/3008) ([renovate-bot](https://github.com/renovate-bot))
- Update vim.searchHighlightColor in README.md [\#3007](https://github.com/VSCodeVim/Vim/pull/3007) ([ytang](https://github.com/ytang))
- v0.16.1 [\#2997](https://github.com/VSCodeVim/Vim/pull/2997) ([jpoon](https://github.com/jpoon))

## [v0.16.1](https://github.com/vscodevim/vim/tree/v0.16.1) (2018-08-27)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.16.0...v0.16.1)

**Fixed Bugs:**

- `:vsp file\_name` cannot open file_name, although this file does exist [\#2983](https://github.com/VSCodeVim/Vim/issues/2983)
- `gf` \(go to file under cursor\) produces the "Vim: The file ... does not exist." error, even though file clearly exists [\#2966](https://github.com/VSCodeVim/Vim/issues/2966)
- Open File with :e deletes file content [\#2963](https://github.com/VSCodeVim/Vim/issues/2963)

**Closed issues:**

- "before": \["\<C-x\>", "C-s\>"\] not work. [\#2949](https://github.com/VSCodeVim/Vim/issues/2949)
- VSCodeVim airline affecting color scheme [\#2948](https://github.com/VSCodeVim/Vim/issues/2948)
- \[Feature Request\] : ReplaceWithRegister [\#2937](https://github.com/VSCodeVim/Vim/issues/2937)
- % should match on strings & chars [\#2935](https://github.com/VSCodeVim/Vim/issues/2935)
- Throw away the mouse [\#2922](https://github.com/VSCodeVim/Vim/issues/2922)
- Wried cursor behavior with INSERT MULTI CURSOR mode [\#2910](https://github.com/VSCodeVim/Vim/issues/2910)

**Merged pull requests:**

- Lazy Load Neovim [\#2992](https://github.com/VSCodeVim/Vim/pull/2992) ([jpoon](https://github.com/jpoon))
- Update dependency @types/node to v9.6.30 [\#2987](https://github.com/VSCodeVim/Vim/pull/2987) ([renovate-bot](https://github.com/renovate-bot))
- Fix type in ROADMAP.md [\#2980](https://github.com/VSCodeVim/Vim/pull/2980) ([nickebbitt](https://github.com/nickebbitt))
- Fix emulated plugins link in README [\#2977](https://github.com/VSCodeVim/Vim/pull/2977) ([jjt](https://github.com/jjt))
- Fix `gf` showing error for files which exist [\#2969](https://github.com/VSCodeVim/Vim/pull/2969) ([arussellk](https://github.com/arussellk))
- Fix Typo in ROADMAP [\#2967](https://github.com/VSCodeVim/Vim/pull/2967) ([AdrieanKhisbe](https://github.com/AdrieanKhisbe))
- Center cursor vertically on movement out of viewport [\#2962](https://github.com/VSCodeVim/Vim/pull/2962) ([hhu94](https://github.com/hhu94))
- chore\(deps\): update dependency vscode to v1.1.21 [\#2958](https://github.com/VSCodeVim/Vim/pull/2958) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency @types/node to v9.6.28 [\#2952](https://github.com/VSCodeVim/Vim/pull/2952) ([renovate-bot](https://github.com/renovate-bot))

## [v0.16.0](https://github.com/vscodevim/vim/tree/v0.16.0) (2018-08-09)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.15.7...v0.16.0)

**Enhancements:**

- Reenable change that minimized the calls to setContext [\#2900](https://github.com/VSCodeVim/Vim/pull/2900) ([xconverge](https://github.com/xconverge))

**Fixed Bugs:**

- Cannot create files with extensions using :e\[dit\] {file} [\#2923](https://github.com/VSCodeVim/Vim/issues/2923)
- :tablast broken with vscode 1.25.0 [\#2813](https://github.com/VSCodeVim/Vim/issues/2813)
- 2gt not goes to the right tab [\#2789](https://github.com/VSCodeVim/Vim/issues/2789)

**Closed issues:**

- "commandlineinprogress": "underline" causes issues [\#2896](https://github.com/VSCodeVim/Vim/issues/2896)
- Quote macro sometimes doubling in Python [\#2662](https://github.com/VSCodeVim/Vim/issues/2662)
- easy motion mapping key problem [\#1894](https://github.com/VSCodeVim/Vim/issues/1894)

**Merged pull requests:**

- bump version [\#2946](https://github.com/VSCodeVim/Vim/pull/2946) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency prettier to v1.14.2 [\#2943](https://github.com/VSCodeVim/Vim/pull/2943) ([renovate-bot](https://github.com/renovate-bot))
- docs: move configs to tables for readability [\#2941](https://github.com/VSCodeVim/Vim/pull/2941) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency @types/node to v9.6.26 [\#2940](https://github.com/VSCodeVim/Vim/pull/2940) ([renovate-bot](https://github.com/renovate-bot))
- docs: clean-up readme [\#2931](https://github.com/VSCodeVim/Vim/pull/2931) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency @types/lodash to v4.14.116 [\#2930](https://github.com/VSCodeVim/Vim/pull/2930) ([renovate-bot](https://github.com/renovate-bot))
- fix: files with extensions not being auto-created. closes \#2923. [\#2928](https://github.com/VSCodeVim/Vim/pull/2928) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency @types/node to v9.6.25 [\#2927](https://github.com/VSCodeVim/Vim/pull/2927) ([renovate-bot](https://github.com/renovate-bot))
- Fix :tablast breaking in vscode 1.25 \#2813 [\#2926](https://github.com/VSCodeVim/Vim/pull/2926) ([Roshanjossey](https://github.com/Roshanjossey))
- chore\(deps\): update dependency typescript to v3 [\#2920](https://github.com/VSCodeVim/Vim/pull/2920) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency gulp-git to v2.8.0 [\#2919](https://github.com/VSCodeVim/Vim/pull/2919) ([renovate-bot](https://github.com/renovate-bot))
- Fix Emulated Plugins TOC link in README [\#2918](https://github.com/VSCodeVim/Vim/pull/2918) ([jjt](https://github.com/jjt))
- fix: use full path for configs [\#2915](https://github.com/VSCodeVim/Vim/pull/2915) ([jpoon](https://github.com/jpoon))
- fix: enable prettier for md [\#2909](https://github.com/VSCodeVim/Vim/pull/2909) ([jpoon](https://github.com/jpoon))
- Update dependency prettier to v1.14.0 [\#2908](https://github.com/VSCodeVim/Vim/pull/2908) ([renovate-bot](https://github.com/renovate-bot))
- Update dependency @types/node to v9.6.24 [\#2906](https://github.com/VSCodeVim/Vim/pull/2906) ([renovate-bot](https://github.com/renovate-bot))
- Update dependency @types/lodash to v4.14.115 [\#2905](https://github.com/VSCodeVim/Vim/pull/2905) ([renovate-bot](https://github.com/renovate-bot))
- Add --grep flag to gulp test [\#2904](https://github.com/VSCodeVim/Vim/pull/2904) ([xmbhasin](https://github.com/xmbhasin))
- Update dependency @types/lodash to v4.14.114 [\#2901](https://github.com/VSCodeVim/Vim/pull/2901) ([renovate-bot](https://github.com/renovate-bot))
- Fix gt tab navigation with count prefix [\#2899](https://github.com/VSCodeVim/Vim/pull/2899) ([xconverge](https://github.com/xconverge))
- Updating README FAQ [\#2894](https://github.com/VSCodeVim/Vim/pull/2894) ([augustnmonteiro](https://github.com/augustnmonteiro))
- refactor baseaction [\#2892](https://github.com/VSCodeVim/Vim/pull/2892) ([jpoon](https://github.com/jpoon))
- Revert "fix: use ferrarimarco's image instead of my fork to generate changelog" [\#2891](https://github.com/VSCodeVim/Vim/pull/2891) ([jpoon](https://github.com/jpoon))
- Integrate SmartIM to VSCodeVim [\#2643](https://github.com/VSCodeVim/Vim/pull/2643) ([daipeihust](https://github.com/daipeihust))

## [v0.15.7](https://github.com/vscodevim/vim/tree/v0.15.7) (2018-07-25)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.15.6...v0.15.7)

**Enhancements:**

- Please use vscode's config folder for .cmdline_history [\#2799](https://github.com/VSCodeVim/Vim/issues/2799)
- Improve neovim command execution status reporting in status bar [\#2878](https://github.com/VSCodeVim/Vim/pull/2878) ([xconverge](https://github.com/xconverge))

**Fixed Bugs:**

- 'r' in insert mode not entered when typed quickly [\#2888](https://github.com/VSCodeVim/Vim/issues/2888)
- Vim extension stops working [\#2873](https://github.com/VSCodeVim/Vim/issues/2873)

**Closed issues:**

- hjkl keys as arrow keys in intellisense contextual menu do not work [\#2885](https://github.com/VSCodeVim/Vim/issues/2885)

**Merged pull requests:**

- Fix issue with incorrectly finding and triggering certain remappings [\#2890](https://github.com/VSCodeVim/Vim/pull/2890) ([xconverge](https://github.com/xconverge))
- Move commandline history to XDG_CACHE_HOME or %APPDATA% [\#2889](https://github.com/VSCodeVim/Vim/pull/2889) ([xconverge](https://github.com/xconverge))
- fix: use ferrarimarco's image instead of my fork to generate changelog [\#2884](https://github.com/VSCodeVim/Vim/pull/2884) ([jpoon](https://github.com/jpoon))
- fix: use map to search for relevant actions. \#2021 [\#2883](https://github.com/VSCodeVim/Vim/pull/2883) ([jpoon](https://github.com/jpoon))
- fix: handle non-string remapped key. closes \#2873 [\#2881](https://github.com/VSCodeVim/Vim/pull/2881) ([jpoon](https://github.com/jpoon))

## [v0.15.6](https://github.com/vscodevim/vim/tree/v0.15.6) (2018-07-24)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.15.5...v0.15.6)

**Merged pull requests:**

- Fix regression with setContext in modeHandler [\#2880](https://github.com/VSCodeVim/Vim/pull/2880) ([xconverge](https://github.com/xconverge))

## [v0.15.5](https://github.com/vscodevim/vim/tree/v0.15.5) (2018-07-24)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.15.4...v0.15.5)

**Merged pull requests:**

- Neovim integration show errors when using commandline at correct times [\#2877](https://github.com/VSCodeVim/Vim/pull/2877) ([xconverge](https://github.com/xconverge))
- Improve error reporting with neovim commandline [\#2876](https://github.com/VSCodeVim/Vim/pull/2876) ([xconverge](https://github.com/xconverge))
- chore\(deps\): update dependency @types/lodash to v4.14.113 [\#2875](https://github.com/VSCodeVim/Vim/pull/2875) ([renovate-bot](https://github.com/renovate-bot))

## [v0.15.4](https://github.com/vscodevim/vim/tree/v0.15.4) (2018-07-24)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.15.3...v0.15.4)

**Enhancements:**

- Moving down at a fold that's at the end of the file causes an infinite loop [\#1855](https://github.com/VSCodeVim/Vim/issues/1855)

**Fixed Bugs:**

- Long key chords does not trigger configured action. [\#2735](https://github.com/VSCodeVim/Vim/issues/2735)
- Cursor jumps erratically before moving vertically [\#2163](https://github.com/VSCodeVim/Vim/issues/2163)

**Closed issues:**

- ^f stopped working after 1.25.1 update [\#2865](https://github.com/VSCodeVim/Vim/issues/2865)
- Switching escape and capslock [\#2859](https://github.com/VSCodeVim/Vim/issues/2859)

**Merged pull requests:**

- fix: add missing wrapkeys to test configuration [\#2871](https://github.com/VSCodeVim/Vim/pull/2871) ([jpoon](https://github.com/jpoon))
- Improve foldfix performance and potentially fix some bugs\(\#1855 \#2163\) [\#2867](https://github.com/VSCodeVim/Vim/pull/2867) ([xmbhasin](https://github.com/xmbhasin))
- Roadmap doc fix for visual mode case switching [\#2866](https://github.com/VSCodeVim/Vim/pull/2866) ([pjlangley](https://github.com/pjlangley))
- Add whichwrap [\#2864](https://github.com/VSCodeVim/Vim/pull/2864) ([davidmfoley](https://github.com/davidmfoley))
- docs: add section on debugging remappings [\#2862](https://github.com/VSCodeVim/Vim/pull/2862) ([jpoon](https://github.com/jpoon))
- Cache mode so that calls to setContext is minimized [\#2861](https://github.com/VSCodeVim/Vim/pull/2861) ([xconverge](https://github.com/xconverge))
- Workaround surround bug [\#2830](https://github.com/VSCodeVim/Vim/pull/2830) ([reujab](https://github.com/reujab))
- Add unit test for long user configured chords. [\#2736](https://github.com/VSCodeVim/Vim/pull/2736) ([regiontog](https://github.com/regiontog))

## [v0.15.3](https://github.com/vscodevim/vim/tree/v0.15.3) (2018-07-20)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.15.2...v0.15.3)

**Fixed Bugs:**

- :\$ requires additional enter to go to end of buffer [\#2858](https://github.com/VSCodeVim/Vim/issues/2858)

**Merged pull requests:**

- Fixes \$ and % commands [\#2860](https://github.com/VSCodeVim/Vim/pull/2860) ([xconverge](https://github.com/xconverge))
- fixed buggy interactive substitute replacements [\#2857](https://github.com/VSCodeVim/Vim/pull/2857) ([kevintighe](https://github.com/kevintighe))

## [v0.15.2](https://github.com/vscodevim/vim/tree/v0.15.2) (2018-07-19)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.15.1...v0.15.2)

**Fixed Bugs:**

- Change surround tag with tag including a dot [\#2850](https://github.com/VSCodeVim/Vim/issues/2850)
- Delete using \('d' + 'number' + '+/-'\) \(e.g. d5+\) doesn't work like expected. [\#2846](https://github.com/VSCodeVim/Vim/issues/2846)

**Merged pull requests:**

- fixes \#2850 [\#2856](https://github.com/VSCodeVim/Vim/pull/2856) ([xconverge](https://github.com/xconverge))
- fix: don't run test when launching through vscode [\#2854](https://github.com/VSCodeVim/Vim/pull/2854) ([jpoon](https://github.com/jpoon))
- v0.15.1 [\#2853](https://github.com/VSCodeVim/Vim/pull/2853) ([jpoon](https://github.com/jpoon))
- Interactive Substitute [\#2851](https://github.com/VSCodeVim/Vim/pull/2851) ([kevintighe](https://github.com/kevintighe))

## [v0.15.1](https://github.com/vscodevim/vim/tree/v0.15.1) (2018-07-17)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.15.0...v0.15.1)

**Enhancements:**

- Option case-insensitive for vim-sneak [\#2829](https://github.com/VSCodeVim/Vim/issues/2829)
- "x" operation far too cpu-hungry [\#1581](https://github.com/VSCodeVim/Vim/issues/1581)

**Fixed Bugs:**

- ctrl+v no longer pastes in insert mode [\#2646](https://github.com/VSCodeVim/Vim/issues/2646)

**Merged pull requests:**

- fix: upgrade winston to 3.0 [\#2852](https://github.com/VSCodeVim/Vim/pull/2852) ([jpoon](https://github.com/jpoon))
- update tslint and fix radix linting [\#2849](https://github.com/VSCodeVim/Vim/pull/2849) ([xconverge](https://github.com/xconverge))
- Update dependency @types/mocha to v5.2.5 [\#2847](https://github.com/VSCodeVim/Vim/pull/2847) ([renovate-bot](https://github.com/renovate-bot))
- gulp release [\#2841](https://github.com/VSCodeVim/Vim/pull/2841) ([jpoon](https://github.com/jpoon))
- Update dependency @types/lodash to v4.14.112 [\#2839](https://github.com/VSCodeVim/Vim/pull/2839) ([renovate-bot](https://github.com/renovate-bot))
- Add config option for sneak to use smartcase and ignorecase [\#2837](https://github.com/VSCodeVim/Vim/pull/2837) ([xconverge](https://github.com/xconverge))

## [v0.15.0](https://github.com/vscodevim/vim/tree/v0.15.0) (2018-07-12)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.14.2...v0.15.0)

**Enhancements:**

- TypeError shown on invalid search command. [\#2823](https://github.com/VSCodeVim/Vim/issues/2823)
- Allow registering keybindings commands using strings [\#2806](https://github.com/VSCodeVim/Vim/issues/2806)

**Fixed Bugs:**

- Keybindings not triggering [\#2833](https://github.com/VSCodeVim/Vim/issues/2833)
- Macro doesn't memoryize `delete` key. [\#2702](https://github.com/VSCodeVim/Vim/issues/2702)
- VimError's does not show up on the status bar [\#2525](https://github.com/VSCodeVim/Vim/issues/2525)

**Merged pull requests:**

- Add "cursor" to commandline entry [\#2836](https://github.com/VSCodeVim/Vim/pull/2836) ([xconverge](https://github.com/xconverge))
- Update issue templates [\#2825](https://github.com/VSCodeVim/Vim/pull/2825) ([jpoon](https://github.com/jpoon))
- Cache the mode for updating status bar colors [\#2822](https://github.com/VSCodeVim/Vim/pull/2822) ([xconverge](https://github.com/xconverge))
- chore\(deps\): update dependency @types/lodash to v4.14.111 [\#2821](https://github.com/VSCodeVim/Vim/pull/2821) ([renovate-bot](https://github.com/renovate-bot))
- Fix quickpick commandline [\#2816](https://github.com/VSCodeVim/Vim/pull/2816) ([xconverge](https://github.com/xconverge))
- Added ability to register commands using simple strings \(fixes \#2806\) [\#2807](https://github.com/VSCodeVim/Vim/pull/2807) ([6A](https://github.com/6A))

## [v0.14.2](https://github.com/vscodevim/vim/tree/v0.14.2) (2018-07-06)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.14.1...v0.14.2)

**Enhancements:**

- \<C-u\> doesn't behave as expected in insert mode [\#2804](https://github.com/VSCodeVim/Vim/issues/2804)
- \(feature\) Add an option to bring commandline back to old place [\#2773](https://github.com/VSCodeVim/Vim/issues/2773)

**Fixed Bugs:**

- 2gt not goes to the right tab [\#2789](https://github.com/VSCodeVim/Vim/issues/2789)
- Repeating a VISUAL LINE indentation is inconsistent with native vim behaviour [\#2606](https://github.com/VSCodeVim/Vim/issues/2606)
- ngt/ngT for tab switching is broken [\#2580](https://github.com/VSCodeVim/Vim/issues/2580)

**Closed issues:**

- editor.cursorStyle not being respected [\#2809](https://github.com/VSCodeVim/Vim/issues/2809)

**Merged pull requests:**

- Make gt work correctly like gT [\#2812](https://github.com/VSCodeVim/Vim/pull/2812) ([xconverge](https://github.com/xconverge))
- chore\(deps\): update dependency @types/node to v9.6.23 [\#2811](https://github.com/VSCodeVim/Vim/pull/2811) ([renovate-bot](https://github.com/renovate-bot))
- feat: Update \<C-u\> insert mode behavior [\#2805](https://github.com/VSCodeVim/Vim/pull/2805) ([mrwest808](https://github.com/mrwest808))
- bump version [\#2797](https://github.com/VSCodeVim/Vim/pull/2797) ([jpoon](https://github.com/jpoon))
- fixes \#2606 [\#2790](https://github.com/VSCodeVim/Vim/pull/2790) ([xconverge](https://github.com/xconverge))
- Allow for quickpick commandline usage [\#2781](https://github.com/VSCodeVim/Vim/pull/2781) ([xconverge](https://github.com/xconverge))

## [v0.14.1](https://github.com/vscodevim/vim/tree/v0.14.1) (2018-06-30)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.14.0...v0.14.1)

**Fixed Bugs:**

- Remapping \> to editor.fold [\#2774](https://github.com/VSCodeVim/Vim/issues/2774)
- Bug: Remapping Numbers \(0-9\) [\#2759](https://github.com/VSCodeVim/Vim/issues/2759)
- At a certain point VSCodeVim "forgets" all remappings for every new tab opened [\#2271](https://github.com/VSCodeVim/Vim/issues/2271)

**Closed issues:**

- 0.14.0 doesn't work on Fedora 28, but 0.13.1 works. [\#2780](https://github.com/VSCodeVim/Vim/issues/2780)
- \[neovim\] Inconsistent behaviour when clicking files in the file tree [\#2770](https://github.com/VSCodeVim/Vim/issues/2770)

**Merged pull requests:**

- doc: emojify readme [\#2796](https://github.com/VSCodeVim/Vim/pull/2796) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency @types/mocha to v5.2.4 [\#2795](https://github.com/VSCodeVim/Vim/pull/2795) ([renovate-bot](https://github.com/renovate-bot))
- fix: enable remapping of numbers [\#2793](https://github.com/VSCodeVim/Vim/pull/2793) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency prettier to v1.13.7 [\#2786](https://github.com/VSCodeVim/Vim/pull/2786) ([renovate-bot](https://github.com/renovate-bot))
- refactor: simplify normalizekey\(\) by using existing map [\#2782](https://github.com/VSCodeVim/Vim/pull/2782) ([jpoon](https://github.com/jpoon))
- fix: fixes bug where null arguments to vscode executecommand would fail [\#2776](https://github.com/VSCodeVim/Vim/pull/2776) ([jpoon](https://github.com/jpoon))

## [v0.14.0](https://github.com/vscodevim/vim/tree/v0.14.0) (2018-06-26)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.13.1...v0.14.0)

**Fixed Bugs:**

- Surround aliases not working as targets [\#2769](https://github.com/VSCodeVim/Vim/issues/2769)
- Ctrl+D stuck on top of the window on visual mode [\#2766](https://github.com/VSCodeVim/Vim/issues/2766)
- Cut two characters but only paste one. [\#2760](https://github.com/VSCodeVim/Vim/issues/2760)
- Paste with CTRL+V while in edit mode does not work [\#2706](https://github.com/VSCodeVim/Vim/issues/2706)
- Can't bind leader key shortcuts to some vscode methods [\#2674](https://github.com/VSCodeVim/Vim/issues/2674)
- Searching forward / backward ignores count [\#2664](https://github.com/VSCodeVim/Vim/issues/2664)

**Closed issues:**

- Yanking/deleting multiline into default register then pasting over other multiline text copies that overwritten multiline text, instead of retaining original yanked text. [\#2717](https://github.com/VSCodeVim/Vim/issues/2717)
- "S" \(capital s\) does not behave properly when on prefixing whitespace [\#2240](https://github.com/VSCodeVim/Vim/issues/2240)
- Bug: Can't navigate in autocompletion with "Ctrl+j" and "Ctrl+k". [\#1980](https://github.com/VSCodeVim/Vim/issues/1980)
- Backwards delete using "X" doesn't allow count prefixes [\#1780](https://github.com/VSCodeVim/Vim/issues/1780)

**Merged pull requests:**

- fixes \#2769 [\#2772](https://github.com/VSCodeVim/Vim/pull/2772) ([xconverge](https://github.com/xconverge))
- Fix \#2766. [\#2771](https://github.com/VSCodeVim/Vim/pull/2771) ([rebornix](https://github.com/rebornix))
- Update dependency prettier to v1.13.6 [\#2768](https://github.com/VSCodeVim/Vim/pull/2768) ([renovate-bot](https://github.com/renovate-bot))
- fixes \#2766 [\#2767](https://github.com/VSCodeVim/Vim/pull/2767) ([xconverge](https://github.com/xconverge))
- fixes \#1980 [\#2765](https://github.com/VSCodeVim/Vim/pull/2765) ([xconverge](https://github.com/xconverge))
- Fixes \#1780 [\#2764](https://github.com/VSCodeVim/Vim/pull/2764) ([xconverge](https://github.com/xconverge))
- fixes \#2664 and removes unused variable [\#2763](https://github.com/VSCodeVim/Vim/pull/2763) ([xconverge](https://github.com/xconverge))
- fixes \#2706 [\#2762](https://github.com/VSCodeVim/Vim/pull/2762) ([xconverge](https://github.com/xconverge))
- fixes \#2760 [\#2761](https://github.com/VSCodeVim/Vim/pull/2761) ([xconverge](https://github.com/xconverge))
- Move commandline to status bar to allow history navigation [\#2758](https://github.com/VSCodeVim/Vim/pull/2758) ([xconverge](https://github.com/xconverge))
- chore\(deps\): update dependency @types/mocha to v5.2.3 [\#2757](https://github.com/VSCodeVim/Vim/pull/2757) ([renovate-bot](https://github.com/renovate-bot))
- v0.13.1 [\#2753](https://github.com/VSCodeVim/Vim/pull/2753) ([jpoon](https://github.com/jpoon))

## [v0.13.1](https://github.com/vscodevim/vim/tree/v0.13.1) (2018-06-19)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.13.0...v0.13.1)

**Closed issues:**

- Remapping ESC in insert mode with CR or Space does work via settings [\#2584](https://github.com/VSCodeVim/Vim/issues/2584)

**Merged pull requests:**

- fix: closes \#1472. insertModeKeyBindings apply to insert and replace modes [\#2749](https://github.com/VSCodeVim/Vim/pull/2749) ([jpoon](https://github.com/jpoon))
- fix: closes \#2390. enables remapping using '\<enter\>' [\#2748](https://github.com/VSCodeVim/Vim/pull/2748) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency @types/lodash to v4.14.110 [\#2745](https://github.com/VSCodeVim/Vim/pull/2745) ([renovate-bot](https://github.com/renovate-bot))
- Update visualModeKeyBindingsNonRecursive example [\#2744](https://github.com/VSCodeVim/Vim/pull/2744) ([chibicode](https://github.com/chibicode))
- Fix \#1348. ctrl+D/U correct position [\#2723](https://github.com/VSCodeVim/Vim/pull/2723) ([rebornix](https://github.com/rebornix))

## [v0.13.0](https://github.com/vscodevim/vim/tree/v0.13.0) (2018-06-18)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.12.0...v0.13.0)

**Breaking changes:**

- Add normalModeKeyBindings and visualModeKeyBindings, remove otherModesKeyBindings [\#2726](https://github.com/VSCodeVim/Vim/pull/2726) ([chibicode](https://github.com/chibicode))

**Enhancements:**

- Allow remappings from mocked configurations during testing. [\#2732](https://github.com/VSCodeVim/Vim/issues/2732)
- use vscode task api [\#2731](https://github.com/VSCodeVim/Vim/issues/2731)
- Add visualModeKeyBindings, in addition to otherModesKeyBindings [\#2705](https://github.com/VSCodeVim/Vim/issues/2705)
- \[FEATURE REQUEST\] "q:" command [\#2617](https://github.com/VSCodeVim/Vim/issues/2617)
- How to make a keybinding only work in visual mode? [\#1805](https://github.com/VSCodeVim/Vim/issues/1805)
- Allow simplified keybinding syntax in settings.json [\#1667](https://github.com/VSCodeVim/Vim/issues/1667)

**Fixed Bugs:**

- gf creates files when the given file does not exist [\#2683](https://github.com/VSCodeVim/Vim/issues/2683)
- Change/Delete/Yank combined with next unmatched bracket/parenthesis not behaving correctly [\#2670](https://github.com/VSCodeVim/Vim/issues/2670)
- \[Bug report\]: 'c' key in multi-cursor mode removes additional cursors [\#2668](https://github.com/VSCodeVim/Vim/issues/2668)

**Closed issues:**

- Keybindings with Alt modifier. [\#2713](https://github.com/VSCodeVim/Vim/issues/2713)
- Commands cc and S do not respect indent level if executed before the first character [\#2497](https://github.com/VSCodeVim/Vim/issues/2497)
- Toggling Vim Mode using keybindings is broken [\#2381](https://github.com/VSCodeVim/Vim/issues/2381)
- Searching finds nothing when pasting from cmd [\#2362](https://github.com/VSCodeVim/Vim/issues/2362)
- Evil mode [\#2328](https://github.com/VSCodeVim/Vim/issues/2328)
- different key bindings for normal and visual mode [\#2205](https://github.com/VSCodeVim/Vim/issues/2205)
- need support for alt+x key mapping [\#2061](https://github.com/VSCodeVim/Vim/issues/2061)
- Keybindings with space don't seem to work [\#2039](https://github.com/VSCodeVim/Vim/issues/2039)
- \[Not Sure\] Copy using Windows Clipboard looses CR/LF [\#2022](https://github.com/VSCodeVim/Vim/issues/2022)
- "TypeError: Cannot read property 'isEqual' of undefined" while debugging an extension with vim enabled [\#2019](https://github.com/VSCodeVim/Vim/issues/2019)
- :m command doesn't work [\#2010](https://github.com/VSCodeVim/Vim/issues/2010)
- pane switching is broken in newest vscode-insiders [\#1973](https://github.com/VSCodeVim/Vim/issues/1973)
- \[Bug\] Copy text destroys special characters [\#1825](https://github.com/VSCodeVim/Vim/issues/1825)

**Merged pull requests:**

- fix: handle when commandLineHistory is empty [\#2741](https://github.com/VSCodeVim/Vim/pull/2741) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency @types/node to v9.6.22 [\#2739](https://github.com/VSCodeVim/Vim/pull/2739) ([renovate-bot](https://github.com/renovate-bot))
- fix: use explicit configuration for logginglevel [\#2738](https://github.com/VSCodeVim/Vim/pull/2738) ([jpoon](https://github.com/jpoon))
- fix: remove duplicate UT [\#2734](https://github.com/VSCodeVim/Vim/pull/2734) ([jpoon](https://github.com/jpoon))
- Don't ignore mocked configurations' remaps during testing. [\#2733](https://github.com/VSCodeVim/Vim/pull/2733) ([regiontog](https://github.com/regiontog))
- chore\(deps\): update dependency typescript to v2.9.2 [\#2730](https://github.com/VSCodeVim/Vim/pull/2730) ([renovate-bot](https://github.com/renovate-bot))
- Fix autoindent on cc/S \#2497 [\#2729](https://github.com/VSCodeVim/Vim/pull/2729) ([dqsully](https://github.com/dqsully))
- chore\(deps\): update dependency @types/mocha to v5.2.2 [\#2724](https://github.com/VSCodeVim/Vim/pull/2724) ([renovate-bot](https://github.com/renovate-bot))
- fix: revert our workaround cursor toggle as this has been fixed in vscode [\#2720](https://github.com/VSCodeVim/Vim/pull/2720) ([jpoon](https://github.com/jpoon))
- feat: use winston for logging [\#2719](https://github.com/VSCodeVim/Vim/pull/2719) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency prettier to v1.13.5 [\#2718](https://github.com/VSCodeVim/Vim/pull/2718) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency @types/node to v9.6.21 [\#2715](https://github.com/VSCodeVim/Vim/pull/2715) ([renovate-bot](https://github.com/renovate-bot))
- Update prettier dependency [\#2712](https://github.com/VSCodeVim/Vim/pull/2712) ([xconverge](https://github.com/xconverge))
- chore\(deps\): update dependency @types/mocha to v5.2.1 [\#2704](https://github.com/VSCodeVim/Vim/pull/2704) ([renovate-bot](https://github.com/renovate-bot))
- fix gf to be like issue \#2683 [\#2701](https://github.com/VSCodeVim/Vim/pull/2701) ([SuyogSoti](https://github.com/SuyogSoti))
- chore\(deps\): update dependency typescript to v2.9.1 [\#2698](https://github.com/VSCodeVim/Vim/pull/2698) ([renovate-bot](https://github.com/renovate-bot))
- Fix vim-commentary description in README [\#2694](https://github.com/VSCodeVim/Vim/pull/2694) ([Ran4](https://github.com/Ran4))
- chore\(deps\): update dependency @types/node to v9.6.20 [\#2691](https://github.com/VSCodeVim/Vim/pull/2691) ([renovate-bot](https://github.com/renovate-bot))
- fix: fix 'no-use-before-declare' requires type information lint warning [\#2679](https://github.com/VSCodeVim/Vim/pull/2679) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency gulp-git to v2.7.0 [\#2678](https://github.com/VSCodeVim/Vim/pull/2678) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency vscode to v1.1.18 [\#2676](https://github.com/VSCodeVim/Vim/pull/2676) ([renovate-bot](https://github.com/renovate-bot))
- Fixed difference in behavior for \]\) and \]} when combined with certain operators [\#2671](https://github.com/VSCodeVim/Vim/pull/2671) ([willcassella](https://github.com/willcassella))
- fix\(deps\): update dependency untildify to v3.0.3 [\#2669](https://github.com/VSCodeVim/Vim/pull/2669) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency mocha to v5.2.0 [\#2666](https://github.com/VSCodeVim/Vim/pull/2666) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency @types/node to v9.6.16 [\#2644](https://github.com/VSCodeVim/Vim/pull/2644) ([renovate-bot](https://github.com/renovate-bot))

## [v0.12.0](https://github.com/vscodevim/vim/tree/v0.12.0) (2018-05-16)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.11.6...v0.12.0)

- Fix development problems on win [\#2651](https://github.com/VSCodeVim/Vim/pull/2651) ([KamikazeZirou](https://github.com/KamikazeZirou))
- Fixes \#2632 [\#2641](https://github.com/VSCodeVim/Vim/pull/2641) ([xconverge](https://github.com/xconverge))
- Revert "\[Fix\] Restore 'when' conditions in \<C-v\>, \<C-j\>, \<C-k\>" [\#2640](https://github.com/VSCodeVim/Vim/pull/2640) ([jpoon](https://github.com/jpoon))
- fix\(deps\): update dependency diff-match-patch to v1.0.1 [\#2631](https://github.com/VSCodeVim/Vim/pull/2631) ([renovate-bot](https://github.com/renovate-bot))
- Update dependency @types/node to v9.6.14 [\#2630](https://github.com/VSCodeVim/Vim/pull/2630) ([renovate-bot](https://github.com/renovate-bot))
- \[Fix\] Restore 'when' conditions in \<C-v\>, \<C-j\>, \<C-k\> [\#2628](https://github.com/VSCodeVim/Vim/pull/2628) ([tyru](https://github.com/tyru))
- Link to Linux setup [\#2627](https://github.com/VSCodeVim/Vim/pull/2627) ([gggauravgandhi](https://github.com/gggauravgandhi))
- fix: immediately exit travis on build error [\#2626](https://github.com/VSCodeVim/Vim/pull/2626) ([jpoon](https://github.com/jpoon))
- fix: immediately exit if there is an error on ts [\#2625](https://github.com/VSCodeVim/Vim/pull/2625) ([jpoon](https://github.com/jpoon))
- feat: log to outputChannel [\#2623](https://github.com/VSCodeVim/Vim/pull/2623) ([jpoon](https://github.com/jpoon))
- Implement "q:" command [\#2618](https://github.com/VSCodeVim/Vim/pull/2618) ([KamikazeZirou](https://github.com/KamikazeZirou))

## [v0.11.6](https://github.com/vscodevim/vim/tree/v0.11.6) (2018-05-07)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.11.5...v0.11.6)

- chore\(deps\): update dependency @types/node to v9.6.12 [\#2615](https://github.com/VSCodeVim/Vim/pull/2615) ([renovate-bot](https://github.com/renovate-bot))
- \[Fix\] \* command highlights extra content [\#2611](https://github.com/VSCodeVim/Vim/pull/2611) ([tyru](https://github.com/tyru))
- \[Fix\] p in visual line appends unnecessary newline [\#2609](https://github.com/VSCodeVim/Vim/pull/2609) ([tyru](https://github.com/tyru))
- chore\(deps\): update dependency tslint to v5.10.0 [\#2605](https://github.com/VSCodeVim/Vim/pull/2605) ([renovate-bot](https://github.com/renovate-bot))
- Add o command in visual block mode [\#2604](https://github.com/VSCodeVim/Vim/pull/2604) ([tyru](https://github.com/tyru))
- \[Fix\] p in visual-mode should update register content [\#2602](https://github.com/VSCodeVim/Vim/pull/2602) ([tyru](https://github.com/tyru))
- \[Fix\] p won't work in linewise visual-mode at the end of document [\#2601](https://github.com/VSCodeVim/Vim/pull/2601) ([tyru](https://github.com/tyru))
- Add missing window keys \(\<C-w\>\<C-\[hjklovq\]\>\) [\#2600](https://github.com/VSCodeVim/Vim/pull/2600) ([tyru](https://github.com/tyru))
- fix: fail on ts transpile errors by setting noEmitOnErrors [\#2599](https://github.com/VSCodeVim/Vim/pull/2599) ([jpoon](https://github.com/jpoon))
- add easymotion-lineforward and easymotion-linebackward [\#2596](https://github.com/VSCodeVim/Vim/pull/2596) ([hy950831](https://github.com/hy950831))
- Fix description in 🔢 % command [\#2595](https://github.com/VSCodeVim/Vim/pull/2595) ([Ding-Fan](https://github.com/Ding-Fan))
- \[Fix\] \<C-h\> should work as same as \<BS\> in search mode [\#2593](https://github.com/VSCodeVim/Vim/pull/2593) ([tyru](https://github.com/tyru))
- \[Fix\] aW doesn't work at the end of lines [\#2591](https://github.com/VSCodeVim/Vim/pull/2591) ([tyru](https://github.com/tyru))
- Implement gn,gN command [\#2589](https://github.com/VSCodeVim/Vim/pull/2589) ([tyru](https://github.com/tyru))
- \[Fix\] p in visual-mode should save last selection [\#2588](https://github.com/VSCodeVim/Vim/pull/2588) ([tyru](https://github.com/tyru))
- \[Fix\] Transition between v,V,\<C-v\> is different with original Vim behavior [\#2581](https://github.com/VSCodeVim/Vim/pull/2581) ([tyru](https://github.com/tyru))
- \[Fix\] Don't add beginning newline of linewise put in visual-mode [\#2579](https://github.com/VSCodeVim/Vim/pull/2579) ([tyru](https://github.com/tyru))
- fix: Manually dispose ModeHandler when no longer needed [\#2577](https://github.com/VSCodeVim/Vim/pull/2577) ([BinaryKhaos](https://github.com/BinaryKhaos))
- chore\(deps\): update dependency vscode to v1.1.16 [\#2575](https://github.com/VSCodeVim/Vim/pull/2575) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency @types/node to v9.6.7 [\#2573](https://github.com/VSCodeVim/Vim/pull/2573) ([renovate-bot](https://github.com/renovate-bot))
- Fixes \#2569. Fix vi{ for nested braces. [\#2572](https://github.com/VSCodeVim/Vim/pull/2572) ([Shadaraman](https://github.com/Shadaraman))
- Fixed neovim spawning in invalid directories [\#2570](https://github.com/VSCodeVim/Vim/pull/2570) ([Chillee](https://github.com/Chillee))
- chore\(deps\): update dependency @types/lodash to v4.14.108 [\#2565](https://github.com/VSCodeVim/Vim/pull/2565) ([renovate-bot](https://github.com/renovate-bot))
- Hopefully fixing the rest of our undo issues [\#2559](https://github.com/VSCodeVim/Vim/pull/2559) ([Chillee](https://github.com/Chillee))

## [v0.11.5](https://github.com/vscodevim/vim/tree/v0.11.5) (2018-04-23)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.11.4...v0.11.5)

- chore\(deps\): update dependency gulp-bump to v3.1.1 [\#2556](https://github.com/VSCodeVim/Vim/pull/2556) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency typescript to v2.8.3 [\#2553](https://github.com/VSCodeVim/Vim/pull/2553) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency @types/node to v9.6.6 [\#2551](https://github.com/VSCodeVim/Vim/pull/2551) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency @types/mocha to v5.2.0 [\#2550](https://github.com/VSCodeVim/Vim/pull/2550) ([renovate-bot](https://github.com/renovate-bot))
- Fixed undo issue given in \#2545 [\#2547](https://github.com/VSCodeVim/Vim/pull/2547) ([Chillee](https://github.com/Chillee))
- chore\(deps\): update dependency mocha to v5.1.1 [\#2546](https://github.com/VSCodeVim/Vim/pull/2546) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency prettier to v1.12.1 [\#2543](https://github.com/VSCodeVim/Vim/pull/2543) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency @types/lodash to v4.14.107 [\#2540](https://github.com/VSCodeVim/Vim/pull/2540) ([renovate-bot](https://github.com/renovate-bot))

## [v0.11.4](https://github.com/vscodevim/vim/tree/v0.11.4) (2018-04-14)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.11.3...v0.11.4)

- fix: don't call prettier when no files updated [\#2539](https://github.com/VSCodeVim/Vim/pull/2539) ([jpoon](https://github.com/jpoon))
- chore\(dep\): upgrade gulp-bump, gulp-git, gulp-typescript, prettier, typescript, vscode [\#2538](https://github.com/VSCodeVim/Vim/pull/2538) ([jpoon](https://github.com/jpoon))
- chore\(deps\): update dependency @types/node to v9.6.5 [\#2535](https://github.com/VSCodeVim/Vim/pull/2535) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency mocha to v5.1.0 [\#2534](https://github.com/VSCodeVim/Vim/pull/2534) ([renovate-bot](https://github.com/renovate-bot))
- docs: update readme to indicate restart of vscode needed [\#2530](https://github.com/VSCodeVim/Vim/pull/2530) ([jdhines](https://github.com/jdhines))
- chore\(deps\): update dependency @types/node to v9.6.4 [\#2528](https://github.com/VSCodeVim/Vim/pull/2528) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency @types/diff to v3.5.1 [\#2527](https://github.com/VSCodeVim/Vim/pull/2527) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency @types/diff to v3.5.0 [\#2523](https://github.com/VSCodeVim/Vim/pull/2523) ([renovate-bot](https://github.com/renovate-bot))
- bug: Neovim not spawned in appropriate directory \(fixes \#2482\) [\#2522](https://github.com/VSCodeVim/Vim/pull/2522) ([Chillee](https://github.com/Chillee))
- bug: fixes behaviour of search when using \* and \# \(fixes \#2517\) [\#2518](https://github.com/VSCodeVim/Vim/pull/2518) ([clamb](https://github.com/clamb))
- chore\(deps\): update dependency @types/node to v9.6.2 [\#2509](https://github.com/VSCodeVim/Vim/pull/2509) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update node docker tag to v8.11 [\#2496](https://github.com/VSCodeVim/Vim/pull/2496) ([renovate-bot](https://github.com/renovate-bot))
- chore\(deps\): update dependency mocha to v5.0.5 [\#2490](https://github.com/VSCodeVim/Vim/pull/2490) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency gulp-tslint to v8.1.3 [\#2489](https://github.com/VSCodeVim/Vim/pull/2489) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): update dependency @types/lodash to v4.14.106 [\#2485](https://github.com/VSCodeVim/Vim/pull/2485) ([renovate[bot]](https://github.com/apps/renovate))
- chore\(deps\): pin dependencies [\#2483](https://github.com/VSCodeVim/Vim/pull/2483) ([renovate[bot]](https://github.com/apps/renovate))
- Configure Renovate [\#2480](https://github.com/VSCodeVim/Vim/pull/2480) ([renovate[bot]](https://github.com/apps/renovate))
- Add jumptoanywhere command for easymotion [\#2454](https://github.com/VSCodeVim/Vim/pull/2454) ([jsonMartin](https://github.com/jsonMartin))

## [v0.11.3](https://github.com/vscodevim/vim/tree/v0.11.3) (2018-03-29)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.11.2...v0.11.3)

- docs: add documentation for installing xsel. fixes \#2071 [\#2476](https://github.com/VSCodeVim/Vim/pull/2476) ([jpoon](https://github.com/jpoon))
- Respect vim.visualstar configuration \(fixes \#2469\) [\#2470](https://github.com/VSCodeVim/Vim/pull/2470) ([ytang](https://github.com/ytang))
- feat: Added \<C-w\>= keybind [\#2453](https://github.com/VSCodeVim/Vim/pull/2453) ([844196](https://github.com/844196))
- neovim.ts: typo in log [\#2451](https://github.com/VSCodeVim/Vim/pull/2451) ([prakashdanish](https://github.com/prakashdanish))
- await openEditorAtIndex1 command [\#2442](https://github.com/VSCodeVim/Vim/pull/2442) ([arussellk](https://github.com/arussellk))

## [v0.11.2](https://github.com/vscodevim/vim/tree/v0.11.2) (2018-03-09)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.11.1...v0.11.2)

- Readds vimState.lastClickWasPastEOL. Fixes \#2404 [\#2433](https://github.com/VSCodeVim/Vim/pull/2433) ([Chillee](https://github.com/Chillee))
- fix: selection in search in visual mode \#2406 [\#2418](https://github.com/VSCodeVim/Vim/pull/2418) ([shortheron](https://github.com/shortheron))

## [v0.11.1](https://github.com/vscodevim/vim/tree/v0.11.1) (2018-03-08)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.11.0...v0.11.1)

- Set the timeout to 0 for waitforcursorupdatestopropagate [\#2428](https://github.com/VSCodeVim/Vim/pull/2428) ([Chillee](https://github.com/Chillee))
- fix: use 'fsPath'. closes \#2422 [\#2426](https://github.com/VSCodeVim/Vim/pull/2426) ([jpoon](https://github.com/jpoon))
- fix: don't overwrite file if file exists. fixes \#2408 [\#2409](https://github.com/VSCodeVim/Vim/pull/2409) ([jpoon](https://github.com/jpoon))
- Fix :tabm to use moveActiveEditor command [\#2405](https://github.com/VSCodeVim/Vim/pull/2405) ([arussellk](https://github.com/arussellk))

## [v0.11.0](https://github.com/vscodevim/vim/tree/v0.11.0) (2018-02-26)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.13...v0.11.0)

- Fix :tabe {file} only relative to current file \(\#1162\) [\#2400](https://github.com/VSCodeVim/Vim/pull/2400) ([arussellk](https://github.com/arussellk))
- fix: clean-up neovim processes. closes \#2038 [\#2395](https://github.com/VSCodeVim/Vim/pull/2395) ([jpoon](https://github.com/jpoon))
- refactor: no need to set current mode twice [\#2394](https://github.com/VSCodeVim/Vim/pull/2394) ([jpoon](https://github.com/jpoon))
- feat: create file if file does not exist. closes \#2274 [\#2392](https://github.com/VSCodeVim/Vim/pull/2392) ([jpoon](https://github.com/jpoon))
- fix: status bar when configuration.showcmd is set \(fixes \#2365\) [\#2386](https://github.com/VSCodeVim/Vim/pull/2386) ([jpoon](https://github.com/jpoon))
- `jj` cursor position fix for \#1418 [\#2366](https://github.com/VSCodeVim/Vim/pull/2366) ([prog666](https://github.com/prog666))
- fix: actually run prettier [\#2359](https://github.com/VSCodeVim/Vim/pull/2359) ([jpoon](https://github.com/jpoon))
- feat: implements usage of `insert` to toggle between modes \(as per \#1787\) [\#2356](https://github.com/VSCodeVim/Vim/pull/2356) ([jpoon](https://github.com/jpoon))
- Build Improvements [\#2351](https://github.com/VSCodeVim/Vim/pull/2351) ([jpoon](https://github.com/jpoon))
- Possibility to set statusBar foreground color [\#2350](https://github.com/VSCodeVim/Vim/pull/2350) ([mgor](https://github.com/mgor))
- Fixes \#2346 [\#2347](https://github.com/VSCodeVim/Vim/pull/2347) ([Chillee](https://github.com/Chillee))
- Improve Test Infrastructure [\#2335](https://github.com/VSCodeVim/Vim/pull/2335) ([jpoon](https://github.com/jpoon))
- fix typo in README [\#2327](https://github.com/VSCodeVim/Vim/pull/2327) ([hayley](https://github.com/hayley))
- Sneak plugin [\#2307](https://github.com/VSCodeVim/Vim/pull/2307) ([jpotterm](https://github.com/jpotterm))

## [v0.10.13](https://github.com/vscodevim/vim/tree/v0.10.13) (2018-01-23)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.12...v0.10.13)

- fix: bad jason. fix bad release. [\#2324](https://github.com/VSCodeVim/Vim/pull/2324) ([jpoon](https://github.com/jpoon))

## [v0.10.12](https://github.com/vscodevim/vim/tree/v0.10.12) (2018-01-23)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.11...v0.10.12)

- fix: closes \#730. setcontext when switching active text editors [\#2320](https://github.com/VSCodeVim/Vim/pull/2320) ([jpoon](https://github.com/jpoon))
- Update README for Mac key repeat [\#2316](https://github.com/VSCodeVim/Vim/pull/2316) ([puradox](https://github.com/puradox))
- Default to vim behaviour for Ctrl+D [\#2314](https://github.com/VSCodeVim/Vim/pull/2314) ([Graham42](https://github.com/Graham42))
- Left shift fix 2299 [\#2300](https://github.com/VSCodeVim/Vim/pull/2300) ([jessewmc](https://github.com/jessewmc))

## [v0.10.11](https://github.com/vscodevim/vim/tree/v0.10.11) (2018-01-18)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.10...v0.10.11)

- fix: status bar not updating properly when recording macros. fixes \#2296. [\#2304](https://github.com/VSCodeVim/Vim/pull/2304) ([jpoon](https://github.com/jpoon))

## [v0.10.10](https://github.com/vscodevim/vim/tree/v0.10.10) (2018-01-16)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.9...v0.10.10)

- fix: add tests for compareKeyPressSequence [\#2289](https://github.com/VSCodeVim/Vim/pull/2289) ([jpoon](https://github.com/jpoon))
- Fix BaseAction.couldActionApply to work with two-dimensional keys array [\#2288](https://github.com/VSCodeVim/Vim/pull/2288) ([jpotterm](https://github.com/jpotterm))
- refactor: move modehandlermap to own class [\#2285](https://github.com/VSCodeVim/Vim/pull/2285) ([jpoon](https://github.com/jpoon))
- fix: status bar not updating following toggle [\#2283](https://github.com/VSCodeVim/Vim/pull/2283) ([jpoon](https://github.com/jpoon))
- Fix: Warnings when retrieving configurations w/o resource [\#2282](https://github.com/VSCodeVim/Vim/pull/2282) ([jpoon](https://github.com/jpoon))
- fix: \<C-d\> remapping disabled by default. functionality controlled by "handleKeys" [\#2269](https://github.com/VSCodeVim/Vim/pull/2269) ([Arxzin](https://github.com/Arxzin))

## [v0.10.9](https://github.com/vscodevim/vim/tree/v0.10.9) (2018-01-11)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.8...v0.10.9)

- feature: "h", "l" keybindings for sidebar [\#2290](https://github.com/VSCodeVim/Vim/pull/2290) ([Nodman](https://github.com/Nodman))
- fix: no need to change cursor if there is no active editor. closes \#2273 [\#2278](https://github.com/VSCodeVim/Vim/pull/2278) ([jpoon](https://github.com/jpoon))
- fix: fixes circular dependency between notation and configuration [\#2277](https://github.com/VSCodeVim/Vim/pull/2277) ([jpoon](https://github.com/jpoon))
- fix: show cmd-line errors in status bar. add new E492 error [\#2272](https://github.com/VSCodeVim/Vim/pull/2272) ([jpoon](https://github.com/jpoon))
- refactor: normalize keys when loading configuration [\#2268](https://github.com/VSCodeVim/Vim/pull/2268) ([jpoon](https://github.com/jpoon))

## [v0.10.8](https://github.com/vscodevim/vim/tree/v0.10.8) (2018-01-05)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.7...v0.10.8)

- fix\(2162\): handleKeys was previously only handling negation [\#2267](https://github.com/VSCodeVim/Vim/pull/2267) ([jpoon](https://github.com/jpoon))
- fix\(2264\): go-to-line [\#2266](https://github.com/VSCodeVim/Vim/pull/2266) ([jpoon](https://github.com/jpoon))
- fix\(2261\): change status bar text for search-in-progress to be more l… [\#2263](https://github.com/VSCodeVim/Vim/pull/2263) ([jpoon](https://github.com/jpoon))
- fix\(2261\): fix regression. show search string in status bar [\#2262](https://github.com/VSCodeVim/Vim/pull/2262) ([jpoon](https://github.com/jpoon))

## [v0.10.7](https://github.com/vscodevim/vim/tree/v0.10.7) (2018-01-04)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.6...v0.10.7)

- Stop Silently Failing [\#2250](https://github.com/VSCodeVim/Vim/pull/2250) ([jpoon](https://github.com/jpoon))
- Misc Bug Fixes and Refactoring [\#2243](https://github.com/VSCodeVim/Vim/pull/2243) ([jpoon](https://github.com/jpoon))
- fix\(2184\): handle situation when no document is opened [\#2237](https://github.com/VSCodeVim/Vim/pull/2237) ([jpoon](https://github.com/jpoon))

## [v0.10.6](https://github.com/vscodevim/vim/tree/v0.10.6) (2017-12-15)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.5...v0.10.6)

- update\(package.json\) [\#2225](https://github.com/VSCodeVim/Vim/pull/2225) ([jpoon](https://github.com/jpoon))
- Add C-\[ to Replace Mode escape [\#2223](https://github.com/VSCodeVim/Vim/pull/2223) ([deybhayden](https://github.com/deybhayden))
- Do not open open file dialog when calling `:e!` [\#2215](https://github.com/VSCodeVim/Vim/pull/2215) ([squgeim](https://github.com/squgeim))
- Update `list.\*` command keybindings [\#2213](https://github.com/VSCodeVim/Vim/pull/2213) ([joaomoreno](https://github.com/joaomoreno))
- moar clean-up [\#2208](https://github.com/VSCodeVim/Vim/pull/2208) ([jpoon](https://github.com/jpoon))
- Fix cursor position of \<C-o\> command in insertmode [\#2206](https://github.com/VSCodeVim/Vim/pull/2206) ([hy950831](https://github.com/hy950831))
- refactor\(modehandler-updateview\): use map and remove unused context [\#2197](https://github.com/VSCodeVim/Vim/pull/2197) ([jpoon](https://github.com/jpoon))
- Integrate TravisBuddy [\#2191](https://github.com/VSCodeVim/Vim/pull/2191) ([bluzi](https://github.com/bluzi))
- Fix \#2168: Surround offset [\#2171](https://github.com/VSCodeVim/Vim/pull/2171) ([westim](https://github.com/westim))
- Fix \#1945 \$ in VisualBlock works on ragged lines [\#2096](https://github.com/VSCodeVim/Vim/pull/2096) ([Strafos](https://github.com/Strafos))

## [v0.10.5](https://github.com/vscodevim/vim/tree/v0.10.5) (2017-11-21)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.4...v0.10.5)

- Fixed incorrect styling of 'fake' cursors [\#2161](https://github.com/VSCodeVim/Vim/pull/2161) ([Chillee](https://github.com/Chillee))
- Fix \#2155, Fix \#2133: escape delimiter substitute [\#2159](https://github.com/VSCodeVim/Vim/pull/2159) ([westim](https://github.com/westim))
- Fix \#2148: vertical split command [\#2158](https://github.com/VSCodeVim/Vim/pull/2158) ([westim](https://github.com/westim))
- fix\(1673\): re-enable some tests [\#2152](https://github.com/VSCodeVim/Vim/pull/2152) ([jpoon](https://github.com/jpoon))
- keep workbench color customizations when using status bar color [\#2122](https://github.com/VSCodeVim/Vim/pull/2122) ([rodrigo-garcia-leon](https://github.com/rodrigo-garcia-leon))

## [v0.10.4](https://github.com/vscodevim/vim/tree/v0.10.4) (2017-11-14)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.3...v0.10.4)

- fix\(2145\): reverse logic [\#2147](https://github.com/VSCodeVim/Vim/pull/2147) ([jpoon](https://github.com/jpoon))

## [v0.10.3](https://github.com/vscodevim/vim/tree/v0.10.3) (2017-11-13)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.2...v0.10.3)

- Fix release [\#2142](https://github.com/VSCodeVim/Vim/pull/2142) ([jpoon](https://github.com/jpoon))
- Code Cleanup [\#2138](https://github.com/VSCodeVim/Vim/pull/2138) ([jpoon](https://github.com/jpoon))
- Fixed typo in README [\#2137](https://github.com/VSCodeVim/Vim/pull/2137) ([Nonoctis](https://github.com/Nonoctis))
- fix\(travis\): use lts/carbon \(v8.9.1\) for travis [\#2129](https://github.com/VSCodeVim/Vim/pull/2129) ([jpoon](https://github.com/jpoon))
- Fix ^, \$, add case sensitivity override in search [\#2123](https://github.com/VSCodeVim/Vim/pull/2123) ([parkovski](https://github.com/parkovski))
- fix vscode launch/tasks [\#2121](https://github.com/VSCodeVim/Vim/pull/2121) ([jpoon](https://github.com/jpoon))
- Fix remapping keys to actions with "mustBeFirstKey", fixes \#2216 [\#2117](https://github.com/VSCodeVim/Vim/pull/2117) ([ohjames](https://github.com/ohjames))
- Fixes \#2113: Start in Disabled mode configuration. [\#2115](https://github.com/VSCodeVim/Vim/pull/2115) ([westim](https://github.com/westim))
- fix\(line-endings\): change all files to lf [\#2111](https://github.com/VSCodeVim/Vim/pull/2111) ([jpoon](https://github.com/jpoon))
- fix\(build\): position does not exist for replacetexttransformation [\#2105](https://github.com/VSCodeVim/Vim/pull/2105) ([jpoon](https://github.com/jpoon))
- Use 'editor.unfold' with direction: 'down' [\#2104](https://github.com/VSCodeVim/Vim/pull/2104) ([aeschli](https://github.com/aeschli))
- Pesky penguin CHANGELOG.md update. [\#2091](https://github.com/VSCodeVim/Vim/pull/2091) ([westim](https://github.com/westim))
- Added unit tests for movement commands. [\#2088](https://github.com/VSCodeVim/Vim/pull/2088) ([westim](https://github.com/westim))
- Fix \#2080 [\#2087](https://github.com/VSCodeVim/Vim/pull/2087) ([Strafos](https://github.com/Strafos))
- Update Contributors [\#2083](https://github.com/VSCodeVim/Vim/pull/2083) ([mcsosa121](https://github.com/mcsosa121))
- Fixes \#1974: U command [\#2081](https://github.com/VSCodeVim/Vim/pull/2081) ([westim](https://github.com/westim))
- Fix \#2063 [\#2079](https://github.com/VSCodeVim/Vim/pull/2079) ([Strafos](https://github.com/Strafos))
- Fix \#1852 surround issue at end of line [\#2077](https://github.com/VSCodeVim/Vim/pull/2077) ([Strafos](https://github.com/Strafos))
- added `showOpenDialog` when typing emtpy e [\#2067](https://github.com/VSCodeVim/Vim/pull/2067) ([DanEEStar](https://github.com/DanEEStar))
- Fix gj/gk in visual block mode [\#2046](https://github.com/VSCodeVim/Vim/pull/2046) ([orn688](https://github.com/orn688))

## [v0.10.2](https://github.com/vscodevim/vim/tree/v0.10.2) (2017-10-14)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.1...v0.10.2)

- Update ROADMAP.md [\#2073](https://github.com/VSCodeVim/Vim/pull/2073) ([xconverge](https://github.com/xconverge))
- Change ignoreFocusOut to false for the command line [\#2072](https://github.com/VSCodeVim/Vim/pull/2072) ([gadkadosh](https://github.com/gadkadosh))
- Upgrade packages [\#2070](https://github.com/VSCodeVim/Vim/pull/2070) ([jpoon](https://github.com/jpoon))
- fixes \#1576 and showcmd configuration option [\#2069](https://github.com/VSCodeVim/Vim/pull/2069) ([xconverge](https://github.com/xconverge))
- removed code which is not needed anymore due to \#2062 [\#2065](https://github.com/VSCodeVim/Vim/pull/2065) ([DanEEStar](https://github.com/DanEEStar))
- An option to show the colon at the start of the command line box [\#2064](https://github.com/VSCodeVim/Vim/pull/2064) ([gadkadosh](https://github.com/gadkadosh))
- Bugfix \#1951: text selection in insert mode [\#2062](https://github.com/VSCodeVim/Vim/pull/2062) ([DanEEStar](https://github.com/DanEEStar))
- Dispose modehandler if NO documents match the modehandler document anymore [\#2058](https://github.com/VSCodeVim/Vim/pull/2058) ([xconverge](https://github.com/xconverge))
- Fixes \#2050 Allow custom cursor styles per mode [\#2054](https://github.com/VSCodeVim/Vim/pull/2054) ([xconverge](https://github.com/xconverge))
- Fixes \#1824: g; and g, commands. [\#2040](https://github.com/VSCodeVim/Vim/pull/2040) ([westim](https://github.com/westim))
- Fixes \#1248: support for '., `., and gi commands. [\#2037](https://github.com/VSCodeVim/Vim/pull/2037) ([westim](https://github.com/westim))
- Fix for issue \#1860, visual multicursor movement. [\#2036](https://github.com/VSCodeVim/Vim/pull/2036) ([westim](https://github.com/westim))
- Fix a typo [\#2028](https://github.com/VSCodeVim/Vim/pull/2028) ([joonro](https://github.com/joonro))

## [v0.10.1](https://github.com/vscodevim/vim/tree/v0.10.1) (2017-09-16)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.10.0...v0.10.1)

- Fixing travis issues [\#2024](https://github.com/VSCodeVim/Vim/pull/2024) ([Chillee](https://github.com/Chillee))
- Correct behavior of mouseSelectionGoesIntoVisualMode [\#2020](https://github.com/VSCodeVim/Vim/pull/2020) ([nguymin4](https://github.com/nguymin4))
- Easymotion improvements [\#2017](https://github.com/VSCodeVim/Vim/pull/2017) ([MaxfieldWalker](https://github.com/MaxfieldWalker))
- fix \#2009 [\#2012](https://github.com/VSCodeVim/Vim/pull/2012) ([MaxfieldWalker](https://github.com/MaxfieldWalker))
- Fix deref of undefined race on startup. [\#2002](https://github.com/VSCodeVim/Vim/pull/2002) ([brandonbloom](https://github.com/brandonbloom))
- Use Go To Def & history absent a tag stack. [\#2001](https://github.com/VSCodeVim/Vim/pull/2001) ([brandonbloom](https://github.com/brandonbloom))
- Fix\#1981 [\#1997](https://github.com/VSCodeVim/Vim/pull/1997) ([MaxfieldWalker](https://github.com/MaxfieldWalker))
- Improvements to paragraph text objects. [\#1996](https://github.com/VSCodeVim/Vim/pull/1996) ([brandonbloom](https://github.com/brandonbloom))
- Implement '' and ``. [\#1993](https://github.com/VSCodeVim/Vim/pull/1993) ([brandonbloom](https://github.com/brandonbloom))

## [v0.10.0](https://github.com/vscodevim/vim/tree/v0.10.0) (2017-08-30)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.9.0...v0.10.0)

- Make prettier work on Windows [\#1987](https://github.com/VSCodeVim/Vim/pull/1987) ([MaxfieldWalker](https://github.com/MaxfieldWalker))
- Remove flaky tests [\#1982](https://github.com/VSCodeVim/Vim/pull/1982) ([Chillee](https://github.com/Chillee))
- Fixed iW on beginning of word \(\#1935\) [\#1977](https://github.com/VSCodeVim/Vim/pull/1977) ([Ghust1995](https://github.com/Ghust1995))
- Easymotion new features [\#1967](https://github.com/VSCodeVim/Vim/pull/1967) ([MaxfieldWalker](https://github.com/MaxfieldWalker))
- Trying to fix the travis issues with neovim [\#1958](https://github.com/VSCodeVim/Vim/pull/1958) ([Chillee](https://github.com/Chillee))
- Fixes \#1941: Action repetition with Ctrl-\[ [\#1953](https://github.com/VSCodeVim/Vim/pull/1953) ([tagniam](https://github.com/tagniam))
- Fixes \#1950: counter for \$ [\#1952](https://github.com/VSCodeVim/Vim/pull/1952) ([tagniam](https://github.com/tagniam))
- Makes all tests pass on Windows [\#1939](https://github.com/VSCodeVim/Vim/pull/1939) ([philipmat](https://github.com/philipmat))
- Update tests due to VSCode PR 28238 [\#1926](https://github.com/VSCodeVim/Vim/pull/1926) ([philipmat](https://github.com/philipmat))
- fix `z O` unfoldRecursively [\#1924](https://github.com/VSCodeVim/Vim/pull/1924) ([VincentBel](https://github.com/VincentBel))
- Renamed test to reflect purpose [\#1913](https://github.com/VSCodeVim/Vim/pull/1913) ([philipmat](https://github.com/philipmat))
- Ctrl-C should copy to clipboard in visual mode - fix for \#1896 [\#1912](https://github.com/VSCodeVim/Vim/pull/1912) ([philipmat](https://github.com/philipmat))
- Substitute global flag \(like Vim's `gdefault`\) [\#1909](https://github.com/VSCodeVim/Vim/pull/1909) ([philipmat](https://github.com/philipmat))
- Fixes \#1871: Adds configuration option to go into visual mode upon clicking in insert mode [\#1898](https://github.com/VSCodeVim/Vim/pull/1898) ([Chillee](https://github.com/Chillee))
- Fixes \#1886: indent repeat doesn't work in visual mode [\#1890](https://github.com/VSCodeVim/Vim/pull/1890) ([Chillee](https://github.com/Chillee))
- Formattted everything with prettier [\#1879](https://github.com/VSCodeVim/Vim/pull/1879) ([Chillee](https://github.com/Chillee))

## [v0.9.0](https://github.com/vscodevim/vim/tree/v0.9.0) (2017-06-24)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.8.7...v0.9.0)

- fixes \#1861 [\#1868](https://github.com/VSCodeVim/Vim/pull/1868) ([xconverge](https://github.com/xconverge))
- Fix off by one error in visual mode [\#1862](https://github.com/VSCodeVim/Vim/pull/1862) ([Chillee](https://github.com/Chillee))

## [v0.8.7](https://github.com/vscodevim/vim/tree/v0.8.7) (2017-06-23)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.8.6...v0.8.7)

- Added :only command and corresponding shortcuts [\#1882](https://github.com/VSCodeVim/Vim/pull/1882) ([LeonB](https://github.com/LeonB))
- Select in visual mode when scrolling [\#1859](https://github.com/VSCodeVim/Vim/pull/1859) ([Chillee](https://github.com/Chillee))
- Fixes \#1857: P not creating an undo stop [\#1858](https://github.com/VSCodeVim/Vim/pull/1858) ([Chillee](https://github.com/Chillee))
- Fixes \#979: Adds q! to close without saving [\#1854](https://github.com/VSCodeVim/Vim/pull/1854) ([Chillee](https://github.com/Chillee))
- Update README.md \(minor\) [\#1851](https://github.com/VSCodeVim/Vim/pull/1851) ([BlueDrink9](https://github.com/BlueDrink9))
- fixes \#1843 A and I preceded by count [\#1846](https://github.com/VSCodeVim/Vim/pull/1846) ([xconverge](https://github.com/xconverge))
- WIP Fixes \#754: Adds j,k,o,\<Enter\>, gg, G, ctrl+d, and ctrl+u commands for navigating inside the file explorer [\#1718](https://github.com/VSCodeVim/Vim/pull/1718) ([Chillee](https://github.com/Chillee))

## [v0.8.6](https://github.com/vscodevim/vim/tree/v0.8.6) (2017-06-15)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.8.5...v0.8.6)

- Removed solid block cursor [\#1842](https://github.com/VSCodeVim/Vim/pull/1842) ([Chillee](https://github.com/Chillee))
- Fix yiw cursor pos [\#1837](https://github.com/VSCodeVim/Vim/pull/1837) ([xconverge](https://github.com/xconverge))
- Fixes \#1794: Undo not undoing all changes [\#1833](https://github.com/VSCodeVim/Vim/pull/1833) ([Chillee](https://github.com/Chillee))
- Fixes \#1827: Autocomplete fails when any lines are wrapped/folded [\#1832](https://github.com/VSCodeVim/Vim/pull/1832) ([Chillee](https://github.com/Chillee))
- Fixes \#1826: Jump to line with neovim disabled doesn't work [\#1831](https://github.com/VSCodeVim/Vim/pull/1831) ([Chillee](https://github.com/Chillee))

## [v0.8.5](https://github.com/vscodevim/vim/tree/v0.8.5) (2017-06-11)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.8.4...v0.8.5)

- Fixes \#1814: Undo history getting deleted when file changes [\#1820](https://github.com/VSCodeVim/Vim/pull/1820) ([Chillee](https://github.com/Chillee))
- Fixes \#1200: :e doesn't expand tildes [\#1819](https://github.com/VSCodeVim/Vim/pull/1819) ([Chillee](https://github.com/Chillee))
- Fixes \#1786: Adds relative line ranges [\#1810](https://github.com/VSCodeVim/Vim/pull/1810) ([Chillee](https://github.com/Chillee))
- Fixed \#1803: zc automatically reopens folds if the fold is performed in the middle. [\#1809](https://github.com/VSCodeVim/Vim/pull/1809) ([Chillee](https://github.com/Chillee))
- Vertical split shortcut keys [\#1795](https://github.com/VSCodeVim/Vim/pull/1795) ([beefsack](https://github.com/beefsack))

## [v0.8.4](https://github.com/vscodevim/vim/tree/v0.8.4) (2017-05-29)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.8.3...v0.8.4)

- Fixes \#1743: Fixed pasting over visual mode with named register overwriting the named register [\#1777](https://github.com/VSCodeVim/Vim/pull/1777) ([Chillee](https://github.com/Chillee))
- Fixes \#1760: Deindenting not working properly with neovim ex-commands [\#1770](https://github.com/VSCodeVim/Vim/pull/1770) ([Chillee](https://github.com/Chillee))
- Fixes \#1768: Backspace deletes more than one tab when tabs are mandated by language specific settings [\#1769](https://github.com/VSCodeVim/Vim/pull/1769) ([Chillee](https://github.com/Chillee))
- More v8 patches [\#1766](https://github.com/VSCodeVim/Vim/pull/1766) ([Chillee](https://github.com/Chillee))
- fixed \#1027 maybe? [\#1740](https://github.com/VSCodeVim/Vim/pull/1740) ([Chillee](https://github.com/Chillee))

## [v0.8.3](https://github.com/vscodevim/vim/tree/v0.8.3) (2017-05-26)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.8.2...v0.8.3)

## [v0.8.2](https://github.com/vscodevim/vim/tree/v0.8.2) (2017-05-26)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.8.1...v0.8.2)

- Fixes \#1750: gq doesn't work for JSDoc type comments [\#1759](https://github.com/VSCodeVim/Vim/pull/1759) ([Chillee](https://github.com/Chillee))
- Some patches for v0.8.0 [\#1757](https://github.com/VSCodeVim/Vim/pull/1757) ([Chillee](https://github.com/Chillee))

## [v0.8.1](https://github.com/vscodevim/vim/tree/v0.8.1) (2017-05-26)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.8.0...v0.8.1)

- Fixes \#1752: Tab Completion [\#1753](https://github.com/VSCodeVim/Vim/pull/1753) ([Chillee](https://github.com/Chillee))

## [v0.8.0](https://github.com/vscodevim/vim/tree/v0.8.0) (2017-05-25)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.7.1...v0.8.0)

- Fixes \#1749: \<D-d\> in insert mode doesn't work when the word isn't by itself [\#1748](https://github.com/VSCodeVim/Vim/pull/1748) ([Chillee](https://github.com/Chillee))
- Added automatic changelog generator [\#1747](https://github.com/VSCodeVim/Vim/pull/1747) ([Chillee](https://github.com/Chillee))
- Actually readded \<c-j\> and \<c-k\> [\#1730](https://github.com/VSCodeVim/Vim/pull/1730) ([Chillee](https://github.com/Chillee))
- Revert "Unfixes \#1720" [\#1729](https://github.com/VSCodeVim/Vim/pull/1729) ([Chillee](https://github.com/Chillee))
- Unfixes \#1720 [\#1728](https://github.com/VSCodeVim/Vim/pull/1728) ([Chillee](https://github.com/Chillee))
- Embedding Neovim for Ex commands [\#1725](https://github.com/VSCodeVim/Vim/pull/1725) ([Chillee](https://github.com/Chillee))
- Fixes \#1720: Removed unused \<c- \> bindings from package.json [\#1722](https://github.com/VSCodeVim/Vim/pull/1722) ([Chillee](https://github.com/Chillee))
- Fixes \#1376: \<C-a\> doesn't work correctly when a word has more than 1 number [\#1721](https://github.com/VSCodeVim/Vim/pull/1721) ([Chillee](https://github.com/Chillee))
- Fixes \#1715: Adds multicursor paste [\#1717](https://github.com/VSCodeVim/Vim/pull/1717) ([Chillee](https://github.com/Chillee))
- Fixes \#1534, \#1518, \#1716, \#1618, \#1450: Refactored repeating motions [\#1712](https://github.com/VSCodeVim/Vim/pull/1712) ([Chillee](https://github.com/Chillee))
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
- Cobbweb/more readme fixes [\#1656](https://github.com/VSCodeVim/Vim/pull/1656) ([cobbweb](https://github.com/cobbweb))
- Fixes \#1256 and \#394: Fixes delete key and adds functionality [\#1644](https://github.com/VSCodeVim/Vim/pull/1644) ([Chillee](https://github.com/Chillee))
- Fixes \#1196, \#1197: d}/y} not working correctly [\#1621](https://github.com/VSCodeVim/Vim/pull/1621) ([Chillee](https://github.com/Chillee))
- Fixing the automatic fold expansion \(\#1004\) [\#1552](https://github.com/VSCodeVim/Vim/pull/1552) ([Chillee](https://github.com/Chillee))
- Fix visual mode bugs\#1304to\#1308 [\#1322](https://github.com/VSCodeVim/Vim/pull/1322) ([xlaech](https://github.com/xlaech))

## [v0.7.1](https://github.com/vscodevim/vim/tree/v0.7.1) (2017-05-10)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.7.0...v0.7.1)

- Changes tabs to navigate inside the same split [\#1677](https://github.com/VSCodeVim/Vim/pull/1677) ([vinicio](https://github.com/vinicio))
- clean up tests. increase timeout [\#1672](https://github.com/VSCodeVim/Vim/pull/1672) ([jpoon](https://github.com/jpoon))
- Fixes \#1585: Added \<C-w\> j and \<C-w\> k [\#1666](https://github.com/VSCodeVim/Vim/pull/1666) ([Chillee](https://github.com/Chillee))
- Add :close support based on :quit [\#1665](https://github.com/VSCodeVim/Vim/pull/1665) ([mspaulding06](https://github.com/mspaulding06))
- Fixes \#1280: Pasting over selection doesn't yank deleted section [\#1651](https://github.com/VSCodeVim/Vim/pull/1651) ([Chillee](https://github.com/Chillee))
- Fixes \#1535, \#1467, \#1311: D-d doesn't work in insert mode [\#1631](https://github.com/VSCodeVim/Vim/pull/1631) ([Chillee](https://github.com/Chillee))

## [v0.7.0](https://github.com/vscodevim/vim/tree/v0.7.0) (2017-05-05)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.20...v0.7.0)

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

## [v0.6.20](https://github.com/vscodevim/vim/tree/v0.6.20) (2017-04-26)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.19...v0.6.20)

## [v0.6.19](https://github.com/vscodevim/vim/tree/v0.6.19) (2017-04-26)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.18...v0.6.19)

- Fixes \#1573: Backspace at beginning of file causes subsequent operation to nop [\#1577](https://github.com/VSCodeVim/Vim/pull/1577) ([Chillee](https://github.com/Chillee))
- Fix logo src so logo displays inside VSCode [\#1572](https://github.com/VSCodeVim/Vim/pull/1572) ([cobbweb](https://github.com/cobbweb))
- fixes \#1449 [\#1571](https://github.com/VSCodeVim/Vim/pull/1571) ([squedd](https://github.com/squedd))
- fixes \#1252 [\#1569](https://github.com/VSCodeVim/Vim/pull/1569) ([xconverge](https://github.com/xconverge))
- fixes \#1486 :wqa command [\#1568](https://github.com/VSCodeVim/Vim/pull/1568) ([xconverge](https://github.com/xconverge))
- fixes \#1357 [\#1567](https://github.com/VSCodeVim/Vim/pull/1567) ([xconverge](https://github.com/xconverge))
- Fix surround aliases [\#1564](https://github.com/VSCodeVim/Vim/pull/1564) ([xconverge](https://github.com/xconverge))

## [v0.6.18](https://github.com/vscodevim/vim/tree/v0.6.18) (2017-04-24)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.17...v0.6.18)

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

## [v0.6.17](https://github.com/vscodevim/vim/tree/v0.6.17) (2017-04-20)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.16...v0.6.17)

- Allow user to change status bar color based on mode [\#1529](https://github.com/VSCodeVim/Vim/pull/1529) ([xconverge](https://github.com/xconverge))
- Fix README description for `af` [\#1522](https://github.com/VSCodeVim/Vim/pull/1522) ([esturcke](https://github.com/esturcke))
- fixes \#1519 [\#1521](https://github.com/VSCodeVim/Vim/pull/1521) ([xconverge](https://github.com/xconverge))
- make surround repeatable with dot [\#1515](https://github.com/VSCodeVim/Vim/pull/1515) ([xconverge](https://github.com/xconverge))
- \[WIP\] change system clipboard library to a newer more maintained library [\#1487](https://github.com/VSCodeVim/Vim/pull/1487) ([xconverge](https://github.com/xconverge))

## [v0.6.16](https://github.com/vscodevim/vim/tree/v0.6.16) (2017-04-16)

[Full Changelog](https://github.com/vscodevim/vim/compare/0.6.15...v0.6.16)

- added cmd_line commands to remapper [\#1516](https://github.com/VSCodeVim/Vim/pull/1516) ([xconverge](https://github.com/xconverge))
- fixes \#1507 and removes workspace settings that should not be there [\#1509](https://github.com/VSCodeVim/Vim/pull/1509) ([xconverge](https://github.com/xconverge))
- Add line comment operator [\#1506](https://github.com/VSCodeVim/Vim/pull/1506) ([fiedler](https://github.com/fiedler))
- Add 5i= or 4a- so that the previously inserted text is repeated upon exiting to normal mode [\#1495](https://github.com/VSCodeVim/Vim/pull/1495) ([xconverge](https://github.com/xconverge))
- Add ability to turn surround plugin off [\#1494](https://github.com/VSCodeVim/Vim/pull/1494) ([xconverge](https://github.com/xconverge))
- Added new style settings \(color, size, etc.\) for easymotion markers [\#1493](https://github.com/VSCodeVim/Vim/pull/1493) ([edasaki](https://github.com/edasaki))
- fixes \#1475 [\#1485](https://github.com/VSCodeVim/Vim/pull/1485) ([xconverge](https://github.com/xconverge))
- fix for double clicking a word with mouse not showing selection properly [\#1484](https://github.com/VSCodeVim/Vim/pull/1484) ([xconverge](https://github.com/xconverge))
- fix easymotion j and k [\#1474](https://github.com/VSCodeVim/Vim/pull/1474) ([xconverge](https://github.com/xconverge))

## [0.6.15](https://github.com/vscodevim/vim/tree/0.6.15) (2017-04-07)

[Full Changelog](https://github.com/vscodevim/vim/compare/0.6.14...0.6.15)

## [0.6.14](https://github.com/vscodevim/vim/tree/0.6.14) (2017-04-07)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.13...0.6.14)

- Fix tables in roadmap [\#1469](https://github.com/VSCodeVim/Vim/pull/1469) ([xconverge](https://github.com/xconverge))
- Fix visual block mode not updating multicursor selection [\#1468](https://github.com/VSCodeVim/Vim/pull/1468) ([xconverge](https://github.com/xconverge))
- Fix type suggestion for handleKeys object [\#1465](https://github.com/VSCodeVim/Vim/pull/1465) ([abhiranjankumar00](https://github.com/abhiranjankumar00))

## [v0.6.13](https://github.com/vscodevim/vim/tree/v0.6.13) (2017-04-04)

[Full Changelog](https://github.com/vscodevim/vim/compare/0.6.12...v0.6.13)

- fixes \#1448 [\#1462](https://github.com/VSCodeVim/Vim/pull/1462) ([xconverge](https://github.com/xconverge))
- fix multi line in 'at' and 'it' commands [\#1454](https://github.com/VSCodeVim/Vim/pull/1454) ([jrenton](https://github.com/jrenton))

## [0.6.12](https://github.com/vscodevim/vim/tree/0.6.12) (2017-04-04)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.11...0.6.12)

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

## [v0.6.11](https://github.com/vscodevim/vim/tree/v0.6.11) (2017-03-19)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.10...v0.6.11)

- Fix comment syntax for shell commands. [\#1408](https://github.com/VSCodeVim/Vim/pull/1408) ([frewsxcv](https://github.com/frewsxcv))
- Increase timeout for some test cases in mocha [\#1379](https://github.com/VSCodeVim/Vim/pull/1379) ([xconverge](https://github.com/xconverge))

## [v0.6.10](https://github.com/vscodevim/vim/tree/v0.6.10) (2017-03-18)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.9...v0.6.10)

## [v0.6.9](https://github.com/vscodevim/vim/tree/v0.6.9) (2017-03-18)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.8...v0.6.9)

## [v0.6.8](https://github.com/vscodevim/vim/tree/v0.6.8) (2017-03-18)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.7...v0.6.8)

## [v0.6.7](https://github.com/vscodevim/vim/tree/v0.6.7) (2017-03-18)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.6...v0.6.7)

- fix bracket motion behavior for use with % and a count, or \[\( and a c… [\#1406](https://github.com/VSCodeVim/Vim/pull/1406) ([xconverge](https://github.com/xconverge))
- fix for cursor not changing correctly, workaround for vscode issue [\#1402](https://github.com/VSCodeVim/Vim/pull/1402) ([xconverge](https://github.com/xconverge))

## [v0.6.6](https://github.com/vscodevim/vim/tree/v0.6.6) (2017-03-17)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.5...v0.6.6)

- Use block cursor in visual & underline in replace [\#1394](https://github.com/VSCodeVim/Vim/pull/1394) ([net](https://github.com/net))
- Perform remapped commands when prefix by a number [\#1359](https://github.com/VSCodeVim/Vim/pull/1359) ([bdauria](https://github.com/bdauria))

## [v0.6.5](https://github.com/vscodevim/vim/tree/v0.6.5) (2017-03-12)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.4...v0.6.5)

## [v0.6.4](https://github.com/vscodevim/vim/tree/v0.6.4) (2017-03-12)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.3...v0.6.4)

- Update README.md [\#1390](https://github.com/VSCodeVim/Vim/pull/1390) ([xconverge](https://github.com/xconverge))
- fixes \#1385 % motion with a count [\#1387](https://github.com/VSCodeVim/Vim/pull/1387) ([xconverge](https://github.com/xconverge))
- fixes \#1382 [\#1386](https://github.com/VSCodeVim/Vim/pull/1386) ([xconverge](https://github.com/xconverge))

## [v0.6.3](https://github.com/vscodevim/vim/tree/v0.6.3) (2017-03-11)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.6.0...v0.6.3)

- fixes \#1373 [\#1374](https://github.com/VSCodeVim/Vim/pull/1374) ([xconverge](https://github.com/xconverge))
- Remove log file. [\#1368](https://github.com/VSCodeVim/Vim/pull/1368) ([frewsxcv](https://github.com/frewsxcv))
- Remove our modified older typings [\#1367](https://github.com/VSCodeVim/Vim/pull/1367) ([xconverge](https://github.com/xconverge))
- \[WIP\] fix travis due to double digit version numbers [\#1366](https://github.com/VSCodeVim/Vim/pull/1366) ([xconverge](https://github.com/xconverge))
- Fixed numbered registered macros from overwriting themselves [\#1362](https://github.com/VSCodeVim/Vim/pull/1362) ([xconverge](https://github.com/xconverge))
- Update config options without restarting [\#1361](https://github.com/VSCodeVim/Vim/pull/1361) ([xconverge](https://github.com/xconverge))
- Index fixes [\#1190](https://github.com/VSCodeVim/Vim/pull/1190) ([xconverge](https://github.com/xconverge))

## [v0.6.0](https://github.com/vscodevim/vim/tree/v0.6.0) (2017-03-03)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.5.3...v0.6.0)

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

## [v0.5.3](https://github.com/vscodevim/vim/tree/v0.5.3) (2017-02-12)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.5.0...v0.5.3)

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

## [v0.5.0](https://github.com/vscodevim/vim/tree/v0.5.0) (2017-01-23)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.5.1...v0.5.0)

## [v0.5.1](https://github.com/vscodevim/vim/tree/v0.5.1) (2017-01-23)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.10...v0.5.1)

- Surround [\#1238](https://github.com/VSCodeVim/Vim/pull/1238) ([johnfn](https://github.com/johnfn))
- Support "gf" in es6 import statements by adding the file extension [\#1227](https://github.com/VSCodeVim/Vim/pull/1227) ([aminroosta](https://github.com/aminroosta))
- fixes \#1214 [\#1217](https://github.com/VSCodeVim/Vim/pull/1217) ([Platzer](https://github.com/Platzer))

## [v0.4.10](https://github.com/vscodevim/vim/tree/v0.4.10) (2016-12-22)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.9...v0.4.10)

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

## [v0.4.9](https://github.com/vscodevim/vim/tree/v0.4.9) (2016-12-05)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.8...v0.4.9)

## [v0.4.8](https://github.com/vscodevim/vim/tree/v0.4.8) (2016-12-05)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.7...v0.4.8)

- Update readme for easymotion [\#1114](https://github.com/VSCodeVim/Vim/pull/1114) ([xconverge](https://github.com/xconverge))

## [v0.4.7](https://github.com/vscodevim/vim/tree/v0.4.7) (2016-12-05)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.6...v0.4.7)

- Fix minor typo [\#1113](https://github.com/VSCodeVim/Vim/pull/1113) ([xconverge](https://github.com/xconverge))
- \[WIP\] initial leader fixes [\#1112](https://github.com/VSCodeVim/Vim/pull/1112) ([xconverge](https://github.com/xconverge))
- Added more aliases for nohl [\#1111](https://github.com/VSCodeVim/Vim/pull/1111) ([xconverge](https://github.com/xconverge))
- Turns highlighting back on after nohl if you try to go to a new searc… [\#1110](https://github.com/VSCodeVim/Vim/pull/1110) ([xconverge](https://github.com/xconverge))

## [v0.4.6](https://github.com/vscodevim/vim/tree/v0.4.6) (2016-12-04)

[Full Changelog](https://github.com/vscodevim/vim/compare/0.4.5...v0.4.6)

## [0.4.5](https://github.com/vscodevim/vim/tree/0.4.5) (2016-12-04)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.5...0.4.5)

- \[WIP\] gq [\#1106](https://github.com/VSCodeVim/Vim/pull/1106) ([johnfn](https://github.com/johnfn))

## [v0.4.5](https://github.com/vscodevim/vim/tree/v0.4.5) (2016-12-02)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.4...v0.4.5)

- Override home key \(for pressing home in visual for example\) [\#1100](https://github.com/VSCodeVim/Vim/pull/1100) ([xconverge](https://github.com/xconverge))
- avoid syncing style back to config [\#1099](https://github.com/VSCodeVim/Vim/pull/1099) ([rebornix](https://github.com/rebornix))
- Implement open file command - Issue \#801 [\#1098](https://github.com/VSCodeVim/Vim/pull/1098) ([jamirvin](https://github.com/jamirvin))

## [v0.4.4](https://github.com/vscodevim/vim/tree/v0.4.4) (2016-11-29)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.3...v0.4.4)

- Removed debug print [\#1083](https://github.com/VSCodeVim/Vim/pull/1083) ([xconverge](https://github.com/xconverge))
- Update roadmap for ctrl-o [\#1082](https://github.com/VSCodeVim/Vim/pull/1082) ([xconverge](https://github.com/xconverge))
- fixes \#1076 [\#1077](https://github.com/VSCodeVim/Vim/pull/1077) ([xconverge](https://github.com/xconverge))
- fixes \#1073 [\#1074](https://github.com/VSCodeVim/Vim/pull/1074) ([xconverge](https://github.com/xconverge))
- fixes \#1065 [\#1071](https://github.com/VSCodeVim/Vim/pull/1071) ([xconverge](https://github.com/xconverge))
- fixes \#1023 [\#1069](https://github.com/VSCodeVim/Vim/pull/1069) ([xconverge](https://github.com/xconverge))

## [v0.4.3](https://github.com/vscodevim/vim/tree/v0.4.3) (2016-11-19)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.2...v0.4.3)

- fixes \#1034 [\#1068](https://github.com/VSCodeVim/Vim/pull/1068) ([xconverge](https://github.com/xconverge))
- fixes \#1035 [\#1067](https://github.com/VSCodeVim/Vim/pull/1067) ([xconverge](https://github.com/xconverge))
- fixes \#1064 [\#1066](https://github.com/VSCodeVim/Vim/pull/1066) ([xconverge](https://github.com/xconverge))
- How can I fix travis failure [\#1062](https://github.com/VSCodeVim/Vim/pull/1062) ([rebornix](https://github.com/rebornix))

## [v0.4.2](https://github.com/vscodevim/vim/tree/v0.4.2) (2016-11-17)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.1...v0.4.2)

- Visual block fixes to cursor position and tests [\#1044](https://github.com/VSCodeVim/Vim/pull/1044) ([xconverge](https://github.com/xconverge))
- Hide the info line in issue template [\#1037](https://github.com/VSCodeVim/Vim/pull/1037) ([octref](https://github.com/octref))
- Implemented EasyMotion plugin functionality [\#993](https://github.com/VSCodeVim/Vim/pull/993) ([Metamist](https://github.com/Metamist))

## [v0.4.1](https://github.com/vscodevim/vim/tree/v0.4.1) (2016-10-31)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.4.0...v0.4.1)

- fixes \#1013 [\#1014](https://github.com/VSCodeVim/Vim/pull/1014) ([xconverge](https://github.com/xconverge))
- Update Readme [\#1012](https://github.com/VSCodeVim/Vim/pull/1012) ([jpoon](https://github.com/jpoon))
- fixes \#983 [\#1008](https://github.com/VSCodeVim/Vim/pull/1008) ([xconverge](https://github.com/xconverge))
- Make create-multicursor commands repeatable [\#1007](https://github.com/VSCodeVim/Vim/pull/1007) ([Platzer](https://github.com/Platzer))
- fix mouse clicking past EOL [\#1006](https://github.com/VSCodeVim/Vim/pull/1006) ([xconverge](https://github.com/xconverge))
- fixes \#1000 and a minor replace issue [\#1005](https://github.com/VSCodeVim/Vim/pull/1005) ([xconverge](https://github.com/xconverge))
- Update "r" for visual modes on roadmap [\#1002](https://github.com/VSCodeVim/Vim/pull/1002) ([xconverge](https://github.com/xconverge))
- fixes \#998 [\#1001](https://github.com/VSCodeVim/Vim/pull/1001) ([xconverge](https://github.com/xconverge))
- Remove fix-whitespace gulp command. [\#999](https://github.com/VSCodeVim/Vim/pull/999) ([jpoon](https://github.com/jpoon))
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

## [v0.4.0](https://github.com/vscodevim/vim/tree/v0.4.0) (2016-10-24)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.3.8...v0.4.0)

- fix \#528 [\#966](https://github.com/VSCodeVim/Vim/pull/966) ([rebornix](https://github.com/rebornix))
- fix \#693 [\#964](https://github.com/VSCodeVim/Vim/pull/964) ([rebornix](https://github.com/rebornix))
- fix \#922 [\#960](https://github.com/VSCodeVim/Vim/pull/960) ([rebornix](https://github.com/rebornix))
- fix \#939 [\#958](https://github.com/VSCodeVim/Vim/pull/958) ([rebornix](https://github.com/rebornix))
- Add a command is `D` in visual block mode. [\#957](https://github.com/VSCodeVim/Vim/pull/957) ([Kooooya](https://github.com/Kooooya))
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

## [v0.3.8](https://github.com/vscodevim/vim/tree/v0.3.8) (2016-10-18)

[Full Changelog](https://github.com/vscodevim/vim/compare/0.3.7...v0.3.8)

- fixes \#879 [\#933](https://github.com/VSCodeVim/Vim/pull/933) ([xconverge](https://github.com/xconverge))
- fixes \#905 [\#932](https://github.com/VSCodeVim/Vim/pull/932) ([xconverge](https://github.com/xconverge))
- fixes \#652 [\#931](https://github.com/VSCodeVim/Vim/pull/931) ([xconverge](https://github.com/xconverge))
- Update internal cursor position when necessary [\#927](https://github.com/VSCodeVim/Vim/pull/927) ([rebornix](https://github.com/rebornix))
- Draw multicursor correctly in Visual Mode [\#920](https://github.com/VSCodeVim/Vim/pull/920) ([Platzer](https://github.com/Platzer))
- update internal cursor position per Code selection change [\#919](https://github.com/VSCodeVim/Vim/pull/919) ([rebornix](https://github.com/rebornix))
- display register value in reg-cmd, fix \#830 [\#915](https://github.com/VSCodeVim/Vim/pull/915) ([Platzer](https://github.com/Platzer))
- \[Post 1.0\] Two way syncing of Vim and Code's configuration [\#913](https://github.com/VSCodeVim/Vim/pull/913) ([rebornix](https://github.com/rebornix))
- Macro [\#894](https://github.com/VSCodeVim/Vim/pull/894) ([rebornix](https://github.com/rebornix))

## [0.3.7](https://github.com/vscodevim/vim/tree/0.3.7) (2016-10-12)

[Full Changelog](https://github.com/vscodevim/vim/compare/0.3.6...0.3.7)

- fixes \#888 [\#902](https://github.com/VSCodeVim/Vim/pull/902) ([xconverge](https://github.com/xconverge))
- fixes \#882 [\#900](https://github.com/VSCodeVim/Vim/pull/900) ([xconverge](https://github.com/xconverge))

## [0.3.6](https://github.com/vscodevim/vim/tree/0.3.6) (2016-10-12)

[Full Changelog](https://github.com/vscodevim/vim/compare/0.3.5...0.3.6)

- allow remapping of ctrl-j and ctrl-k in settings.json [\#891](https://github.com/VSCodeVim/Vim/pull/891) ([xwvvvvwx](https://github.com/xwvvvvwx))
- Fix visual block x [\#861](https://github.com/VSCodeVim/Vim/pull/861) ([xconverge](https://github.com/xconverge))

## [0.3.5](https://github.com/vscodevim/vim/tree/0.3.5) (2016-10-10)

[Full Changelog](https://github.com/vscodevim/vim/compare/0.3.4...0.3.5)

## [0.3.4](https://github.com/vscodevim/vim/tree/0.3.4) (2016-10-10)

[Full Changelog](https://github.com/vscodevim/vim/compare/0.3.3...0.3.4)

- Remove unused modehandlers when tabs are closed [\#865](https://github.com/VSCodeVim/Vim/pull/865) ([xconverge](https://github.com/xconverge))
- Insert Previous text [\#768](https://github.com/VSCodeVim/Vim/pull/768) ([rebornix](https://github.com/rebornix))

## [0.3.3](https://github.com/vscodevim/vim/tree/0.3.3) (2016-10-08)

[Full Changelog](https://github.com/vscodevim/vim/compare/0.3.2...0.3.3)

## [0.3.2](https://github.com/vscodevim/vim/tree/0.3.2) (2016-10-08)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.3.1...0.3.2)

## [v0.3.1](https://github.com/vscodevim/vim/tree/v0.3.1) (2016-10-08)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.3.0...v0.3.1)

- Unnecessary quit check on untitled files [\#855](https://github.com/VSCodeVim/Vim/pull/855) ([xconverge](https://github.com/xconverge))
- Add new logo icon [\#852](https://github.com/VSCodeVim/Vim/pull/852) ([kevincoleman](https://github.com/kevincoleman))
- Fixes arrow navigation to EOL while in insert [\#838](https://github.com/VSCodeVim/Vim/pull/838) ([xconverge](https://github.com/xconverge))
- fixes \#832 [\#837](https://github.com/VSCodeVim/Vim/pull/837) ([xconverge](https://github.com/xconverge))
- \[WIP\] Use new transformation style in delete and paste [\#835](https://github.com/VSCodeVim/Vim/pull/835) ([johnfn](https://github.com/johnfn))
- X eats eol [\#827](https://github.com/VSCodeVim/Vim/pull/827) ([xconverge](https://github.com/xconverge))
- Fix to allow A while in visual mode [\#816](https://github.com/VSCodeVim/Vim/pull/816) ([xconverge](https://github.com/xconverge))
- Fix issue where could not use I while in visual mode [\#815](https://github.com/VSCodeVim/Vim/pull/815) ([xconverge](https://github.com/xconverge))
- fixes \#784 [\#814](https://github.com/VSCodeVim/Vim/pull/814) ([xconverge](https://github.com/xconverge))

## [v0.3.0](https://github.com/vscodevim/vim/tree/v0.3.0) (2016-10-03)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.2.0...v0.3.0)

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

## [v0.2.0](https://github.com/vscodevim/vim/tree/v0.2.0) (2016-09-21)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.11...v0.2.0)

## [v0.1.11](https://github.com/vscodevim/vim/tree/v0.1.11) (2016-09-20)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.10...v0.1.11)

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
- Read command [\#736](https://github.com/VSCodeVim/Vim/pull/736) ([domgee](https://github.com/domgee))
- Doc for enabling repeating j/k for Insider build [\#733](https://github.com/VSCodeVim/Vim/pull/733) ([octref](https://github.com/octref))
- Add autoindent setting [\#726](https://github.com/VSCodeVim/Vim/pull/726) ([octref](https://github.com/octref))
- Disable Vim Mode in Debug Repl [\#723](https://github.com/VSCodeVim/Vim/pull/723) ([rebornix](https://github.com/rebornix))
- \[WIP\] Roadmap update [\#717](https://github.com/VSCodeVim/Vim/pull/717) ([rebornix](https://github.com/rebornix))
- Editor Scroll [\#681](https://github.com/VSCodeVim/Vim/pull/681) ([rebornix](https://github.com/rebornix))
- Implement :wa\[ll\] command \(write all\) [\#671](https://github.com/VSCodeVim/Vim/pull/671) ([mleech](https://github.com/mleech))
- Special keys in Insert Mode [\#615](https://github.com/VSCodeVim/Vim/pull/615) ([rebornix](https://github.com/rebornix))

## [v0.1.10](https://github.com/vscodevim/vim/tree/v0.1.10) (2016-09-06)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.9...v0.1.10)

- Align Screen Line commands with latest Code API [\#724](https://github.com/VSCodeVim/Vim/pull/724) ([rebornix](https://github.com/rebornix))
- Visual block tests [\#722](https://github.com/VSCodeVim/Vim/pull/722) ([xconverge](https://github.com/xconverge))
- Remapper fixes [\#721](https://github.com/VSCodeVim/Vim/pull/721) ([jpoon](https://github.com/jpoon))
- fixes \#718 A and I have cursor in right position now [\#720](https://github.com/VSCodeVim/Vim/pull/720) ([xconverge](https://github.com/xconverge))
- fixes \#696 [\#715](https://github.com/VSCodeVim/Vim/pull/715) ([xconverge](https://github.com/xconverge))
- fix \#690 and other toggle case issues [\#698](https://github.com/VSCodeVim/Vim/pull/698) ([xconverge](https://github.com/xconverge))

## [v0.1.9](https://github.com/vscodevim/vim/tree/v0.1.9) (2016-09-05)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.8...v0.1.9)

- Update README.md [\#714](https://github.com/VSCodeVim/Vim/pull/714) ([jpoon](https://github.com/jpoon))
- Add vim.\* settings to readme. Fixes \#503 [\#713](https://github.com/VSCodeVim/Vim/pull/713) ([jpoon](https://github.com/jpoon))
- Set diff timeout to 1 second. [\#712](https://github.com/VSCodeVim/Vim/pull/712) ([johnfn](https://github.com/johnfn))
- Inserts repeated with . would add many undo points; fix this. [\#711](https://github.com/VSCodeVim/Vim/pull/711) ([johnfn](https://github.com/johnfn))
- Hotfix remapping [\#710](https://github.com/VSCodeVim/Vim/pull/710) ([johnfn](https://github.com/johnfn))
- Tiny change to issue template. [\#709](https://github.com/VSCodeVim/Vim/pull/709) ([johnfn](https://github.com/johnfn))

## [v0.1.8](https://github.com/vscodevim/vim/tree/v0.1.8) (2016-09-04)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.7...v0.1.8)

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

## [v0.1.7](https://github.com/vscodevim/vim/tree/v0.1.7) (2016-08-14)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.6...v0.1.7)

- Add support Y in visual mode [\#597](https://github.com/VSCodeVim/Vim/pull/597) ([shotaAkasaka](https://github.com/shotaAkasaka))
- Sentence selection [\#592](https://github.com/VSCodeVim/Vim/pull/592) ([rebornix](https://github.com/rebornix))
- fix C or cc kill the empty line [\#591](https://github.com/VSCodeVim/Vim/pull/591) ([shotaAkasaka](https://github.com/shotaAkasaka))
- Added Non-Recursive mapping capability. Fixes issue \#408 [\#589](https://github.com/VSCodeVim/Vim/pull/589) ([somkun](https://github.com/somkun))
- Vim Settings [\#508](https://github.com/VSCodeVim/Vim/pull/508) ([rebornix](https://github.com/rebornix))

## [v0.1.6](https://github.com/vscodevim/vim/tree/v0.1.6) (2016-08-09)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.5...v0.1.6)

- \[WIP\] Visual block mode [\#469](https://github.com/VSCodeVim/Vim/pull/469) ([johnfn](https://github.com/johnfn))

## [v0.1.5](https://github.com/vscodevim/vim/tree/v0.1.5) (2016-08-09)

[Full Changelog](https://github.com/vscodevim/vim/compare/0.1.5...v0.1.5)

## [0.1.5](https://github.com/vscodevim/vim/tree/0.1.5) (2016-08-09)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.4...0.1.5)

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

## [v0.1.4](https://github.com/vscodevim/vim/tree/v0.1.4) (2016-07-28)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.3...v0.1.4)

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

## [v0.1.3](https://github.com/vscodevim/vim/tree/v0.1.3) (2016-07-19)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.2...v0.1.3)

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

## [v0.1.2](https://github.com/vscodevim/vim/tree/v0.1.2) (2016-07-13)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1.1...v0.1.2)

- Fix spec for otherModesKeyBindings to match insert [\#434](https://github.com/VSCodeVim/Vim/pull/434) ([sectioneight](https://github.com/sectioneight))
- Use TypeScript 2.0 and use strictNullChecks. [\#431](https://github.com/VSCodeVim/Vim/pull/431) ([johnfn](https://github.com/johnfn))
- Ctrl+U and Ctrl+D [\#430](https://github.com/VSCodeVim/Vim/pull/430) ([rebornix](https://github.com/rebornix))
- Fix\#369. `dw` eats EOF. [\#428](https://github.com/VSCodeVim/Vim/pull/428) ([rebornix](https://github.com/rebornix))
- Include vscode typings [\#419](https://github.com/VSCodeVim/Vim/pull/419) ([jpoon](https://github.com/jpoon))
- Fix ctrl+b, ctrl+f [\#418](https://github.com/VSCodeVim/Vim/pull/418) ([jpoon](https://github.com/jpoon))
- Fix \#397. [\#413](https://github.com/VSCodeVim/Vim/pull/413) ([rebornix](https://github.com/rebornix))
- Fix layout mistake in Contributing and gulp typo [\#411](https://github.com/VSCodeVim/Vim/pull/411) ([frederickfogerty](https://github.com/frederickfogerty))

## [v0.1.1](https://github.com/vscodevim/vim/tree/v0.1.1) (2016-07-08)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.1...v0.1.1)

- Fix \#414. [\#415](https://github.com/VSCodeVim/Vim/pull/415) ([rebornix](https://github.com/rebornix))
- Substitute [\#376](https://github.com/VSCodeVim/Vim/pull/376) ([rebornix](https://github.com/rebornix))

## [v0.1](https://github.com/vscodevim/vim/tree/v0.1) (2016-07-08)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.28...v0.1)

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

## [v0.0.28](https://github.com/vscodevim/vim/tree/v0.0.28) (2016-06-24)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.27...v0.0.28)

- Implement \<count\>yy [\#351](https://github.com/VSCodeVim/Vim/pull/351) ([rebornix](https://github.com/rebornix))
- Align TextEditorOptions between test code and workspace [\#350](https://github.com/VSCodeVim/Vim/pull/350) ([rebornix](https://github.com/rebornix))
- Uppercase support [\#349](https://github.com/VSCodeVim/Vim/pull/349) ([johnfn](https://github.com/johnfn))
- Add format code support. Fix \#308. [\#348](https://github.com/VSCodeVim/Vim/pull/348) ([rebornix](https://github.com/rebornix))

## [v0.0.27](https://github.com/vscodevim/vim/tree/v0.0.27) (2016-06-23)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.26...v0.0.27)

## [v0.0.26](https://github.com/vscodevim/vim/tree/v0.0.26) (2016-06-22)

[Full Changelog](https://github.com/vscodevim/vim/compare/0.0.26...v0.0.26)

## [0.0.26](https://github.com/vscodevim/vim/tree/0.0.26) (2016-06-22)

[Full Changelog](https://github.com/vscodevim/vim/compare/0.0.25...0.0.26)

- Star and hash [\#335](https://github.com/VSCodeVim/Vim/pull/335) ([johnfn](https://github.com/johnfn))
- Tilde key toggles case and moves forwards [\#325](https://github.com/VSCodeVim/Vim/pull/325) ([markrendle](https://github.com/markrendle))
- Pressing Enter moves cursor to start of next line [\#324](https://github.com/VSCodeVim/Vim/pull/324) ([markrendle](https://github.com/markrendle))
- Add infrastructure for repeatable commands. [\#322](https://github.com/VSCodeVim/Vim/pull/322) ([johnfn](https://github.com/johnfn))
- Add support for 'U' uppercase [\#312](https://github.com/VSCodeVim/Vim/pull/312) ([rebornix](https://github.com/rebornix))

## [0.0.25](https://github.com/vscodevim/vim/tree/0.0.25) (2016-06-20)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.25...0.0.25)

## [v0.0.25](https://github.com/vscodevim/vim/tree/v0.0.25) (2016-06-20)

[Full Changelog](https://github.com/vscodevim/vim/compare/0.0.24...v0.0.25)

- Repeated motions [\#321](https://github.com/VSCodeVim/Vim/pull/321) ([johnfn](https://github.com/johnfn))

## [0.0.24](https://github.com/vscodevim/vim/tree/0.0.24) (2016-06-19)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.24...0.0.24)

## [v0.0.24](https://github.com/vscodevim/vim/tree/v0.0.24) (2016-06-19)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.23...v0.0.24)

## [v0.0.23](https://github.com/vscodevim/vim/tree/v0.0.23) (2016-06-19)

[Full Changelog](https://github.com/vscodevim/vim/compare/0.0.23...v0.0.23)

## [0.0.23](https://github.com/vscodevim/vim/tree/0.0.23) (2016-06-19)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.22...0.0.23)

- Add %. [\#319](https://github.com/VSCodeVim/Vim/pull/319) ([johnfn](https://github.com/johnfn))
- @darrenweston's test improvements + more work [\#316](https://github.com/VSCodeVim/Vim/pull/316) ([johnfn](https://github.com/johnfn))

## [v0.0.22](https://github.com/vscodevim/vim/tree/v0.0.22) (2016-06-18)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.21...v0.0.22)

## [v0.0.21](https://github.com/vscodevim/vim/tree/v0.0.21) (2016-06-17)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.20...v0.0.21)

- Fix visual line selection from bottom to top. [\#307](https://github.com/VSCodeVim/Vim/pull/307) ([johnfn](https://github.com/johnfn))
- Fix autocomplete [\#304](https://github.com/VSCodeVim/Vim/pull/304) ([johnfn](https://github.com/johnfn))
- Select into visual mode [\#302](https://github.com/VSCodeVim/Vim/pull/302) ([johnfn](https://github.com/johnfn))
- Refactor dot [\#294](https://github.com/VSCodeVim/Vim/pull/294) ([johnfn](https://github.com/johnfn))

## [v0.0.20](https://github.com/vscodevim/vim/tree/v0.0.20) (2016-06-13)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.19...v0.0.20)

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

## [v0.0.19](https://github.com/vscodevim/vim/tree/v0.0.19) (2016-06-07)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.18...v0.0.19)

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

## [v0.0.18](https://github.com/vscodevim/vim/tree/v0.0.18) (2016-05-19)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.17...v0.0.18)

- Install Gulp for Travis [\#225](https://github.com/VSCodeVim/Vim/pull/225) ([jpoon](https://github.com/jpoon))
- Update to vscode 0.10.12 APIs [\#224](https://github.com/VSCodeVim/Vim/pull/224) ([jpoon](https://github.com/jpoon))

## [v0.0.17](https://github.com/vscodevim/vim/tree/v0.0.17) (2016-05-17)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.16...v0.0.17)

- Added basic fold commands zc, zo, zC, zO. [\#222](https://github.com/VSCodeVim/Vim/pull/222) ([geksilla](https://github.com/geksilla))
- keymap configurations only override defaults that are changed [\#221](https://github.com/VSCodeVim/Vim/pull/221) ([adiviness](https://github.com/adiviness))
- Added basic support for rebinding keys. [\#219](https://github.com/VSCodeVim/Vim/pull/219) ([Lindenk](https://github.com/Lindenk))
- waffle.io Badge [\#216](https://github.com/VSCodeVim/Vim/pull/216) ([waffle-iron](https://github.com/waffle-iron))
- Add check mark to D key in README [\#215](https://github.com/VSCodeVim/Vim/pull/215) ([pjvds](https://github.com/pjvds))

## [v0.0.16](https://github.com/vscodevim/vim/tree/v0.0.16) (2016-05-03)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.15...v0.0.16)

- I think this may fix the build failure. [\#209](https://github.com/VSCodeVim/Vim/pull/209) ([edthedev](https://github.com/edthedev))
- Support for copy and p command [\#208](https://github.com/VSCodeVim/Vim/pull/208) ([petegleeson](https://github.com/petegleeson))
- Fix issue / key doesn't search current file [\#205](https://github.com/VSCodeVim/Vim/pull/205) ([tnngo2](https://github.com/tnngo2))
- Fixes Incorrect Cursor Position after Transition into Normal Mode [\#202](https://github.com/VSCodeVim/Vim/pull/202) ([dpbackes](https://github.com/dpbackes))
- Fixes Issue with Cursor Position After 'dw' [\#200](https://github.com/VSCodeVim/Vim/pull/200) ([dpbackes](https://github.com/dpbackes))

## [v0.0.15](https://github.com/vscodevim/vim/tree/v0.0.15) (2016-03-22)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.14...v0.0.15)

- Bug fixes [\#192](https://github.com/VSCodeVim/Vim/pull/192) ([jpoon](https://github.com/jpoon))

## [v0.0.14](https://github.com/vscodevim/vim/tree/v0.0.14) (2016-03-21)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.13...v0.0.14)

- Bug fixes [\#191](https://github.com/VSCodeVim/Vim/pull/191) ([jpoon](https://github.com/jpoon))
- Search '/' in Command Mode [\#190](https://github.com/VSCodeVim/Vim/pull/190) ([jpoon](https://github.com/jpoon))

## [v0.0.13](https://github.com/vscodevim/vim/tree/v0.0.13) (2016-03-18)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.12...v0.0.13)

- fix appveyor build [\#189](https://github.com/VSCodeVim/Vim/pull/189) ([jpoon](https://github.com/jpoon))
- Fixup/highlight eol char [\#182](https://github.com/VSCodeVim/Vim/pull/182) ([khisakuni](https://github.com/khisakuni))
- c commands and ge motions [\#180](https://github.com/VSCodeVim/Vim/pull/180) ([frarees](https://github.com/frarees))
- add github_token to appveyor/travis [\#178](https://github.com/VSCodeVim/Vim/pull/178) ([jpoon](https://github.com/jpoon))
- Commands can write to status bar [\#177](https://github.com/VSCodeVim/Vim/pull/177) ([frarees](https://github.com/frarees))
- Wait for test files to get written [\#175](https://github.com/VSCodeVim/Vim/pull/175) ([frarees](https://github.com/frarees))
- d{motion} support [\#174](https://github.com/VSCodeVim/Vim/pull/174) ([frarees](https://github.com/frarees))

## [v0.0.12](https://github.com/vscodevim/vim/tree/v0.0.12) (2016-03-04)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.11...v0.0.12)

- Spanish keyboard mappings [\#169](https://github.com/VSCodeVim/Vim/pull/169) ([frarees](https://github.com/frarees))
- Fix visual mode activated on insert mode [\#168](https://github.com/VSCodeVim/Vim/pull/168) ([frarees](https://github.com/frarees))
- Fix lexer unreachable code causing build error [\#165](https://github.com/VSCodeVim/Vim/pull/165) ([frarees](https://github.com/frarees))
- Update Package Dependencies. Remove Ctrl+C [\#163](https://github.com/VSCodeVim/Vim/pull/163) ([jpoon](https://github.com/jpoon))
- Add E \(end of WORD\), and fix up e \(end of word\). [\#160](https://github.com/VSCodeVim/Vim/pull/160) ([tma-isbx](https://github.com/tma-isbx))
- Fix for block cursor in insert mode [\#154](https://github.com/VSCodeVim/Vim/pull/154) ([sWW26](https://github.com/sWW26))
- Move private methods and update readme [\#153](https://github.com/VSCodeVim/Vim/pull/153) ([tma-isbx](https://github.com/tma-isbx))
- Visual Mode + Rudimentary Operators [\#144](https://github.com/VSCodeVim/Vim/pull/144) ([johnfn](https://github.com/johnfn))

## [v0.0.11](https://github.com/vscodevim/vim/tree/v0.0.11) (2016-02-18)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.10...v0.0.11)

- Upgrade to Typings as TSD has been deprecated [\#152](https://github.com/VSCodeVim/Vim/pull/152) ([jpoon](https://github.com/jpoon))
- Convert test to async/await style. [\#150](https://github.com/VSCodeVim/Vim/pull/150) ([johnfn](https://github.com/johnfn))
- Capital W/B word movement [\#147](https://github.com/VSCodeVim/Vim/pull/147) ([tma-isbx](https://github.com/tma-isbx))
- Implement 'X' in normal mode \(backspace\) [\#145](https://github.com/VSCodeVim/Vim/pull/145) ([tma-isbx](https://github.com/tma-isbx))
- Fix b motion. [\#143](https://github.com/VSCodeVim/Vim/pull/143) ([johnfn](https://github.com/johnfn))
- Implement ctrl+f/ctrl+b \(PageDown/PageUp\) [\#142](https://github.com/VSCodeVim/Vim/pull/142) ([tma-isbx](https://github.com/tma-isbx))
- \[\#127\] Fix 'x' behavior at EOL [\#141](https://github.com/VSCodeVim/Vim/pull/141) ([tma-isbx](https://github.com/tma-isbx))
- Implement % to jump to matching brace [\#140](https://github.com/VSCodeVim/Vim/pull/140) ([tma-isbx](https://github.com/tma-isbx))
- Add ctrl-c. [\#139](https://github.com/VSCodeVim/Vim/pull/139) ([johnfn](https://github.com/johnfn))
- Fix word and back-word motions, and fix tests. [\#138](https://github.com/VSCodeVim/Vim/pull/138) ([johnfn](https://github.com/johnfn))
- Convert to ES6, Promises, async and await. [\#137](https://github.com/VSCodeVim/Vim/pull/137) ([johnfn](https://github.com/johnfn))

## [v0.0.10](https://github.com/vscodevim/vim/tree/v0.0.10) (2016-02-01)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.9...v0.0.10)

- Implement % to jump to matching brace [\#134](https://github.com/VSCodeVim/Vim/pull/134) ([tma-isbx](https://github.com/tma-isbx))
- Add paragraph motions [\#133](https://github.com/VSCodeVim/Vim/pull/133) ([johnfn](https://github.com/johnfn))
- Add Swedish keyboard layout [\#130](https://github.com/VSCodeVim/Vim/pull/130) ([AntonAderum](https://github.com/AntonAderum))

## [v0.0.9](https://github.com/vscodevim/vim/tree/v0.0.9) (2016-01-06)

[Full Changelog](https://github.com/vscodevim/vim/compare/0.0.9...v0.0.9)

## [0.0.9](https://github.com/vscodevim/vim/tree/0.0.9) (2016-01-06)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.8...0.0.9)

- added danish keyboard layout - fix issue \#124 [\#125](https://github.com/VSCodeVim/Vim/pull/125) ([kedde](https://github.com/kedde))
- Delete Right when user presses x [\#122](https://github.com/VSCodeVim/Vim/pull/122) ([sharpoverride](https://github.com/sharpoverride))

## [v0.0.8](https://github.com/vscodevim/vim/tree/v0.0.8) (2016-01-03)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.7...v0.0.8)

## [v0.0.7](https://github.com/vscodevim/vim/tree/v0.0.7) (2016-01-03)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.6...v0.0.7)

- Block Cursor [\#120](https://github.com/VSCodeVim/Vim/pull/120) ([jpoon](https://github.com/jpoon))
- BugFix: swapped cursor and caret. desired column not updated properly [\#119](https://github.com/VSCodeVim/Vim/pull/119) ([jpoon](https://github.com/jpoon))
- Readme: update with keyboard configuration [\#116](https://github.com/VSCodeVim/Vim/pull/116) ([jpoon](https://github.com/jpoon))
- Tests: Enable all tests to be run in Travis CI [\#115](https://github.com/VSCodeVim/Vim/pull/115) ([jpoon](https://github.com/jpoon))
- Cleanup [\#114](https://github.com/VSCodeVim/Vim/pull/114) ([jpoon](https://github.com/jpoon))

## [v0.0.6](https://github.com/vscodevim/vim/tree/v0.0.6) (2015-12-30)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.5...v0.0.6)

- Cleanup [\#113](https://github.com/VSCodeVim/Vim/pull/113) ([jpoon](https://github.com/jpoon))
- Motion Fixes [\#112](https://github.com/VSCodeVim/Vim/pull/112) ([jpoon](https://github.com/jpoon))
- Fix character position persistence on up/down commands, add : "e", "0", and fix "^" [\#109](https://github.com/VSCodeVim/Vim/pull/109) ([corymickelson](https://github.com/corymickelson))

## [v0.0.5](https://github.com/vscodevim/vim/tree/v0.0.5) (2015-12-09)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.3...v0.0.5)

## [v0.0.3](https://github.com/vscodevim/vim/tree/v0.0.3) (2015-12-04)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.2...v0.0.3)

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
- fix line end determination for a, A, \$ [\#68](https://github.com/VSCodeVim/Vim/pull/68) ([kimitake](https://github.com/kimitake))
- '\$' and '^' for Moving to beginning and end of line [\#66](https://github.com/VSCodeVim/Vim/pull/66) ([josephliccini](https://github.com/josephliccini))
- support x command [\#65](https://github.com/VSCodeVim/Vim/pull/65) ([kimitake](https://github.com/kimitake))
- Update README.md [\#63](https://github.com/VSCodeVim/Vim/pull/63) ([markrendle](https://github.com/markrendle))
- map keys from US keyboard to other layouts [\#61](https://github.com/VSCodeVim/Vim/pull/61) ([guillermooo](https://github.com/guillermooo))
- fix bug for Cursor class [\#58](https://github.com/VSCodeVim/Vim/pull/58) ([kimitake](https://github.com/kimitake))
- Cursor Motions [\#56](https://github.com/VSCodeVim/Vim/pull/56) ([jpoon](https://github.com/jpoon))
- Add word motion and db [\#53](https://github.com/VSCodeVim/Vim/pull/53) ([adriaanp](https://github.com/adriaanp))

## [v0.0.2](https://github.com/vscodevim/vim/tree/v0.0.2) (2015-11-29)

[Full Changelog](https://github.com/vscodevim/vim/compare/v0.0.1...v0.0.2)

- move cursor position after getting normal mode [\#50](https://github.com/VSCodeVim/Vim/pull/50) ([kimitake](https://github.com/kimitake))

## [v0.0.1](https://github.com/vscodevim/vim/tree/v0.0.1) (2015-11-29)

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

\* _This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)_
