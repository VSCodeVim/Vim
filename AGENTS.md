# VSCodeVim — Agent Instructions

VSCodeVim is a VS Code extension (TypeScript) that emulates Vim modal editing. It targets both desktop and web VS Code environments.

## Build & Test

```bash
pnpm build-dev       # Fast dev build
pnpm build           # Production build
pnpm watch           # Rebuild on file changes

pnpm build-test && pnpm test   # Run tests locally (close all VS Code instances first)
npx gulp test                  # Run tests in Docker (preferred)
npx gulp test --grep <REGEX>   # Run filtered tests in Docker
pnpm build-dev && pnpm test-web  # Run web extension smoke tests (test/web/) in headless Chromium

pnpm lint            # Check code style
pnpm lint:fix        # Auto-fix linting issues
pnpm prettier        # Format code
```

## Architecture

**Event flow:** Key press → `extension.ts` → `ModeHandler.handleKeyEvent()` → action matching → `runAction()` → `updateView()`

Key directories:

- `src/actions/` — All command/motion/operator implementations; large consolidated files (e.g. `insert.ts`, `search.ts`) are intentional
- `src/actions/plugins/` — Emulated Vim plugins (easymotion, surround, sneak, commentary, etc.)
- `src/mode/modeHandler.ts` — Central state machine; one instance per open editor
- `src/state/vimState.ts` — Per-editor state (cursor, registers, mode, history)
- `src/state/recordedState.ts` — Transient state for the current operation; resets after each action
- `src/cmd_line/` — Ex command (`:`) parsing and execution
- `src/configuration/` — Settings loading and validation
- `src/neovim/` — Optional Neovim process integration for Ex commands
- `src/platform/node/` and `src/platform/browser/` — Platform-specific abstractions
- `test/` — Mirrors `src/` structure; uses Mocha + Sinon + `@vscode/test-electron`

**Three action base classes:**

- `BaseMovement` — Updates cursor only; returns `Position` or `IMovement` (start+end for text objects)
- `BaseCommand` — Modifies `VimState` beyond cursor movement
- `BaseOperator` — Combines with a movement (e.g. `d{motion}`, `c{motion}`)

## Conventions

- TypeScript `strict: true` + `noImplicitOverride: true` — always use the `override` keyword when overriding parent methods
- `IMovement` interface (not just `Position`) is required when a motion needs to return a range (e.g. text objects like `aw`, `i{`)
- Platform abstraction via `/src/platform/` — never call Node.js APIs directly; use the abstraction layer so web VS Code works
- Settings precedence: Ex-commands → user/workspace VS Code settings → defaults
- `.vimrc` support is remaps-only — no full Vimscript execution
- Actions are registered by decorating classes; see existing action files for the pattern

## References

- [CONTRIBUTING.md](.github/CONTRIBUTING.md) — Setup, architecture deep-dive, release process
- [README.md](README.md) — All supported settings, emulated plugins, keybindings
- `gulpfile.js` — Build/test/release automation tasks
- `package.json` — Extension manifest, all configuration schema definitions (40+ settings)
