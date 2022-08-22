# Change Log

## Unreleased

### Changed

- `P` in Visual modes no longer overwrites the default register with the selection's contents ([@J-Fields](https://github.com/J-Fields)).
- Yanking block-wise now pads shorter lines with spaces ([@J-Fields](https://github.com/J-Fields)).
- `<C-]>` now goes to definition, not declaration ([@J-Fields](https://github.com/J-Fields)).

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
