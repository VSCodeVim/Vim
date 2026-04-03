# Copilot Instructions for VSCodeVim

## Project Overview

- **VSCodeVim** is a complex VS Code extension that emulates Vim behavior within VS Code. It is written in TypeScript and targets both desktop and web environments.
- The codebase is organized by Vim concepts: actions, motions, operators, modes, state, configuration, and plugin emulation. See `src/` for main logic, with subfolders for each concept.
- The extension supports advanced features like `.vimrc` parsing, Neovim integration, multi-cursor, and emulated Vim plugins (see `README.md` for the full list).

## Key Architectural Patterns

- **Mode Handler:** Each open document is managed by a `ModeHandler` (`src/mode/`), which can be compared to an instance of Vim. State transitions and command dispatch are centralized here.
- **State Management:** Each `ModeHandler` has a `VimState` (`src/state/vimState.ts`) which tracks the current mode, cursor, registers, and more. State is passed through most command flows.
- **Action/Motion/Operator Classes:** User input is parsed into actions, motions, and operators (see `src/actions/`). These are composed to implement Vim commands.
- **Configuration:** Settings are loaded from VS Code config, `.vimrc`, and defaults, in that order. See `src/configuration/` and `README.md` for details.
- **Plugin Emulation:** Many Vim plugins are emulated natively (see `src/actions/plugins/` and `README.md` > Emulated Plugins).
- **Neovim Integration:** If enabled, some Ex-commands are delegated to a Neovim process (`src/neovim/`).

## Developer Workflows

- **Build:** Use `yarn build-dev` (or the VS Code task) to build the extension. See `package.json` and `gulpfile.js` for all tasks.
- **Test:** Run tests with `yarn build-test` then `yarn test`. Tests are in `test/` and mirror the structure of `src/`.
- **Debug:** Launch the extension in the Extension Development Host via VS Code's debugger. Use breakpoints in TypeScript files.
- **Release:** Versioning and release tasks are managed via Gulp (`gulpfile.js`).

## Project-Specific Conventions

- **Remapping:** Key remapping is handled via configuration and `.vimrc`. Only remaps are supported in `.vimrc` (see `README.md`).
- **Settings Precedence:** Settings are loaded in this order: Ex-commands, user/workspace settings, VS Code settings, then defaults.
- **Plugin Emulation:** Emulated plugins are implemented as native TypeScript, not as Vimscript or external scripts.
- **Testing:** Tests are colocated with the feature under test (e.g., `test/actions/`, `test/mode/`).
- **Cross-Platform:** Some features (e.g., input method switching) require platform-specific configuration (see `README.md`).

## Integration Points

- **VS Code API:** Extension entry point is `extension.ts`. All VS Code API usage is centralized here and in `extensionBase.ts`/`extensionWeb.ts`.
- **Neovim:** Integration is optional and controlled by settings. See `src/neovim/`.
- **Status Bar:** Status bar updates are handled in `src/statusBar.ts`.

## References

- See `README.md` for user-facing documentation, settings, and plugin support.
- See `gulpfile.js` for build/test/release automation.
- See `src/` for main extension logic, organized by Vim concept.
- See `test/` for tests, which mirror the structure of `src/`.

---

If you are unsure about a pattern or workflow, check the `README.md` or the relevant subdirectory in `src/` or `test/`. For new features, follow the structure and conventions of existing code.
