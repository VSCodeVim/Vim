import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { ExCommandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import { exCommandParser } from '../../src/vimscript/exCommandParser';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

function clearBreakpoints() {
  vscode.debug.removeBreakpoints(vscode.debug.breakpoints);
}

suite('Breakpoints command', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  teardown(cleanUpWorkspace);

  test('`:breaka` adds breakpoint', async () => {
    clearBreakpoints();
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'o', '<Esc>']); // make sure it's working not only for the first line
    await new ExCommandLine('breaka', modeHandler.vimState.currentMode).run(modeHandler.vimState);
    assert.strictEqual(vscode.debug.breakpoints.length, 1);
    const breakpoint = vscode.debug.breakpoints[0] as vscode.SourceBreakpoint;
    assert.strictEqual(
      breakpoint.location.uri.fsPath,
      modeHandler.vimState.editor.document.uri.fsPath,
    );
    assert.strictEqual(
      breakpoint.location.range.start.line,
      modeHandler.vimState.cursorStartPosition.line,
    );
  });

  test('`:breakd` delete breakpoint', async () => {
    clearBreakpoints();
    await new ExCommandLine('breaka', modeHandler.vimState.currentMode).run(modeHandler.vimState);
    assert.strictEqual(vscode.debug.breakpoints.length, 1);
    await new ExCommandLine('breakd', modeHandler.vimState.currentMode).run(modeHandler.vimState);
    assert.strictEqual(vscode.debug.breakpoints.length, 0);
  });

  test('test "here" is redundant', async () => {
    assert.deepStrictEqual(
      exCommandParser.tryParse(':breaka here'),
      exCommandParser.tryParse(':breaka'),
    );
    assert.deepStrictEqual(
      exCommandParser.tryParse(':breakd here'),
      exCommandParser.tryParse(':breakd'),
    );
  });
});
