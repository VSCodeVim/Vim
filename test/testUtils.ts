import { strict as assert } from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { join } from 'path';
import { promisify } from 'util';
import * as vscode from 'vscode';

import { ExCommandLine } from '../src/cmd_line/commandLine';
import { IConfiguration } from '../src/configuration/iconfiguration';
import { Globals } from '../src/globals';
import { StatusBar } from '../src/statusBar';
import { Configuration } from './testConfiguration';
import { TextEditor } from '../src/textEditor';
import { ModeHandlerMap } from '../src/mode/modeHandlerMap';

class TestMemento implements vscode.Memento {
  private mapping = new Map<string, any>();
  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  get(key: any, defaultValue?: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
    return this.mapping.get(key) || defaultValue;
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
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substring(0, 10);
}

export async function createFile(
  args: {
    fsPath?: string;
    fileExtension?: string;
    contents?: string;
  } = {},
): Promise<string> {
  args.fsPath ??= join(os.tmpdir(), rndName() + (args.fileExtension ?? ''));
  await promisify(fs.writeFile)(args.fsPath, args.contents ?? '');
  return args.fsPath;
}

export async function createDir(fsPath?: string): Promise<string> {
  fsPath ??= join(os.tmpdir(), rndName());
  await promisify(fs.mkdir)(fsPath);
  return fsPath;
}

/**
 * Waits for the number of text editors in the current window to equal the
 * given expected number of text editors.
 *
 * @param numExpectedEditors Expected number of editors in the window
 */
export async function waitForEditorsToClose(numExpectedEditors: number = 0): Promise<void> {
  const waitForTextEditorsToClose = new Promise<void>((c, e) => {
    if (vscode.window.visibleTextEditors.length === numExpectedEditors) {
      return c();
    }

    const subscription = vscode.window.onDidChangeVisibleTextEditors(() => {
      if (vscode.window.visibleTextEditors.length === numExpectedEditors) {
        subscription.dispose();
        c();
      }
    });
  });

  try {
    await waitForTextEditorsToClose;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    assert.fail(error);
  }
}

export function assertEqualLines(expectedLines: string[]) {
  assert.strictEqual(
    vscode.window.activeTextEditor?.document.getText(),
    expectedLines.join(os.EOL),
    'Document content does not match.',
  );
}

export function assertStatusBarEqual(
  expectedText: string,
  message: string = 'Status bar text does not match',
) {
  assert.strictEqual(StatusBar.getText(), expectedText, message);
}

export async function setupWorkspace(
  args: {
    config?: Partial<IConfiguration>;
    fileExtension?: string;
  } = {},
): Promise<void> {
  await ExCommandLine.loadHistory(new TestExtensionContext());

  if (
    vscode.window.activeTextEditor === undefined ||
    vscode.window.activeTextEditor.document.isUntitled ||
    vscode.window.visibleTextEditors.length > 1 ||
    (args.fileExtension &&
      !vscode.window.activeTextEditor.document.fileName.endsWith(args.fileExtension))
  ) {
    await cleanUpWorkspace();
    const filePath = await createFile({ fileExtension: args.fileExtension });
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
    await vscode.window.showTextDocument(doc);
  }

  Globals.mockConfiguration = new Configuration();
  Object.assign(Globals.mockConfiguration, args?.config ?? {});
  await reloadConfiguration();

  const activeTextEditor = vscode.window.activeTextEditor;
  assert.ok(activeTextEditor);

  activeTextEditor.options.tabSize = Globals.mockConfiguration.tabstop;
  activeTextEditor.options.insertSpaces = Globals.mockConfiguration.expandtab;

  assert.ok(
    await activeTextEditor.edit((builder) => {
      builder.delete(
        new vscode.Range(
          new vscode.Position(0, 0),
          TextEditor.getDocumentEnd(activeTextEditor.document),
        ),
      );
    }),
    'Edit failed',
  );
  ModeHandlerMap.clear();
}

export async function cleanUpWorkspace(): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  assert.strictEqual(vscode.window.visibleTextEditors.length, 0, 'Expected all editors closed.');
  assert(!vscode.window.activeTextEditor, 'Expected no active text editor.');
}

export async function reloadConfiguration() {
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
  await new Promise((resolve, reject) => {
    setTimeout(resolve, 500);

    const subscription = vscode.window.onDidChangeActiveTextEditor((textEditor) => {
      subscription.dispose();

      resolve(textEditor);
    });
  });
}
