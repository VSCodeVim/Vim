import * as vscode from 'vscode';
import * as assert from 'assert';
import { join, sep, basename } from 'path';
import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../../src/mode/modeHandler';
import { StatusBar } from '../../src/statusBar';
import * as t from '../testUtils';

suite('cmd_line tabComplete', () => {
  let modeHandler: ModeHandler;
  suiteSetup(async () => {
    await t.setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  suiteTeardown(t.cleanUpWorkspace);

  teardown(async () => {
    await modeHandler.handleKeyEvent('<Esc>');
  });

  test('command line command tab completion', async () => {
    await modeHandler.handleMultipleKeyEvents([':', 'e', 'd', 'i']);
    await modeHandler.handleKeyEvent('<tab>');
    const statusBarAfterTab = StatusBar.getText();

    await modeHandler.handleKeyEvent('<Esc>');
    assert.strictEqual(statusBarAfterTab.trim(), ':edit|', 'Command Tab Completion Failed');
  });

  test('command line command shift+tab', async () => {
    await modeHandler.handleMultipleKeyEvents([':', 'e', '<tab>']);
    const firstTab = StatusBar.getText();

    await modeHandler.handleKeyEvent('<tab>');
    const secondTab = StatusBar.getText();

    await modeHandler.handleKeyEvent('<S-tab>');
    const actual = StatusBar.getText();

    await modeHandler.handleKeyEvent('<Esc>');
    assert.notStrictEqual(firstTab, secondTab);
    assert.strictEqual(actual, firstTab, "Command can't go back with shift+tab");
  });

  test('command line file tab completion with no base path', async () => {
    await modeHandler.handleKeyEvent(':');
    const statusBarBeforeTab = StatusBar.getText();

    await modeHandler.handleMultipleKeyEvents(['e', ' ', '<tab>']);
    const statusBarAfterTab = StatusBar.getText();

    await modeHandler.handleKeyEvent('<Esc>');
    assert.notStrictEqual(statusBarBeforeTab, statusBarAfterTab, 'Status Bar did not change');
  });

  test('command line file tab completion with / as base path', async () => {
    await modeHandler.handleKeyEvent(':');
    const statusBarBeforeTab = StatusBar.getText();

    await modeHandler.handleMultipleKeyEvents(['e', ' ', '/', '<tab>']);
    const statusBarAfterTab = StatusBar.getText();

    await modeHandler.handleKeyEvent('<Esc>');
    assert.notStrictEqual(statusBarBeforeTab, statusBarAfterTab, 'Status Bar did not change');
  });

  test('command line file tab completion with ~/ as base path', async () => {
    await modeHandler.handleKeyEvent(':');
    const statusBarBeforeTab = StatusBar.getText();

    await modeHandler.handleMultipleKeyEvents(['e', ' ', '~', '/', '<tab>']);
    const statusBarAfterTab = StatusBar.getText();

    await modeHandler.handleKeyEvent('<Esc>');
    assert.notStrictEqual(statusBarBeforeTab, statusBarAfterTab, 'Status Bar did not change');
  });

  test('command line file tab completion with ./ as base path', async () => {
    await modeHandler.handleKeyEvent(':');
    const statusBarBeforeTab = StatusBar.getText();

    await modeHandler.handleMultipleKeyEvents(['e', ' ', '.', '/', '<tab>']);
    const statusBarAfterTab = StatusBar.getText();

    await modeHandler.handleKeyEvent('<Esc>');
    assert.notStrictEqual(statusBarBeforeTab, statusBarAfterTab, 'Status Bar did not change');
  });

  test('command line file tab completion with ../ as base path', async () => {
    await modeHandler.handleKeyEvent(':');
    const statusBarBeforeTab = StatusBar.getText();

    await modeHandler.handleMultipleKeyEvents(['e', ' ', '.', '.', '/', '<tab>']);
    const statusBarAfterTab = StatusBar.getText();

    await modeHandler.handleKeyEvent('<Esc>');
    assert.notStrictEqual(statusBarBeforeTab, statusBarAfterTab, 'Status Bar did not change');
  });

  test('command line file tab completion directory with / at the end', async () => {
    const dirPath = await t.createDir();

    try {
      const baseCmd = `:e ${dirPath.slice(0, -1)}`.split('');
      await modeHandler.handleMultipleKeyEvents(baseCmd);
      await modeHandler.handleKeyEvent('<tab>');
      const statusBarAfterTab = StatusBar.getText().trim();
      await modeHandler.handleKeyEvent('<Esc>');
      assert.strictEqual(
        statusBarAfterTab,
        `:e ${dirPath}${sep}|`,
        'Cannot complete with / at the end',
      );
    } finally {
      await vscode.workspace.fs.delete(vscode.Uri.file(dirPath), { recursive: true });
    }
  });

  test('command line file navigate tab completion', async () => {
    // tmpDir --- inner0
    //         |- inner1 --- inner10 --- inner100
    const tmpDir = await t.createDir();
    const inner0 = await t.createDir(join(tmpDir, 'inner0'));
    const inner1 = await t.createDir(join(tmpDir, 'inner1'));
    const inner10 = await t.createDir(join(inner1, 'inner10'));
    const inner100 = await t.createDir(join(inner10, 'inner100'));

    try {
      // Tab to see the completion of tempDir
      const cmd = `:e ${tmpDir}${sep}`.split('');
      await modeHandler.handleMultipleKeyEvents(cmd);
      await modeHandler.handleKeyEvent('<tab>');
      let statusBarAfterTab = StatusBar.getText().trim();
      let expectedPath = `${tmpDir}${sep}inner0${sep}`;
      assert.strictEqual(statusBarAfterTab, `:e ${expectedPath}|`, '123');

      // Tab to cycle the completion of tempDir
      await modeHandler.handleKeyEvent('<tab>');
      statusBarAfterTab = StatusBar.getText().trim();
      expectedPath = `${tmpDir}${sep}inner1${sep}`;
      assert.strictEqual(statusBarAfterTab, `:e ${expectedPath}|`, '123');

      // <right> and <tab> to select and complete the content in
      // the inner1 directory
      // Since there is only one directory in inner1 which is inner10,
      // The completion is complete.
      await modeHandler.handleMultipleKeyEvents(['<right>', '<tab>']);
      statusBarAfterTab = StatusBar.getText().trim();
      expectedPath = `${tmpDir}${sep}inner1${sep}inner10${sep}`;
      assert.strictEqual(statusBarAfterTab, `:e ${expectedPath}|`, '123');

      // A tab would try to complete the content in the inner10.
      // Since the pervious completion is complete, no <right> is needed to select
      await modeHandler.handleKeyEvent('<tab>');
      statusBarAfterTab = StatusBar.getText().trim();
      expectedPath = `${tmpDir}${sep}inner1${sep}inner10${sep}inner100${sep}`;
      assert.strictEqual(statusBarAfterTab, `:e ${expectedPath}|`, '123');

      // Since there isn't any files or directories in inner100, no completion.
      await modeHandler.handleKeyEvent('<tab>');
      statusBarAfterTab = StatusBar.getText().trim();
      expectedPath = `${tmpDir}${sep}inner1${sep}inner10${sep}inner100${sep}`;
      assert.strictEqual(statusBarAfterTab, `:e ${expectedPath}|`, '123');

      await modeHandler.handleKeyEvent('<Esc>');
    } finally {
      await vscode.workspace.fs.delete(vscode.Uri.file(tmpDir), { recursive: true });
    }
  });

  test('command line tab completion on the content on the left of the cursor', async () => {
    await modeHandler.handleMultipleKeyEvents([':', 'e', 'd', 'i']);
    await modeHandler.handleKeyEvent('<tab>');
    let statusBarAfterTab = StatusBar.getText().trim();
    assert.strictEqual(statusBarAfterTab, ':edit|', 'Command Tab Completion Failed');

    await modeHandler.handleMultipleKeyEvents(['<left>', '<left>']);
    statusBarAfterTab = StatusBar.getText().trim();
    assert.strictEqual(statusBarAfterTab, ':ed|it', 'Failed to move the cursor to the left');

    await modeHandler.handleKeyEvent('<tab>');
    statusBarAfterTab = StatusBar.getText().trim();
    assert.strictEqual(
      statusBarAfterTab,
      ':edit|it',
      'Failed to complete content left of the cursor',
    );

    await modeHandler.handleKeyEvent('<Esc>');
  });

  test('command line file tab completion with .', async () => {
    const dirPath = await t.createDir();
    const testFilePath = await t.createFile({ fsPath: join(dirPath, '.testfile') });

    try {
      // There should only be one auto-completion
      const baseCmd = `:e ${dirPath}${sep}`.split('');
      await modeHandler.handleMultipleKeyEvents(baseCmd);
      // First tab - resolve to .testfile
      await modeHandler.handleKeyEvent('<tab>');
      let statusBarAfterTab = StatusBar.getText();
      assert.strictEqual(
        statusBarAfterTab.trim(),
        `:e ${testFilePath}|`,
        'Cannot complete to .testfile',
      );
      // Second tab - resolve to .testfile
      // ./ and ../ because . is not explicitly typed in.
      // This should be consistent with Vim
      await modeHandler.handleKeyEvent('<tab>');
      statusBarAfterTab = StatusBar.getText().trim();
      assert.strictEqual(statusBarAfterTab, `:e ${testFilePath}|`, 'Cannot complete to .testfile');
      await modeHandler.handleKeyEvent('<Esc>');

      await modeHandler.handleMultipleKeyEvents(baseCmd.concat('.'));
      // First tab - resolve to ../
      await modeHandler.handleKeyEvent('<tab>');
      statusBarAfterTab = StatusBar.getText().trim();
      assert.strictEqual(
        statusBarAfterTab,
        `:e ${dirPath}${sep}..${sep}|`,
        'Cannot complete to ../',
      );
      // Second tab - resolve to ./
      await modeHandler.handleKeyEvent('<tab>');
      statusBarAfterTab = StatusBar.getText().trim();
      assert.strictEqual(statusBarAfterTab, `:e ${dirPath}${sep}.${sep}|`, 'Cannot complete to ./');
      // Third tab - resolve to .testfile
      await modeHandler.handleKeyEvent('<tab>');
      statusBarAfterTab = StatusBar.getText().trim();
      assert.strictEqual(statusBarAfterTab, `:e ${testFilePath}|`, 'Cannot complete to .testfile');
      await modeHandler.handleKeyEvent('<Esc>');
    } finally {
      await vscode.workspace.fs.delete(vscode.Uri.file(dirPath), { recursive: true });
    }
  });

  test('command line file tab completion with space in file path', async () => {
    // Create an random file in temp folder with a space in the file name
    const spacedFilePath = await t.createFile({ fileExtension: 'vscode-vim completion-test' });
    try {
      // Get the base name of the path which is <random name>vscode-vim completion-test
      const baseName = basename(spacedFilePath);
      // Get the base name exclude the space which is <random name>vscode-vim
      const baseNameExcludeSpace = baseName.substring(0, baseName.lastIndexOf(' '));
      const fullPathExcludeSpace = spacedFilePath.substring(0, spacedFilePath.lastIndexOf(' '));
      const failMsg = 'Cannot complete to a path with space';

      // With no base path
      let cmd = `:e ${baseNameExcludeSpace}`.split('');
      await modeHandler.handleMultipleKeyEvents(cmd);
      await modeHandler.handleKeyEvent('<tab>');
      let statusBarAfterTab = StatusBar.getText().trim();
      await modeHandler.handleKeyEvent('<Esc>');
      assert.strictEqual(statusBarAfterTab, `:e ${baseName}|`, `${failMsg} (no base path)`);

      // With multiple ./ ./ as base name
      cmd = `:e ././${baseNameExcludeSpace}`.split('');
      await modeHandler.handleMultipleKeyEvents(cmd);
      await modeHandler.handleKeyEvent('<tab>');
      statusBarAfterTab = StatusBar.getText().trim();
      await modeHandler.handleKeyEvent('<Esc>');
      assert.strictEqual(statusBarAfterTab, `:e .${sep}.${sep}${baseName}|`, `${failMsg} (w ././)`);

      // With full path excluding the last space portion
      cmd = `:e ${fullPathExcludeSpace}`.split('');
      await modeHandler.handleMultipleKeyEvents(cmd);
      await modeHandler.handleKeyEvent('<tab>');
      statusBarAfterTab = StatusBar.getText().trim();
      await modeHandler.handleKeyEvent('<Esc>');
      assert.strictEqual(statusBarAfterTab, `:e ${spacedFilePath}|`, `(${failMsg} full path)`);
    } finally {
      await vscode.workspace.fs.delete(vscode.Uri.file(spacedFilePath));
    }
  });

  test('command line file tab completion case-sensitivity platform dependent', async () => {
    const dirPath = await t.createDir();
    const filePath = await t.createFile({ fsPath: join(dirPath, 'testfile') });
    const fileAsTyped = join(dirPath, 'TESTFIL');
    const cmd = `:e ${fileAsTyped}`.split('');

    try {
      if (process.platform === 'win32') {
        await modeHandler.handleMultipleKeyEvents(cmd);
        await modeHandler.handleKeyEvent('<tab>');
        const statusBarAfterTab = StatusBar.getText().trim();
        await modeHandler.handleKeyEvent('<Esc>');
        assert.strictEqual(
          statusBarAfterTab.toLowerCase(),
          `:e ${filePath}|`.toLowerCase(),
          'Cannot complete path case-insensitive on windows',
        );
      } else {
        await modeHandler.handleMultipleKeyEvents(cmd);
        const statusBarBeforeTab = StatusBar.getText();
        await modeHandler.handleKeyEvent('<tab>');
        const statusBarAfterTab = StatusBar.getText().trim();
        await modeHandler.handleKeyEvent('<Esc>');
        assert.strictEqual(
          statusBarBeforeTab,
          statusBarAfterTab,
          'Is case-insensitive on non-windows',
        );
      }
    } finally {
      await vscode.workspace.fs.delete(vscode.Uri.file(dirPath), { recursive: true });
    }
  });
});
