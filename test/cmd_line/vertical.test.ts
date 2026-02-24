import { strict as assert } from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { ExCommandLine } from '../../src/cmd_line/commandLine';
import { VimError, ErrorCode } from '../../src/error';
import { ModeHandler } from '../../src/mode/modeHandler';
import { StatusBar } from '../../src/statusBar';
import { cleanUpWorkspace, setupWorkspace, waitForEditorsToClose } from '../testUtils';

suite('Vertical command', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  teardown(cleanUpWorkspace);

  test('vertical without command shows argument required error', async () => {
    await new ExCommandLine('vertical', modeHandler.vimState.currentMode).run(modeHandler.vimState);
    const statusText = StatusBar.getText();
    assert.ok(statusText.includes('Argument required'));
  });

  test('vertical with whitespace only shows argument required error', async () => {
    await new ExCommandLine('vertical   ', modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );
    const statusText = StatusBar.getText();
    assert.ok(statusText.includes('Argument required'));
  });

  test('vertical with unsupported command shows error', async () => {
    await new ExCommandLine('vertical help', modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );
    const statusText = StatusBar.getText();
    assert.ok(statusText.includes('Not an editor command: vertical help'));
  });

  // Test vertical split commands
  test('vertical split creates vertical split', async () => {
    await new ExCommandLine('vertical split', modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );
    await waitForEditorsToClose(2);

    assert.strictEqual(
      vscode.window.visibleTextEditors.length,
      2,
      'Vertical split should create a second editor',
    );
  });

  test('vertical split with filename creates vertical split and opens file', async () => {
    const initialEditorCount = vscode.window.visibleTextEditors.length;

    await new ExCommandLine('vertical split test.txt', modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );
    await waitForEditorsToClose(2); // Wait for editors to be ready

    const finalEditorCount = vscode.window.visibleTextEditors.length;
    assert.ok(
      finalEditorCount > initialEditorCount,
      'Vertical split with filename should create a new editor',
    );
  });

  // Test vertical new commands
  test('vertical new creates vertical split with new file', async () => {
    await new ExCommandLine('vertical new', modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );
    await waitForEditorsToClose(2);

    assert.strictEqual(
      vscode.window.visibleTextEditors.length,
      2,
      'Vertical new should create a second editor',
    );
  });

  test('vertical new with filename creates vertical split with new named file', async () => {
    const initialEditorCount = vscode.window.visibleTextEditors.length;

    await new ExCommandLine('vertical new newfile.txt', modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );
    await waitForEditorsToClose(2); // Wait for editors to be ready

    const finalEditorCount = vscode.window.visibleTextEditors.length;
    assert.ok(
      finalEditorCount > initialEditorCount,
      'Vertical new with filename should create a new editor',
    );
  });

  // Test vertical resize commands
  test('vertical resize without arguments maximizes width', async () => {
    // Create a mock for the VSCode command
    const originalExecuteCommand = vscode.commands.executeCommand;
    let executedCommand: string | undefined;

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommand = command;
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical resize', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommand, 'workbench.action.toggleEditorWidths');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('vertical resize +N increases width', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    const executedCommands: string[] = [];

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommands.push(command);
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical resize +5', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommands[0], 'runCommands');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('vertical resize -N decreases width', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    const executedCommands: string[] = [];

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommands.push(command);
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical resize -3', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommands[0], 'runCommands');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('vertical resize +1 executes single command', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    let executedCommand: string | undefined;

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommand = command;
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical resize +1', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommand, 'workbench.action.increaseViewWidth');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('vertical resize -1 executes single command', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    let executedCommand: string | undefined;

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommand = command;
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical resize -1', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommand, 'workbench.action.decreaseViewWidth');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('vertical resize +0 is no-op', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    const executedCommands: string[] = [];

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommands.push(command);
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical resize +0', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommands.length, 0, 'No commands should be executed for +0');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('vertical resize -0 is no-op', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    const executedCommands: string[] = [];

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommands.push(command);
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical resize -0', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommands.length, 0, 'No commands should be executed for -0');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('vertical resize with absolute value shows unsupported message', async () => {
    await new ExCommandLine('vertical resize 80', modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );

    // The status bar should contain message about VSCode not supporting exact column widths
    const statusText = StatusBar.getText();
    assert.ok(
      statusText.includes("doesn't support setting exact column widths"),
      'Should show message about unsupported absolute resize',
    );
  });

  test('vertical resize with invalid argument shows error', async () => {
    await new ExCommandLine('vertical resize abc', modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );
    const statusText = StatusBar.getText();
    assert.ok(statusText.includes('Invalid argument: abc'));
  });

  test('vertical resize with invalid format shows error', async () => {
    await new ExCommandLine('vertical resize +abc', modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );
    const statusText = StatusBar.getText();
    assert.ok(statusText.includes('Invalid argument: +abc'));
  });

  test('vertical resize with mixed format shows error', async () => {
    await new ExCommandLine('vertical resize 5+', modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );
    const statusText = StatusBar.getText();
    assert.ok(statusText.includes('Invalid argument: 5+'));
  });

  // Test vertical-resize command alias
  test('vertical-resize without arguments maximizes width', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    let executedCommand: string | undefined;

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommand = command;
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical-resize', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommand, 'workbench.action.toggleEditorWidths');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('vertical-resize +N increases width', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    const executedCommands: string[] = [];

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommands.push(command);
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical-resize +5', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommands[0], 'runCommands');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('vertical-resize -N decreases width', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    const executedCommands: string[] = [];

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommands.push(command);
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical-resize -3', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommands[0], 'runCommands');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('vertical-resize +1 executes single command', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    let executedCommand: string | undefined;

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommand = command;
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical-resize +1', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommand, 'workbench.action.increaseViewWidth');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('vertical-resize -1 executes single command', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    let executedCommand: string | undefined;

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommand = command;
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical-resize -1', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommand, 'workbench.action.decreaseViewWidth');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('vertical-resize +0 is no-op', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    const executedCommands: string[] = [];

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommands.push(command);
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical-resize +0', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommands.length, 0, 'No commands should be executed for +0');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('vertical-resize -0 is no-op', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    const executedCommands: string[] = [];

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommands.push(command);
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical-resize -0', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommands.length, 0, 'No commands should be executed for -0');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('vertical-resize with absolute value shows unsupported message', async () => {
    await new ExCommandLine('vertical-resize 80', modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );

    const statusText = StatusBar.getText();
    assert.ok(
      statusText.includes("doesn't support setting exact column widths"),
      'Should show message about unsupported absolute resize',
    );
  });

  test('vertical-resize with invalid argument shows error', async () => {
    await new ExCommandLine('vertical-resize abc', modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );
    const statusText = StatusBar.getText();
    assert.ok(statusText.includes('Invalid argument: abc'));
  });

  test('vertical-resize with large positive value uses runCommands', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    type RunCommandsArgs = { commands: string[] };
    let executedCommand: string | undefined;
    let commandArgs: RunCommandsArgs | undefined;

    vscode.commands.executeCommand = async (
      command: string,
      ...args: RunCommandsArgs[]
    ): Promise<any> => {
      executedCommand = command;
      commandArgs = args[0];
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical-resize +10', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommand, 'runCommands', 'Should use runCommands for large values');
      assert.ok(commandArgs, 'Should pass arguments to runCommands');
      assert.strictEqual(commandArgs.commands.length, 10, 'Should have 10 commands in array');
      assert.strictEqual(
        commandArgs.commands[0],
        'workbench.action.increaseViewWidth',
        'Commands should be width increase',
      );
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('vertical-resize with large negative value uses runCommands', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    type RunCommandsArgs = { commands: string[] };
    let executedCommand: string | undefined;
    let commandArgs: RunCommandsArgs | undefined;

    vscode.commands.executeCommand = async (
      command: string,
      ...args: RunCommandsArgs[]
    ): Promise<any> => {
      executedCommand = command;
      commandArgs = args[0];
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical-resize -8', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommand, 'runCommands', 'Should use runCommands for large values');
      assert.ok(commandArgs, 'Should pass arguments to runCommands');
      assert.strictEqual(commandArgs.commands.length, 8, 'Should have 8 commands in array');
      assert.strictEqual(
        commandArgs.commands[0],
        'workbench.action.decreaseViewWidth',
        'Commands should be width decrease',
      );
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('vertical-resize with spaces works', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    let executedCommand: string | undefined;

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommand = command;
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('vertical-resize    +1', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(
        executedCommand,
        'workbench.action.increaseViewWidth',
        'Should handle extra spaces',
      );
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });
});
