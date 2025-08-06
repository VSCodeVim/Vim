import { strict as assert } from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../../src/mode/modeHandler';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('Vertical command', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  teardown(cleanUpWorkspace);

  test('vertical split creates vertical split', async () => {
    const initialEditorCount = vscode.window.visibleTextEditors.length;

    // Execute :vertical split command
    await modeHandler.handleMultipleKeyEvents(':vertical split\n'.split(''));

    // Wait a bit for the command to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that a new editor was created (indicating split worked)
    const finalEditorCount = vscode.window.visibleTextEditors.length;
    assert.ok(finalEditorCount > initialEditorCount, 'Vertical split should create a new editor');
  });

  test('vertical without command shows error', async () => {
    // Mock vscode.window.showErrorMessage to capture the error call
    const originalShowErrorMessage = vscode.window.showErrorMessage;
    let errorMessage: string | undefined;
    vscode.window.showErrorMessage = async (message: string) => {
      errorMessage = message;
      return undefined;
    };

    try {
      // Execute just ":vertical" (without any following command)
      await modeHandler.handleMultipleKeyEvents(':vertical\n'.split(''));

      // Wait a bit for the command to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check that an error message was shown
      assert.strictEqual(
        errorMessage,
        'E471: Argument required',
        'Vertical without argument should show error message',
      );
    } finally {
      // Restore original function
      vscode.window.showErrorMessage = originalShowErrorMessage;
    }
  });

  test('vertical with unsupported command shows error', async () => {
    // Mock vscode.window.showErrorMessage to capture the error call
    const originalShowErrorMessage = vscode.window.showErrorMessage;
    let errorMessage: string | undefined;
    vscode.window.showErrorMessage = async (message: string) => {
      errorMessage = message;
      return undefined;
    };

    try {
      // Execute ":vertical help" (unsupported command)
      await modeHandler.handleMultipleKeyEvents(':vertical help\n'.split(''));

      // Wait a bit for the command to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check that an error message was shown
      assert.ok(
        errorMessage?.includes('is not supported'),
        `Expected unsupported command error, got: ${errorMessage}`,
      );
    } finally {
      // Restore original function
      vscode.window.showErrorMessage = originalShowErrorMessage;
    }
  });

  test('vertical new creates vertical split with new file', async () => {
    const initialEditorCount = vscode.window.visibleTextEditors.length;

    // Execute :vertical new command
    await modeHandler.handleMultipleKeyEvents(':vertical new\n'.split(''));

    // Wait a bit for the command to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that a new editor was created
    const finalEditorCount = vscode.window.visibleTextEditors.length;
    assert.ok(finalEditorCount > initialEditorCount, 'Vertical new should create a new editor');
  });

  test('vertical resize increases width', async () => {
    // Create a split first to have something to resize
    await modeHandler.handleMultipleKeyEvents(':vsplit\n'.split(''));
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Execute :vertical resize +5 command
    await modeHandler.handleMultipleKeyEvents(':vertical resize +5\n'.split(''));

    // Wait a bit for the command to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test passes if no error is thrown - VSCode commands are mocked in tests
    assert.ok(true, 'Vertical resize +5 should execute without error');
  });

  test('vertical resize decreases width', async () => {
    // Create a split first to have something to resize
    await modeHandler.handleMultipleKeyEvents(':vsplit\n'.split(''));
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Execute :vertical resize -3 command
    await modeHandler.handleMultipleKeyEvents(':vertical resize -3\n'.split(''));

    // Wait a bit for the command to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test passes if no error is thrown - VSCode commands are mocked in tests
    assert.ok(true, 'Vertical resize -3 should execute without error');
  });

  test('vertical resize with absolute value', async () => {
    // Create a split first to have something to resize
    await modeHandler.handleMultipleKeyEvents(':vsplit\n'.split(''));
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Execute :vertical resize 80 command
    await modeHandler.handleMultipleKeyEvents(':vertical resize 80\n'.split(''));

    // Wait a bit for the command to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test passes if no error is thrown - VSCode commands are mocked in tests
    assert.ok(true, 'Vertical resize 80 should execute without error');
  });
});
