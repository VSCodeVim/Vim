# VSCodeVim — Agent Instructions

VSCodeVim is a VS Code extension (TypeScript) that emulates Vim modal editing. It targets both desktop and web VS Code environments.

Prerequisites: Node.js 24+ and pnpm 12 (`corepack enable` installs the pinned version).

## Build & Test

```bash
pnpm build-dev       # Fast dev build
pnpm build           # Production build
pnpm watch           # Rebuild on file changes

npx gulp test                  # Run tests in Docker (preferred)
npx gulp test --grep <REGEX>   # Run filtered tests in Docker (matches suite and test names)
pnpm build-test && pnpm test   # Run tests locally (close all VS Code instances first)
pnpm build-dev && pnpm test-web  # Run web extension smoke tests (test/web/) in headless Chromium

pnpm lint            # Check code style
pnpm lint:fix        # Auto-fix linting issues
pnpm prettier        # Format code
pnpm prettier:check  # Check formatting
```

`npx gulp test` needs Docker running; if it isn't, ask the user to start it rather than falling back to local tests. The container keeps its own `node_modules`, `out/`, and VS Code download in Docker volumes, so it doesn't use the host's build output.

CI runs `pnpm prettier:check`, `pnpm lint`, and the tests on Ubuntu and Windows, plus the web smoke tests. The pre-commit hook runs `lint-staged`, which formats staged files with Prettier and runs `eslint --fix` on staged `.ts` files.

## Architecture

**Event flow:** Key press → `extensionBase.ts` (shared by the `extension.ts` desktop and `extensionWeb.ts` web entry points) → `ModeHandler.handleKeyEvent()` → action matching → `runAction()` → `updateView()`

Key directories:

- `src/actions/` — Action base classes (`base.ts`), motions (`motion.ts`), operators (`operator.ts`, including commentary's `gc`/`gC`), and text objects
- `src/actions/commands/` — Commands grouped by area (`insert.ts`, `search.ts`, `put.ts`, `visual.ts`, ...); large consolidated files are intentional
- `src/actions/plugins/` — Emulated Vim plugins (easymotion, surround, sneak, camelCaseMotion, replaceWithRegister, targets, imswitcher)
- `src/actions/languages/` — Language-specific motions (e.g. Python)
- `src/textobject/` — Word, sentence, and paragraph logic used by motions and text objects
- `src/mode/modeHandler.ts` — Central state machine; one instance per open editor
- `src/state/vimState.ts` — Per-editor state (cursors, mode, undo history and marks via `historyTracker`)
- `src/state/globalState.ts` — State shared across editors (jump list, last search and substitute, last action for `.`)
- `src/state/recordedState.ts` — Transient state for the current operation; resets after each action
- `src/vimscript/` — Ex command line parsing: `exCommandParser.ts` (command table), `lineRange.ts`, `pattern.ts`, `expression/`
- `src/cmd_line/commands/` — One file per Ex command implementation
- `src/register/` — Registers, which are global (static on `Register`), not per-editor
- `src/history/`, `src/jumps/` — Undo history and marks, jump list
- `src/configuration/` — Settings loading and validation, remaps, `.vimrc` loading
- `src/neovim/` — Optional Neovim process integration for Ex commands
- `src/platform/node/` and `src/platform/browser/` — Platform-specific abstractions
- `test/` — Mirrors `src/` structure; uses Mocha + Sinon + `@vscode/test-electron`

**Three action base classes:**

- `BaseMovement` — Updates cursor only; returns `Position` or `IMovement` (start+end for text objects)
- `BaseCommand` — Modifies `VimState` beyond cursor movement
- `BaseOperator` — Combines with a movement (e.g. `d{motion}`, `c{motion}`)

## Where Changes Go

- **Motion, operator, or command:** a class decorated with `@RegisterAction` in the matching file under `src/actions/`
- **Ex command:** an implementation in `src/cmd_line/commands/`, plus an entry in `builtinExCommands` in `src/vimscript/exCommandParser.ts`
- **Setting:** the schema in `package.json`, the type in `src/configuration/iconfiguration.ts`, the default in `src/configuration/configuration.ts`, and the default in `test/testConfiguration.ts`; document it in `README.md`
- **Plugin:** a file or folder in `src/actions/plugins/`, with default mappings in `pluginDefaultMappings.ts` if it has any

## Writing Tests

Most tests use `newTest` from `test/testSimplifier.ts`. `|` marks the cursor position in `start` and `end`:

```ts
newTest({
  title: 'gcc comments out current line',
  start: ['first line', '|second line'],
  keysPressed: 'gcc',
  end: ['first line', '|// second line'],
});
```

When `endMode` is a Visual mode, `end` marks each selection instead: `[` and `]` surround the characters from the anchor to the cursor, and `|` goes just before the character the cursor is on, which is the first or last one in the brackets, e.g. `a[b|c]d` (cursor on `c`) or `a[|bc]d` (cursor on `b`). A one-character selection is `a[|b]c`. In Visual Line and Visual Block mode the brackets still mark the anchor and cursor characters; the harness derives the expected line or block selections from them. A failing Visual mode check prints the actual state in this notation.

Optional fields include `endMode` (defaults to `Mode.Normal`, so a test ending in any other mode must say so), `config` (a partial configuration applied for that test only), `remaps` (.vimrc lines such as `'nmap J jj'`), `registers`, `statusBar`, `jumps`, and `inputBox` (the text to enter when the keys open an input box, e.g. surround's tag prompt). For a test with several steps, each starting where the previous one ended, replace `keysPressed` and the expected fields with `steps`, a list of `{ title?, keysPressed, end?, ... }`. A step without `end` expects the document and cursors to be unchanged from the previous step. A step can also check the state after the remap timeout fires with `afterTimeout: { end?, ... }`. Use `newTestOnly` / `newTestSkip` to focus on or skip a test. Call `setupWorkspace()` from `test/testUtils.ts` in `suiteSetup` when a suite needs a specific file type or config. For finer control, `setConfig()` replaces the configuration, and `openNewFile()` opens another file.

## Conventions

- TypeScript `strict: true` + `noImplicitOverride: true` — always use the `override` keyword when overriding parent methods
- `IMovement` interface (not just `Position`) is required when a motion needs to return a range (e.g. text objects like `aw`, `i{`)
- Platform abstraction via `src/platform/` — never call Node.js APIs directly; import the platform modules (e.g. `import { readFileAsync } from 'platform/fs'`), which the build resolves to the node or browser version, so web VS Code works
- Settings precedence: Ex-commands → user/workspace VS Code settings → defaults
- `.vimrc` support is remaps-only — no full Vimscript execution

## References

- [CONTRIBUTING.md](.github/CONTRIBUTING.md) — Setup, architecture deep-dive, release process
- [README.md](README.md) — All supported settings, emulated plugins, keybindings
- `gulpfile.js` — Build/test/release automation tasks
- `package.json` — Extension manifest and all configuration schema definitions
