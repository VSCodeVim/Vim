import { strict as assert } from 'assert';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { isDeepStrictEqual } from 'util';
import * as vscode from 'vscode';

import { ExCommandLine, SearchCommandLine } from '../src/cmd_line/commandLine';
import { PutExCommand } from '../src/cmd_line/commands/put';
import { IConfiguration } from '../src/configuration/iconfiguration';
import { Globals } from '../src/globals';
import { HistoryTracker } from '../src/history/historyTracker';
import { ModeHandlerMap } from '../src/mode/modeHandlerMap';
import { Register } from '../src/register/register';
import { globalState } from '../src/state/globalState';
import { StatusBar } from '../src/statusBar';
import { TextEditor } from '../src/textEditor';
import { EvaluationContext } from '../src/vimscript/expression/evaluate';
import { Configuration } from './testConfiguration';

/**
 * Resets state shared across editors, so that tests don't depend on what ran before them.
 * Runs before every test, ahead of its `setup` hooks (see `rootHooks` in `index.ts`), so state a
 * suite's `setup` creates on purpose is kept.
 */
export function resetGlobalState(): void {
  globalState.jumpTracker.clearJumps();
  globalState.previousFullAction = undefined;
  globalState.lastInvokedMacro = undefined;
  globalState.substituteState = undefined;
  globalState.searchState = undefined;
  globalState.hl = true;

  Register.clearAllRegisters();
  HistoryTracker.clearGlobalMarks();
  SearchCommandLine.previousSearchStates.length = 0;

  // These are private; bracket access lets us reset them without widening their visibility
  /* eslint-disable @typescript-eslint/dot-notation */
  PutExCommand['lastExpression'] = undefined;
  EvaluationContext['globalVariables'].clear();
  /* eslint-enable @typescript-eslint/dot-notation */
}

class TestMemento implements vscode.Memento {
  private mapping = new Map<string, any>();
  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  get(key: any, defaultValue?: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
    return this.mapping.has(key) ? this.mapping.get(key) : defaultValue;
  }

  setKeysForSync(keys: string[]): void {
    throw new Error('`TestMemento.setKeysForSync` is currently unimplemented');
  }

  async update(key: string, value: any): Promise<void> {
    this.mapping.set(key, value);
  }

  keys(): readonly string[] {
    return Array.from(this.mapping.keys());
  }
}

export class TestExtensionContext implements vscode.ExtensionContext {
  extension!: vscode.Extension<any>;
  subscriptions: Array<{ dispose(): any }> = [];
  workspaceState: vscode.Memento = new TestMemento();
  globalState: vscode.Memento & {
    setKeysForSync(keys: string[]): void;
  } = new TestMemento();
  secrets!: vscode.SecretStorage;
  extensionUri!: vscode.Uri;
  extensionPath: string = 'inmem:///test';
  environmentVariableCollection!: vscode.EnvironmentVariableCollection;

  asAbsolutePath(relativePath: string): string {
    return path.resolve(this.extensionPath, relativePath);
  }

  storageUri: vscode.Uri | undefined;
  storagePath: string | undefined;
  globalStorageUri!: vscode.Uri;
  globalStoragePath!: string;
  logUri!: vscode.Uri;
  logPath!: string;
  extensionMode!: vscode.ExtensionMode;
}

export function rndName(): string {
  return randomBytes(6).toString('hex');
}

let testTempDir: string | undefined;

/**
 * A directory holding this test run's temporary files, created on first use.
 * It is deleted by `removeTestTempDir` when the run finishes.
 */
export function getTestTempDir(): string {
  testTempDir ??= fs.mkdtempSync(path.join(os.tmpdir(), 'vscodevim-test-'));
  return testTempDir;
}

export async function removeTestTempDir(): Promise<void> {
  if (testTempDir === undefined) {
    return;
  }
  try {
    await fs.promises.rm(testTempDir, { recursive: true, force: true, maxRetries: 3 });
    testTempDir = undefined;
  } catch (error) {
    // Don't fail the run over leftover temp files (e.g. a file still locked on Windows)
    console.warn(`Failed to remove test temp dir '${testTempDir}':`, error);
  }
}

export async function createFile(
  args: {
    fsPath?: string;
    fileExtension?: string;
    contents?: string;
  } = {},
): Promise<string> {
  if (args.fileExtension) {
    assert.ok(args.fileExtension.startsWith('.'));
  }
  args.fsPath ??= path.join(getTestTempDir(), rndName() + (args.fileExtension ?? ''));
  await fs.promises.writeFile(args.fsPath, args.contents ?? '');
  return args.fsPath;
}

export async function createDir(fsPath?: string): Promise<string> {
  fsPath ??= path.join(getTestTempDir(), rndName());
  await fs.promises.mkdir(fsPath);
  return fsPath;
}

/**
 * Waits for the number of text editors in the current window to equal the
 * given expected number of text editors.
 *
 * @param numExpectedEditors Expected number of editors in the window
 * @param timeoutMs How long to wait before failing; kept below Mocha's timeout so this message wins
 */
export async function waitForEditorsToClose(
  numExpectedEditors: number = 0,
  timeoutMs: number = 3000,
): Promise<void> {
  if (vscode.window.visibleTextEditors.length === numExpectedEditors) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const subscription = vscode.window.onDidChangeVisibleTextEditors(() => {
      if (vscode.window.visibleTextEditors.length === numExpectedEditors) {
        clearTimeout(timer);
        subscription.dispose();
        resolve();
      }
    });
    const timer = setTimeout(() => {
      subscription.dispose();
      const editors = vscode.window.visibleTextEditors.map((e) => e.document.uri.toString());
      const tabs = vscode.window.tabGroups.all.flatMap((group) =>
        group.tabs.map(
          (tab) =>
            `${group.viewColumn}:${tab.label}` +
            `${tab.isActive ? ' (active)' : ''}${tab.isPreview ? ' (preview)' : ''}` +
            `${group.isActive ? '' : ' (inactive group)'}`,
        ),
      );
      reject(
        new Error(
          `Expected ${numExpectedEditors} visible editors, ` +
            `found ${editors.length} after ${timeoutMs}ms. ` +
            `Editors: ${JSON.stringify(editors)}. Tabs: ${JSON.stringify(tabs)}`,
        ),
      );
    }, timeoutMs);
  });
}

