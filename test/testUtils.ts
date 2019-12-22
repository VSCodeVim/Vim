import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';
import { promisify } from 'util';
import * as vscode from 'vscode';

import { Configuration } from './testConfiguration';
import { Globals } from '../src/globals';
import { ValidatorResults } from '../src/configuration/iconfigurationValidator';
import { IConfiguration } from '../src/configuration/iconfiguration';
import { TextEditor } from '../src/textEditor';
import { getAndUpdateModeHandler } from '../extension';
import { commandLine } from '../src/cmd_line/commandLine';

export function rndName(): string {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 10);
}

export async function createRandomFile(contents: string, fileExtension: string): Promise<string> {
  const tmpFile = join(os.tmpdir(), rndName() + fileExtension);
  await promisify(fs.writeFile)(tmpFile, contents);
  return tmpFile;
}

export function createRandomDir() {
  const dirPath = join(os.tmpdir(), rndName());
  return createDir(dirPath);
}

export async function createEmptyFile(path: string) {
  await promisify(fs.writeFile)(path, '');
  return path;
}

export async function createDir(path: string) {
  await promisify(fs.mkdir)(path);
  return path;
}

export function removeFile(path: string) {
  return promisify(fs.unlink)(path);
}

export function removeDir(path: string) {
  return promisify(fs.rmdir)(path);
}

/**
 * Waits for the number of text editors in the current window to equal the
 * given expected number of text editors.
 *
 * @param numExpectedEditors Expected number of editors in the window
 */
export async function WaitForEditorsToClose(numExpectedEditors: number = 0): Promise<void> {
  const waitForTextEditorsToClose = new Promise((c, e) => {
    if (vscode.window.visibleTextEditors.length === numExpectedEditors) {
      return c();
    }

    vscode.window.onDidChangeVisibleTextEditors(() => {
      if (vscode.window.visibleTextEditors.length === numExpectedEditors) {
        c();
      }
    });
  });

  try {
    await waitForTextEditorsToClose;
  } catch (error) {
    assert.fail(null, null, error.toString(), '');
  }
}

export function assertEqualLines(expectedLines: string[]) {
  for (let i = 0; i < expectedLines.length; i++) {
    const expected = expectedLines[i];
    const actual = TextEditor.readLineAt(i);
    assert.strictEqual(
      actual,
      expected,
      `Content does not match; Expected=${expected}. Actual=${actual}.`
    );
  }

  assert.strictEqual(TextEditor.getLineCount(), expectedLines.length, 'Line count does not match.');
}

/**
 * Assert that the first two arguments are equal, and fail a test otherwise.
 *
 * The only difference between this and assert.strictEqual is that here we
 * check to ensure the types of the variables are correct.
 */
export function assertEqual<T>(one: T, two: T, message: string = ''): void {
  assert.strictEqual(one, two, message);
}

export async function setupWorkspace(
  config: IConfiguration = new Configuration(),
  fileExtension: string = ''
): Promise<void> {
  await commandLine.load();
  const filePath = await createRandomFile('', fileExtension);
  const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));

  await vscode.window.showTextDocument(doc);

  Globals.mockConfiguration = config;
  await reloadConfiguration();

  const activeTextEditor = vscode.window.activeTextEditor;
  assert.ok(activeTextEditor);

  activeTextEditor!.options.tabSize = config.tabstop;
  activeTextEditor!.options.insertSpaces = config.expandtab;

  await mockAndEnable();
}

const mockAndEnable = async () => {
  await vscode.commands.executeCommand('setContext', 'vim.active', true);
  const mh = await getAndUpdateModeHandler();
  Globals.mockModeHandler = mh;
  await mh.handleKeyEvent('<ExtensionEnable>');
};

export async function cleanUpWorkspace(): Promise<void> {
  return new Promise((c, e) => {
    if (vscode.window.visibleTextEditors.length === 0) {
      return c();
    }

    // TODO: the visibleTextEditors variable doesn't seem to be
    // up to date after a onDidChangeActiveTextEditor event, not
    // even using a setTimeout 0... so we MUST poll :(
    const interval = setInterval(() => {
      if (vscode.window.visibleTextEditors.length > 0) {
        return;
      }

      clearInterval(interval);
      c();
    }, 10);

    vscode.commands.executeCommand('workbench.action.closeAllEditors').then(
      () => null,
      (err: any) => {
        clearInterval(interval);
        e(err);
      }
    );
  }).then(() => {
    assert.strictEqual(vscode.window.visibleTextEditors.length, 0, 'Expected all editors closed.');
    assert(!vscode.window.activeTextEditor, 'Expected no active text editor.');
  });
}

export async function reloadConfiguration() {
  const validatorResults = (await require('../src/configuration/configuration').configuration.load()) as ValidatorResults;
  for (const validatorResult of validatorResults.get()) {
    console.log(validatorResult);
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

    const disposer = vscode.window.onDidChangeActiveTextEditor(textEditor => {
      disposer.dispose();

      resolve(textEditor);
    });
  });
}
