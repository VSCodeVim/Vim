import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';
import * as vscode from 'vscode';

import { TextEditor } from '../src/textEditor';
import { IConfiguration } from '../src/configuration/iconfiguration';
import { Globals } from '../src/globals';
import { Configuration } from './testConfiguration';

function rndName() {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 10);
}

async function createRandomFile(contents: string, fileExtension: string): Promise<vscode.Uri> {
  const tmpFile = join(os.tmpdir(), rndName() + fileExtension);
  fs.writeFileSync(tmpFile, contents);
  return vscode.Uri.file(tmpFile);
}

/**
 * Waits for the number of text editors in the current window to equal the
 * given expected number of text editors.
 *
 * @param numExpectedEditors Expected number of editors in the window
 */
export async function WaitForEditors(numExpectedEditors: number): Promise<void> {
  let waitForEditorChange = new Promise((c, e) => {
    if (vscode.window.visibleTextEditors.length === numExpectedEditors) {
      return c();
    }

    let editorChange = vscode.window.onDidChangeVisibleTextEditors(() => {
      if (vscode.window.visibleTextEditors.length === numExpectedEditors) {
        c();
      }
    });
  });

  try {
    await waitForEditorChange;
  } catch (error) {
    assert.fail(null, null, error.toString(), '');
  }
}

export function assertEqualLines(expectedLines: string[]) {
  for (let i = 0; i < expectedLines.length; i++) {
    let expected = expectedLines[i];
    let actual = TextEditor.readLineAt(i);
    assert.equal(
      actual,
      expected,
      `Content does not match; Expected=${expected}. Actual=${actual}.`
    );
  }

  assert.equal(TextEditor.getLineCount(), expectedLines.length, 'Line count does not match.');
}

/**
 * Assert that the first two arguments are equal, and fail a test otherwise.
 *
 * The only difference between this and assert.equal is that here we
 * check to ensure the types of the variables are correct.
 */
export function assertEqual<T>(one: T, two: T, message: string = ''): void {
  assert.equal(one, two, message);
}

export async function setupWorkspace(config: IConfiguration = new Configuration(), fileExtension: string = ''): Promise<any> {
  const file = await createRandomFile('', fileExtension);
  const doc = await vscode.workspace.openTextDocument(file);

  await vscode.window.showTextDocument(doc);

  Globals.mockConfiguration = config;
  reloadConfiguration();

  let activeTextEditor = vscode.window.activeTextEditor;
  assert.ok(activeTextEditor);

  activeTextEditor!.options.tabSize = config.tabstop;
  activeTextEditor!.options.insertSpaces = config.expandtab;
}

export async function cleanUpWorkspace(): Promise<any> {
  return new Promise((c, e) => {
    if (vscode.window.visibleTextEditors.length === 0) {
      return c();
    }

    // TODO: the visibleTextEditors variable doesn't seem to be
    // up to date after a onDidChangeActiveTextEditor event, not
    // even using a setTimeout 0... so we MUST poll :(
    let interval = setInterval(() => {
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
    assert.equal(vscode.window.visibleTextEditors.length, 0, "Expected all editors closed.");
    assert(!vscode.window.activeTextEditor, "Expected no active text editor.");
  });
}

export function reloadConfiguration() {
  require('../src/configuration/configuration').configuration.reload();
}

export function crossPlatformIt(text: string): string {
  if (process.platform === 'win32') {
    return text.replace(/\\n/g, '\\r\\n');
  }
  return text;
}