export function assertEqualLines(expectedLines: string[]) {
  assert.equal(
    vscode.window.activeTextEditor?.document.getText(),
    expectedLines.join(os.EOL),
    'Document content does not match.',
  );
}

export function assertStatusBarEqual(
  expectedText: string,
  message: string = 'Status bar text does not match',
) {
  assert.equal(StatusBar.getText(), expectedText, message);
}

/**
 * Opens a new file in the test temp directory and makes it the active editor. Other editors stay
 * open; call `cleanUpWorkspace` first to close them.
 */
export async function openNewFile(
  args: { fileExtension?: string; content?: string[] } = {},
): Promise<vscode.TextEditor> {
  const filePath = await createFile({
    fileExtension: args.fileExtension,
    contents: (args.content ?? []).join(os.EOL),
  });
  const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
  const editor = await vscode.window.showTextDocument(doc);
  syncEditorOptions(editor);
  return editor;
}

/**
 * Replaces the configuration with the test defaults plus `config`. Applies to the active editor's
 * tab settings too, so VS Code's own indentation agrees with Vim's.
 */
export async function setConfig(config: Partial<IConfiguration> = {}): Promise<void> {
  await reloadConfiguration(new Configuration(config));
  if (vscode.window.activeTextEditor) {
    syncEditorOptions(vscode.window.activeTextEditor);
  }
}

function syncEditorOptions(editor: vscode.TextEditor): void {
  editor.options.tabSize = Globals.mockConfiguration.tabstop;
  editor.options.insertSpaces = Globals.mockConfiguration.expandtab;
}

/**
 * Gets a suite ready to run: one file editor showing `fileContent`, the configuration from
 * `setConfig(config)`, and no `ModeHandler`s. Reuses the active editor when it's the only one and
 * has the right file extension, since opening a file is slow.
 */
export async function setupWorkspace(
  args: {
    config?: Partial<IConfiguration>;
    fileExtension?: string;
    fileContent?: string[];
  } = {},
): Promise<void> {
  await ExCommandLine.loadHistory(new TestExtensionContext());

  const editor = vscode.window.activeTextEditor;
  if (
    editor === undefined ||
    editor.document.isUntitled ||
    vscode.window.visibleTextEditors.length > 1 ||
    (args.fileExtension && !editor.document.fileName.endsWith(args.fileExtension))
  ) {
    await cleanUpWorkspace();
    await openNewFile({ fileExtension: args.fileExtension, content: args.fileContent });
  } else {
    const content = (args.fileContent ?? []).join(os.EOL);
    assert.ok(
      await editor.edit((builder) => {
        builder.replace(TextEditor.getDocumentRange(editor.document), content);
      }),
      'Edit failed',
    );
  }

  await setConfig(args.config);
  ModeHandlerMap.clear();
}

export async function cleanUpWorkspace(): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  assert.equal(vscode.window.visibleTextEditors.length, 0, 'Expected all editors closed.');
  assert(!vscode.window.activeTextEditor, 'Expected no active text editor.');
}

export async function reloadConfiguration(config: IConfiguration) {
  Globals.mockConfiguration = config;

  const validatorResults = await (
    await import('../src/configuration/configuration')
  ).configuration.load();
  for (const validatorResult of validatorResults.get()) {
    console.warn(validatorResult);
  }
}

/**
 * Saves the configuration, returning a function that restores it if it changed. Reloading is slow,
 * so most tests, which change nothing, shouldn't pay for it.
 */
export async function saveConfig(): Promise<() => Promise<void>> {
  const { configuration } = await import('../src/configuration/configuration');
  const snapshot = () => {
    const mock = Globals.mockConfiguration as unknown as Record<string, unknown>;
    const loaded = configuration as unknown as Record<string, unknown>;
    // Check the loaded values too, since commands like `:set` change only those. Snapshot deeply,
    // since remaps are mutated in place when the config is validated.
    return structuredClone({ mock, loaded: Object.keys(mock).map((key) => loaded[key]) });
  };
  const saved = snapshot();
  return async () => {
    if (!isDeepStrictEqual(snapshot(), saved)) {
      await reloadConfiguration(saved.mock as unknown as IConfiguration);
    }
  };
}

/**
 * Waits for the tabs to change after a command like 'gt' or 'gT' is run.
 * Sometimes it is not immediate, so we must busy wait
 * On certain versions, the tab changes are synchronous
 * For those, a timeout is given
 */
export async function waitForTabChange(): Promise<void> {
  await new Promise<void>((resolve) => {
    const subscription = vscode.window.onDidChangeActiveTextEditor(() => {
      clearTimeout(timer);
      subscription.dispose();
      resolve();
    });
    const timer = setTimeout(() => {
      subscription.dispose();
      resolve();
    }, 500);
  });
}

export async function replaceContent(
  document: vscode.TextDocument,
  content: string,
): Promise<void> {
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, TextEditor.getDocumentRange(document), content);
  const isApplied = await vscode.workspace.applyEdit(edit);

  if (!isApplied) throw new Error(`Failed to replace content`);
}
