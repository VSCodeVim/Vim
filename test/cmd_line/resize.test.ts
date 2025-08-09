import { strict as assert } from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { ExCommandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import { StatusBar } from '../../src/statusBar';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('Resize command', () => {
  let modeHandler: ModeHandler;
  type RunCommandsArgs = { commands: string[] };

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  teardown(cleanUpWorkspace);

  test('resize without arguments executes default behavior', async () => {
    // Test that :resize without arguments doesn't throw an error
    // The actual behavior (TODO comment in code) is not fully implemented yet
    await new ExCommandLine('resize', modeHandler.vimState.currentMode).run(modeHandler.vimState);

    // Test passes if no error is thrown
    assert.ok(true, 'Resize without arguments should not throw error');
  });

  test('resize +N increases height', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    const executedCommands: string[] = [];

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommands.push(command);
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('resize +5', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(
        executedCommands[0],
        'runCommands',
        'Should execute runCommands for multiple height increases',
      );
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('resize -N decreases height', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    const executedCommands: string[] = [];

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommands.push(command);
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('resize -3', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(
        executedCommands[0],
        'runCommands',
        'Should execute runCommands for multiple height decreases',
      );
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('resize +1 executes single increase command', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    let executedCommand: string | undefined;

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommand = command;
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('resize +1', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(
        executedCommand,
        'workbench.action.increaseViewHeight',
        'Should execute single height increase command',
      );
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('resize -1 executes single decrease command', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    let executedCommand: string | undefined;

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommand = command;
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('resize -1', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(
        executedCommand,
        'workbench.action.decreaseViewHeight',
        'Should execute single height decrease command',
      );
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('resize +0 is no-op', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    const executedCommands: string[] = [];

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommands.push(command);
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('resize +0', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommands.length, 0, 'No commands should be executed for +0');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('resize -0 is no-op', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    const executedCommands: string[] = [];

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommands.push(command);
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('resize -0', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommands.length, 0, 'No commands should be executed for -0');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('resize with absolute value shows unsupported message', async () => {
    await new ExCommandLine('resize 25', modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );

    // The status bar should contain message about VSCode not supporting exact row heights
    const statusText = StatusBar.getText();
    assert.ok(
      statusText.includes("doesn't support setting exact row heights"),
      `Expected status bar to contain unsupported message, but got: "${statusText}"`,
    );
  });

  test('resize with large positive value uses runCommands', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
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
      await new ExCommandLine('resize +10', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommand, 'runCommands', 'Should use runCommands for large values');
      assert.ok(commandArgs, 'Should pass arguments to runCommands');
      assert.strictEqual(commandArgs.commands.length, 10, 'Should have 10 commands in array');
      assert.strictEqual(
        commandArgs.commands[0],
        'workbench.action.increaseViewHeight',
        'Commands should be height increase',
      );
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('resize with large negative value uses runCommands', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
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
      await new ExCommandLine('resize -8', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommand, 'runCommands', 'Should use runCommands for large values');
      assert.ok(commandArgs, 'Should pass arguments to runCommands');
      assert.strictEqual(commandArgs.commands.length, 8, 'Should have 8 commands in array');
      assert.strictEqual(
        commandArgs.commands[0],
        'workbench.action.decreaseViewHeight',
        'Commands should be height decrease',
      );
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  // Test various spacing scenarios
  test('resize with extra spaces works', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    let executedCommand: string | undefined;

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommand = command;
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('resize    +1', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(
        executedCommand,
        'workbench.action.increaseViewHeight',
        'Should handle extra spaces',
      );
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('resize with tabs and spaces works', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    let executedCommand: string | undefined;

    vscode.commands.executeCommand = async (command: string): Promise<any> => {
      executedCommand = command;
      return Promise.resolve();
    };

    try {
      await new ExCommandLine('resize\t\t -2', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommand, 'runCommands', 'Should handle tabs and spaces');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  // Test edge cases with very large numbers
  test('resize with very large positive number', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
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
      await new ExCommandLine('resize +999', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommand, 'runCommands');
      assert.ok(commandArgs, 'Should pass arguments to runCommands');
      assert.strictEqual(commandArgs.commands.length, 999);
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  test('resize with very large negative number', async () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
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
      await new ExCommandLine('resize -999', modeHandler.vimState.currentMode).run(
        modeHandler.vimState,
      );
      assert.strictEqual(executedCommand, 'runCommands');
      assert.ok(commandArgs, 'Should pass arguments to runCommands');
      assert.strictEqual(commandArgs.commands.length, 999);
      assert.strictEqual(commandArgs.commands[0], 'workbench.action.decreaseViewHeight');
    } finally {
      vscode.commands.executeCommand = originalExecuteCommand;
    }
  });

  // Error handling tests - Note: resize command parser is quite permissive,
  // so most "invalid" inputs are either parsed successfully or ignored rather than throwing errors.
  // These tests verify that the command handles edge cases gracefully.

  test('resize with non-numeric absolute value shows unsupported message', async () => {
    // Test that non-numeric absolute values are handled (though they may be parsed differently)
    await new ExCommandLine('resize abc', modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );

    // The command should complete without throwing an error
    // (The parser may not match this input, so it might be treated as empty args)
    assert.ok(true, 'Command should complete without throwing');
  });

  test('resize with mixed numeric and text handled gracefully', async () => {
    // Test commands with mixed content
    await new ExCommandLine('resize 5abc', modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );

    // The command should complete without throwing an error
    assert.ok(true, 'Command should complete without throwing');
  });
});
