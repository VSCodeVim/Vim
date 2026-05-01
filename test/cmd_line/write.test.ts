import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { ExCommandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import { assertEqualLines, setupWorkspace } from '../testUtils';

suite('Write command (:w)', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  /**
   * Helper to type "hello world!" in insert mode
   */
  const typeHelloWorld = async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      'h',
      'e',
      'l',
      'l',
      'o',
      ' ',
      'w',
      'o',
      'r',
      'l',
      'd',
      '!',
      '<Esc>',
    ]);
  };

  /**
   * Helper to run the :w command
   */
  const runWriteCommand = async () => {
    await new ExCommandLine('w', modeHandler.vimState.currentMode).run(modeHandler.vimState);
  };

  suite('Basic functionality', () => {
    test('write (:w) - basic functionality', async () => {
      await typeHelloWorld();
      await runWriteCommand();

      assertEqualLines(['hello world!']);
    });

    test('write (:w) - should save document', async () => {
      await modeHandler.handleMultipleKeyEvents([
        'i',
        't',
        'e',
        's',
        't',
        ' ',
        'c',
        'o',
        'n',
        't',
        'e',
        'n',
        't',
        '<Esc>',
      ]);

      await new ExCommandLine('w', modeHandler.vimState.currentMode).run(modeHandler.vimState);

      assertEqualLines(['test content']);
    });
  });
  suite('Tab Groups API - diff view preservation', () => {
    let showTextDocumentStub: sinon.SinonStub;
    let tabGroupsStub: sinon.SinonStub;

    setup(() => {
      showTextDocumentStub = sinon.stub(vscode.window, 'showTextDocument').resolves();
      tabGroupsStub = sinon.stub(vscode.window, 'tabGroups');
    });

    teardown(() => {
      showTextDocumentStub.restore();
      tabGroupsStub.restore();
    });

    test('should pin preview tabs when saving', async () => {
      const docUri = modeHandler.vimState.document.uri.toString();
      const mockTab = {
        isPreview: true,
        input: { uri: { toString: () => docUri } },
      };
      tabGroupsStub.get(() => ({ activeTabGroup: { tabs: [mockTab] } }));

      await typeHelloWorld();
      await runWriteCommand();

      assert.strictEqual(
        showTextDocumentStub.calledOnce,
        true,
        'showTextDocument should be called to pin preview tabs',
      );
    });

    test('should preserve diff view for non-preview tabs', async () => {
      const docUri = modeHandler.vimState.document.uri.toString();
      const mockTab = {
        isPreview: false,
        input: { uri: { toString: () => docUri } },
      };
      tabGroupsStub.get(() => ({ activeTabGroup: { tabs: [mockTab] } }));

      await typeHelloWorld();
      await runWriteCommand();

      assert.strictEqual(
        showTextDocumentStub.called,
        false,
        'showTextDocument should not be called for non-preview tabs',
      );
    });

    test('should handle diff tabs correctly (original side)', async () => {
      const docUri = modeHandler.vimState.document.uri.toString();
      const mockDiffTab = {
        isPreview: false,
        input: {
          original: { toString: () => docUri },
          modified: { toString: () => 'other-file-uri' },
        },
      };
      tabGroupsStub.get(() => ({ activeTabGroup: { tabs: [mockDiffTab] } }));

      await typeHelloWorld();
      await runWriteCommand();

      assert.strictEqual(
        showTextDocumentStub.called,
        false,
        'should not disrupt diff view when document is original side',
      );
    });

    test('should handle diff tabs correctly (modified side)', async () => {
      const docUri = modeHandler.vimState.document.uri.toString();
      const mockDiffTab = {
        isPreview: false,
        input: {
          original: { toString: () => 'other-file-uri' },
          modified: { toString: () => docUri },
        },
      };
      tabGroupsStub.get(() => ({ activeTabGroup: { tabs: [mockDiffTab] } }));

      await typeHelloWorld();
      await runWriteCommand();

      assert.strictEqual(
        showTextDocumentStub.called,
        false,
        'should not disrupt diff view when document is modified side',
      );
    });

    test('should call showTextDocument when document not in active tab group', async () => {
      tabGroupsStub.get(() => ({ activeTabGroup: { tabs: [] } }));

      await typeHelloWorld();
      await runWriteCommand();

      assert.strictEqual(
        showTextDocumentStub.calledOnce,
        true,
        'showTextDocument should be called when document not in active tab group',
      );
    });

    test('should only check active tab group, not other tab groups', async () => {
      const docUri = modeHandler.vimState.document.uri.toString();
      // Active tab group has a different file
      tabGroupsStub.get(() => ({
        activeTabGroup: {
          tabs: [{ isPreview: false, input: { uri: { toString: () => 'other-file' } } }],
        },
      }));

      await typeHelloWorld();
      await runWriteCommand();

      assert.strictEqual(
        showTextDocumentStub.calledOnce,
        true,
        'should call showTextDocument when document not in active tab group',
      );
    });
  });
});
