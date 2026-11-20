import { strict as assert } from 'assert';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

import { ExCommandLine } from '../src/cmd_line/commandLine';
import { IConfiguration } from '../src/configuration/iconfiguration';
import { Globals } from '../src/globals';
import { ModeHandlerMap } from '../src/mode/modeHandlerMap';
import { StatusBar } from '../src/statusBar';
import { TextEditor } from '../src/textEditor';
import { Configuration } from './testConfiguration';

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

export async function setupWorkspace(
  args: {
    config?: Partial<IConfiguration>;
    fileExtension?: string;
    fileContent?: string[];
    forceNewFile?: boolean;
    disableCleanUp?: boolean;
  } = {},
): Promise<void> {
  await ExCommandLine.loadHistory(new TestExtensionContext());

  const newFile =
    vscode.window.activeTextEditor === undefined ||
    vscode.window.activeTextEditor.document.isUntitled ||
    vscode.window.visibleTextEditors.length > 1 ||
    (args.fileExtension &&
      !vscode.window.activeTextEditor.document.fileName.endsWith(args.fileExtension)) ||
    args.forceNewFile;
  const fileContent = (args.fileContent ?? []).join(os.EOL);

  if (newFile) {
    if (!args.disableCleanUp) await cleanUpWorkspace();
    const filePath = await createFile({
      fileExtension: args.fileExtension,
      contents: fileContent,
    });
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
    await vscode.window.showTextDocument(doc);
  }

  const config = new Configuration(args?.config);
  await reloadConfiguration(config);

  const activeTextEditor = vscode.window.activeTextEditor;
  assert.ok(activeTextEditor);

  activeTextEditor.options.tabSize = config.tabstop;
  activeTextEditor.options.insertSpaces = config.expandtab;

  if (!newFile) {
    assert.ok(
      await activeTextEditor.edit((builder) => {
        builder.replace(TextEditor.getDocumentRange(activeTextEditor.document), fileContent);
      }),
      'Edit failed',
    );
  }

  if (!args.disableCleanUp) ModeHandlerMap.clear();
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
