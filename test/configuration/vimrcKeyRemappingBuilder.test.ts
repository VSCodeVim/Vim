import * as vscode from 'vscode';
import * as assert from 'assert';
import { vimrcKeyRemappingBuilder } from '../../src/configuration/vimrcKeyRemappingBuilder';
import sinon = require('sinon');

suite('VimrcKeyRemappingBuilder', () => {
  test('Build IKeyRemapping objects from .vimrc lines', async () => {
    const testCases = [
      {
        vimrcLine: 'nnoremap <C-h> <<',
        keyRemapping: {
          before: ['<C-h>'],
          after: ['<', '<'],
          source: 'vimrc',
        },
        keyRemappingType: 'nnoremap',
        expectNull: false,
      },
      {
        vimrcLine: 'imap jj <Esc>',
        keyRemapping: {
          before: ['j', 'j'],
          after: ['<Esc>'],
          source: 'vimrc',
        },
        keyRemappingType: 'imap',
        expectNull: false,
      },
      {
        vimrcLine: 'vnoremap <leader>" c""<Esc>P',
        keyRemapping: {
          before: ['<leader>', '"'],
          after: ['c', '"', '"', '<Esc>', 'P'],
          source: 'vimrc',
        },
        keyRemappingType: 'vnoremap',
        expectNull: false,
      },
      {
        // Mapping with a vim command
        vimrcLine: 'nnoremap <C-s> :w<CR>',
        keyRemapping: {
          before: ['<C-s>'],
          commands: [':w'],
          source: 'vimrc',
        },
        keyRemappingType: 'nnoremap',
        expectNull: false,
      },
      {
        // Mapping with a VSCode command
        vimrcLine: 'nnoremap <C-t> workbench.action.files.newUntitledFile',
        keyRemapping: {
          before: ['<C-t>'],
          commands: ['workbench.action.files.newUntitledFile'],
          source: 'vimrc',
        },
        keyRemappingType: 'nnoremap',
        expectNull: false,
      },
      {
        // Mapping with an extension command
        vimrcLine: 'nnoremap <C-t> vim.showQuickpickCmdLine',
        keyRemapping: {
          before: ['<C-t>'],
          commands: ['vim.showQuickpickCmdLine'],
          source: 'vimrc',
        },
        keyRemappingType: 'nnoremap',
        expectNull: false,
      },
      {
        // Ignore non-mapping lines
        vimrcLine: 'set scrolloff=8',
        expectNull: true,
      },
      {
        // Ignore lines attempting to remap a plug in using <Plug>
        vimrcLine: 'nmap s <Plug>(easymotion-s2)',
        expectNull: true,
      },
    ];

    for (const testCase of testCases) {
      const vimrcKeyRemapping = await vimrcKeyRemappingBuilder.build(testCase.vimrcLine);

      if (testCase.expectNull) {
        assert.strictEqual(vimrcKeyRemapping, undefined);
      } else {
        assert.deepStrictEqual(vimrcKeyRemapping!.keyRemapping, testCase.keyRemapping);
        assert.strictEqual(vimrcKeyRemapping!.keyRemappingType, testCase.keyRemappingType);
      }
    }
  });

  suite('VimrcKeyRemappingBuilder - command mapping', () => {
    test('properly handles "contributes" section of extensions', async () => {
      sinon.replaceGetter(vscode.extensions, 'all', () => [
        {
          packageJSON: {}, // empty packageJSON
        } as vscode.Extension<any>,
        {
          packageJSON: { contributes: {} }, // empty contributes section
        } as vscode.Extension<any>,
        {
          packageJSON: { contributes: { commands: [{ command: 'extension.mockNoopAction' }] } },
        } as vscode.Extension<any>,
      ]);

      const vimrcKeyRemapping = await vimrcKeyRemappingBuilder.build(
        'nnoremap <C-t> extension.mockNoopAction'
      );
      assert.deepStrictEqual(vimrcKeyRemapping!.keyRemapping.commands, [
        'extension.mockNoopAction',
      ]);
      assert.strictEqual(vimrcKeyRemapping!.keyRemappingType, 'nnoremap');
    });
  });
});
