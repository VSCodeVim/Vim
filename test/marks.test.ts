import { strict as assert } from 'assert';
import * as vscode from 'vscode';
import { getAndUpdateModeHandler } from '../extensionBase';
import { Mode } from '../src/mode/mode';
import { ModeHandler } from '../src/mode/modeHandler';
import { ModeHandlerMap } from '../src/mode/modeHandlerMap';
import { newTest, newTestSkip } from './testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';

suite('Marks', () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  suiteTeardown(cleanUpWorkspace);

  const jumpToNewFile = async (content?: string) => {
    await setupWorkspace({
      config: {
        tabstop: 4,
        expandtab: false,
      },
      newFileContent: content,
      forceNewFile: true,
      disableCleanUp: true,
    });
    return (await getAndUpdateModeHandler())!;
  };

  newTest({
    title: 'Can jump to lowercase mark',
    start: ['|hello world and mars'],
    keysPressed: 'wma2w`a',
    end: ['hello |world and mars'],
    endMode: Mode.Normal,
  });

  suite("'< and '>", () => {
    newTest({
      title: "'< set by Visual mode",
      start: ['one', 't|wo', 'three'],
      keysPressed: 'vjl<Esc>' + 'gg' + '`<',
      end: ['one', 't|wo', 'three'],
    });
    newTest({
      title: "'> set by Visual mode",
      start: ['one', 't|wo', 'three'],
      keysPressed: 'vjl<Esc>' + 'gg' + '`>',
      end: ['one', 'two', 'th|ree'],
    });

    newTest({
      title: "'< set by m<",
      start: ['one', 't|wo', 'three'],
      keysPressed: 'm<' + 'gg' + '`<',
      end: ['one', 't|wo', 'three'],
    });
    newTest({
      title: "'> set by m>",
      start: ['one', 't|wo', 'three'],
      keysPressed: 'm>' + 'gg' + '`>',
      end: ['one', 't|wo', 'three'],
    });

    newTest({
      title: "gv fails if '< is not set",
      start: ['one', 't|wo', 'three'],
      keysPressed: 'm>' + 'gg' + 'gv',
      end: ['|one', 'two', 'three'],
      endMode: Mode.Normal,
    });
    newTest({
      title: "gv fails if '> is not set",
      start: ['one', 't|wo', 'three'],
      keysPressed: 'm<' + 'gg' + 'gv',
      end: ['|one', 'two', 'three'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'gv is affected by m<',
      start: ['one', 't|wo', 'three'],
      keysPressed: 'v<Esc>' + 'k' + 'm<' + 'gg' + 'gvd',
      end: ['o|o', 'three'],
    });
    newTest({
      title: 'gv is affected by m>',
      start: ['one', 't|wo', 'three'],
      keysPressed: 'v<Esc>' + 'j' + 'm>' + 'gg' + 'gvd',
      end: ['one', 't|ree'],
    });
    newTestSkip({
      // TODO: Seems to work... why does this fail?
      title: 'gv is affected by m< and m>',
      start: ['one', 't|wo', 'three'],
      keysPressed: 'm<' + 'j' + 'm>' + 'gg' + 'gvd',
      end: ['one', 't|ree'],
    });

    newTest({
      title: "m< AFTER '> sets '> too",
      start: ['one', 't|wo', 'three'],
      keysPressed: 'v<Esc>' + 'j' + 'm<' + 'gg' + '`>',
      end: ['one', 'two', 't|hree'],
    });
    newTest({
      title: "m> BEFORE '< sets '< too",
      start: ['one', 't|wo', 'three'],
      keysPressed: 'v<Esc>' + 'k' + 'm>' + 'gg' + '`<',
      end: ['o|ne', 'two', 'three'],
    });
    newTest({
      title: "gv fails if '< is after '>",
      start: ['one', 't|wo', 'three'],
      keysPressed: 'v<Esc>' + 'j' + 'm<' + 'gg' + 'gv',
      end: ['|one', 'two', 'three'],
      endMode: Mode.Normal,
    });
  });

  suite('global marks', () => {
    let otherModeHandler: ModeHandler;

    setup(async () => {
      await setupWorkspace();
      modeHandler = (await getAndUpdateModeHandler())!;

      const firstDocumentName = vscode.window.activeTextEditor!.document.fileName;
      await modeHandler.handleMultipleKeyEvents('mA'.split(''));
      otherModeHandler = await jumpToNewFile();

      const otherDocumentName = vscode.window.activeTextEditor!.document.fileName;
      assert.notStrictEqual(firstDocumentName, otherDocumentName);
    });

    teardown(async () => {
      ModeHandlerMap.delete(otherModeHandler.vimState.documentUri);
    });

    newTest({
      title: 'changes the active document',
      start: ['|'],
      keysPressed: "'A",
      end: ['|'],
      endFsPath: () => modeHandler.vimState.documentUri.fsPath,
    });
  });
});
