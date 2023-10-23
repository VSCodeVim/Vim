# Change Log

## [v1.26.2](https://github.com/vscodevim/vim/tree/v1.26.2) (2023-10-21)

### Fixed

- Fixed illegible text with certain color schemes when `vim.statusBarColorControl` is enabled ([@chandradeepdey](https://github.com/chandradeepdey)).

### Changed

- Changed extension's `activationEvents` to include `onStartupFinished` rather than `*`, which may improve startup performance ([@whitphx](https://github.com/whitphx)).

## [v1.26.1](https://github.com/vscodevim/vim/tree/v1.26.1) (2023-10-09)

### Fixed

- Fixed several Insert mode bugs caused by a regression in `v1.26.0` ([@nullbus](https://github.com/nullbus)).
- Fixed dot repeat (`.`) after `:reg[isters]` ([@dannoe](https://github.com/dannoe)).
- Fixed overlapping text in Quick Pick caused by `:reg[isters]` ([@dannoe](https://github.com/dannoe)).
- Fixed some uses of `vim.remap` ([@jdanbrown](https://github.com/jdanbrown)).

## [v1.26.0](https://github.com/vscodevim/vim/tree/v1.26.0) (2023-09-09)

### Added

- Implemented `:m[ove]` ([@zhanyi22333](https://github.com/zhanyi22333)).
- Implemented `:red[o]` ([@hamza-tam](https://github.com/hamza-tam)).
- Implemented `:pu[t] =` ([@elazarcoh](https://github.com/elazarcoh)).

### Fixed

- Fixed misbehavior when selecting from bottom to top with shift+click ([@lqqyt2423](https://github.com/lqqyt2423)).
- Fixed `@@` when used in a different editor ([@J-Fields](https://github.com/J-Fields)).
- Fixed race condition in the `c` operator and a few other actions when `vim.autoSwitchInputMethod` is enabled ([@listenerri](https://github.com/listenerri)).
- Fixed `when` clause for provided `<C-p>` key bind to enable it being remapped ([@grosssoftware](https://github.com/grosssoftware)).
- Fixed `:sp[lit] [file]` ([@fernando-gap](https://github.com/fernando-gap)).
- Fixed `<Tab>` key bind which was blocking menu navigation in VS Code's find dialog ([@devrelm](https://github.com/devrelm)).
- Fixed VSCode's auto-surround functionality in Insert mode ([@Elliot-Roberts](https://github.com/Elliot-Roberts)).
- Fixed `<C-d>` and `<C-u>` not respecting `[count]` ([@rpuhalovich](https://github.com/rpuhalovich)).

## [v1.25.2](https://github.com/vscodevim/vim/tree/v1.25.2) (2023-03-01)

### Added

- Support for `:w <FILENAME>` ([@JLMSC](https://github.com/JLMSC)).

### Changed

- Reduced extension bundle size by removing source maps ([@kidonng](https://github.com/kidonng)).
- Replaced "Report bug" popup on exceptions with an error log message ([@J-Fields](https://github.com/J-Fields)).

### Fixed

- Fixed remaps which pass multiple positional arguments to a command ([@elmar-peise](https://github.com/elmar-peise)).
- Fixed cursor position after certain surround actions ([@J-Fields](https://github.com/J-Fields)).

## [v1.25.0](https://github.com/vscodevim/vim/tree/v1.25.0) (2023-02-28)

### Added

- Support for `:cw[indow]`, `:lw[indow]`, and related commands ([@mogelbrod](https://github.com/mogelbrod)).

### Changed

- Logging is now done to a `LogOutputChannel`. It can be accessed in the `Output` panel and configured using `workbench.action.setLogLevel` ([@J-Fields](https://github.com/J-Fields)).
- Scope for settings under `vim.autoSwitchInputMethod.*` is now `machine` ([@Quanuanc](https://github.com/Quanuanc)).

### Fixed

- Fixed undo/redo after recent VS Code update ([@J-Fields](https://github.com/J-Fields)).
- Fixed `.` after exiting Visual mode or command line with `<Esc>` ([@wgr45097](https://github.com/wgr45097)).
- Fixed ex command line ranges with no explicit start, such as `,5` ([@lazygyu](https://github.com/lazygyu)).

## [v1.24.3](https://github.com/vscodevim/vim/tree/v1.24.3) (2022-11-06)

### Added

- Text registers can now be executed as macros with `@` ([@elazarcoh](https://github.com/elazarcoh)).

### Fixed

- Fixed some ex commands when repeated with `@:` ([@J-Fields](https://github.com/J-Fields)).
- Fixed cursor position after `gp` or `gP` in VisualBlock mode ([@burnsdy](https://github.com/burnsdy)).
- Fixed edge case of `i{` and `a{` ([@elazarcoh](https://github.com/elazarcoh)).

## [v1.24.2](https://github.com/vscodevim/vim/tree/v1.24.2) (2022-10-29)

### Added

- Support for the `'scrolloff'` option, which is mapped to VS Code's `editor.cursorSurroundingLines` setting ([@LinHeLurking](https://github.com/LinHeLurking)).

### Fixed

- Fixed indent (`>`) and outdent (`<`) in VisualBlock mode ([@burnsdy](https://github.com/burnsdy)).
- Fixed `cW` when the cursor is on the last character of a word ([@wgr45097](https://github.com/wgr45097)).
- Fixed indent textobjects (`ii`, `ai`, and `aI`) in VisualLine mode ([@mogelbrod](https://github.com/mogelbrod)).

## [v1.24.1](https://github.com/vscodevim/vim/tree/v1.24.1) (2022-09-26)

### Fixed

- Fixed `gt` and `gT` ([@J-Fields](https://github.com/J-Fields)).

## [v1.24.0](https://github.com/vscodevim/vim/tree/v1.24.0) (2022-09-26)

### Added

- Support for `zf`/`zd` commands, which fold/unfold arbitrary ranges ([@elazarcoh](https://github.com/elazarcoh)).
- Support for surrounding with function call ([@riccardofano](https://github.com/riccardofano)).
- Support for `:sor[t] n`, which sorts lines numerically, rather than lexicographically ([@jan25](https://github.com/jan25)).

### Changed

- `P` in Visual modes no longer overwrites the default register with the selection's contents ([@J-Fields](https://github.com/J-Fields)).
- Yanking block-wise now pads shorter lines with spaces ([@burnsdy](https://github.com/burnsdy)).
- `<C-]>` now goes to definition, not declaration ([@J-Fields](https://github.com/J-Fields)).
- `:tabn[ext] {N}` now goes to the Nth tab, not N tabs forward [@elazarcoh](https://github.com/elazarcoh).

### Fixed

- Fixed insertion of surrogate pairs, like emoji 🙂 ([@garzj](https://github.com/garzj)).
- Fixed `<BS>` and `<Del>` when cursor is at start of command line ([@J-Fields](https://github.com/J-Fields)).

## [v1.23.2](https://github.com/vscodevim/vim/tree/v1.23.2) (2022-08-01)

### Fixed

- Fix the jump list ([@pitkali](https://github.com/pitkali)).
- Make increment/decrement (`<C-a>` and `<C-x>`) preserve case of hex numbers ([@smallkirby](https://github.com/smallkirby)).
- Fix search highlights on inactive but visible editors ([@J-Fields](https://github.com/J-Fields)).

## [v1.23.1](https://github.com/vscodevim/vim/tree/v1.23.1) (2022-06-28)

### Fixed

- Fold commands such as `zo` and `zc` no longer throw error ([@J-Fields](https://github.com/J-Fields)).
- Fix regression in VisualBlock `c` ([@J-Fields](https://github.com/J-Fields)).

## [v1.23.0](https://github.com/vscodevim/vim/tree/v1.23.0) (2022-06-27)

### Added

- Partial implementation of the [targets.vim](https://github.com/wellle/targets.vim#quote-text-objects) plugin ([@elazarcoh](https://github.com/elazarcoh)).
  - See the configuration available under `vim.targets`.
- Support for `:breaka[dd]`, `:breakd[el]`, and `:breakl[ist]` ([@elazarcoh](https://github.com/elazarcoh)).
- Support for `:ret[ab]` ([@ivanmaeder](https://github.com/ivanmaeder)).
- Support for `:<` and `:>` ([@J-Fields](https://github.com/J-Fields)).
- In the replacement string of `:s[ubstitute]`, `~` stands for previous replace string ([@J-Fields](https://github.com/J-Fields)).

### Changed

- Searches now abort after ~1 second, rather than after finding 1000 matches ([@elazarcoh](https://github.com/elazarcoh)).
- In the replacement string of `:s[ubstitute]`, `&` (rather than `\&`) stands for entire matched text ([@J-Fields](https://github.com/J-Fields)).
- The `vim.textwidth` configuration option can now be set per-language ([@BlakeWilliams](https://github.com/BlakeWilliams)).

### Fixed

- Allow space in ex command file names if preceded by a backslash ([@J-Fields](https://github.com/J-Fields)).
- Fix Replace mode with multiple cursors ([@J-Fields](https://github.com/J-Fields)).
- Fix `<C-e>` and `<C-y>` (scroll view) with multiple cursors ([@J-Fields](https://github.com/J-Fields)).
- Fix `<C-^>` (go to alternate file) ([@J-Fields](https://github.com/J-Fields)).
- Fix the `CamelCaseMotion` plugin ([@rcywongaa](https://github.com/rcywongaa))
- Fix behavior around surrogate pairs ([@smallkirby](https://github.com/smallkirby)).
- Fix `:delm[arks]` ([@chewcw](https://github.com/chewcw)).
- Fix `<C-d>` in Insert mode when tabs are used ([@J-Fields](https://github.com/J-Fields)).
- Fix `c` in VisualBlock mode when block extends over short lines ([@J-Fields](https://github.com/J-Fields)).
- Make `c`, `s`, and `D` in VisualBlock mode copy to register ([@monjara](https://github.com/monjara)).
- Fix several edge cases of `gv` ([@J-Fields](https://github.com/J-Fields)).
- Fix `p` in Visual modes with multiple cursors ([@joel1st](https://github.com/joel1st)).
- Improve search performance ([@J-Fields](https://github.com/J-Fields)).

### Removed

- Remove the following deprecated and unused configuration ([@J-Fields](https://github.com/J-Fields)):
  - `vim.easymotionMarkerForegroundColorTwoChar`
  - `vim.easymotionMarkerWidthPerChar`
  - `vim.easymotionMarkerFontFamily`
  - `vim.easymotionMarkerFontSize`
  - `vim.easymotionMarkerMargin`

## **_For versions older than 1.23.0, please see [CHANGELOG.OLD.md](CHANGELOG.OLD.md)_**
