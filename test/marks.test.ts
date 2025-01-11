import * as vscode from 'vscode';
import { strict as assert } from 'assert';
import { getAndUpdateModeHandler } from '../extensionBase';
import { Mode } from '../src/mode/mode';
import { newTest, newTestSkip } from './testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';
import { ModeHandler } from '../src/mode/modeHandler';

suite('Marks', () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });
  suiteTeardown(cleanUpWorkspace);

  const jumpToNewFile = async () => {
    await setupWorkspace({
      config: {
        tabstop: 4,
        expandtab: false,
      },
    });
    return (await getAndUpdateModeHandler())!;
  };

  // TODO: Skipped
  test.skip(`Capital marks can change the editor's active document`, async () => {
    const firstDocumentName = vscode.window.activeTextEditor!.document.fileName;
    await modeHandler.handleMultipleKeyEvents('mA'.split(''));

    const otherModeHandler = await jumpToNewFile();
    const otherDocumentName = vscode.window.activeTextEditor!.document.fileName;
    assert.notStrictEqual(firstDocumentName, otherDocumentName);

    await otherModeHandler.handleMultipleKeyEvents(`'A`.split(''));
    assert.strictEqual(vscode.window.activeTextEditor!.document.fileName, firstDocumentName);
  });

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
});
