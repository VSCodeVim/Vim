import * as vscode from 'vscode';
import * as assert from 'assert';
import { vimrcKeyRemappingBuilder } from '../../src/configuration/vimrcKeyRemappingBuilder';

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
        vimrcLine: 'ino jj <Esc>',
        keyRemapping: {
          before: ['j', 'j'],
          after: ['<Esc>'],
          source: 'vimrc',
        },
        keyRemappingType: 'ino',
        expectNull: false,
      },
      {
        vimrcLine: 'nore! jj <Esc>',
        keyRemapping: {
          before: ['j', 'j'],
          after: ['<Esc>'],
          source: 'vimrc',
        },
        keyRemappingType: 'nore!',
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
        // Mapping with <silent> argument (argument is ignored)
        vimrcLine: 'noremap <silent> jj <Esc>',
        keyRemapping: {
          before: ['j', 'j'],
          after: ['<Esc>'],
          source: 'vimrc',
        },
        keyRemappingType: 'noremap',
        expectNull: false,
      },
      {
        // Mapping with <buffer> argument (argument is ignored)
        vimrcLine: 'noremap <buffer> jj <Esc>',
        keyRemapping: {
          before: ['j', 'j'],
          after: ['<Esc>'],
          source: 'vimrc',
        },
        keyRemappingType: 'noremap',
        expectNull: false,
      },
      {
        // Mapping with multiple arguments (arguments are ignored)
        vimrcLine: 'noremap <buffer> <silent> jj <Esc>',
        keyRemapping: {
          before: ['j', 'j'],
          after: ['<Esc>'],
          source: 'vimrc',
        },
        keyRemappingType: 'noremap',
        expectNull: false,
      },
      {
        // Mapping with multiple arguments with weird spacing (arguments are ignored)
        vimrcLine: 'noremap <nowait> <silent><C-s> :w<CR>',
        keyRemapping: {
          before: ['<C-s>'],
          commands: [':w'],
          source: 'vimrc',
        },
        keyRemappingType: 'noremap',
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
      {
        // Ignore lines attempting to remap an expression using <expr>
        vimrcLine: "nnoremap <expr> <Leader>o 'mm' . v:count . 'o<ESC>`m",
        expectNull: true,
      },
      {
        // Ignore lines with unmappings
        vimrcLine: 'unmap jj',
        expectNull: true,
      },
      {
        // Ignore lines with clearmappings
        vimrcLine: 'mapclear jj',
        expectNull: true,
      },
    ];

    const vscodeCommands = await vscode.commands.getCommands();
    for (const testCase of testCases) {
      const vimrcKeyRemapping = await vimrcKeyRemappingBuilder.build(
        testCase.vimrcLine,
        vscodeCommands,
      );

      if (testCase.expectNull) {
        assert.strictEqual(vimrcKeyRemapping, undefined);
      } else {
        assert.deepStrictEqual(vimrcKeyRemapping!.keyRemapping, testCase.keyRemapping);
        assert.strictEqual(vimrcKeyRemapping!.keyRemappingType, testCase.keyRemappingType);
      }
    }
  });
  test('Build IKeyRemapping unmapping objects from .vimrc lines', async () => {
    const testCases = [
      {
        vimrcLine: 'unmap <C-h>',
        keyRemapping: {
          before: ['<C-h>'],
          source: 'vimrc',
        },
        keyRemappingType: 'unmap',
        expectNull: false,
      },
      {
        vimrcLine: 'iunmap jj',
        keyRemapping: {
          before: ['j', 'j'],
          source: 'vimrc',
        },
        keyRemappingType: 'iunmap',
        expectNull: false,
      },
      {
        vimrcLine: 'iun jj',
        keyRemapping: {
          before: ['j', 'j'],
          source: 'vimrc',
        },
        keyRemappingType: 'iun',
        expectNull: false,
      },
      {
        vimrcLine: 'unm! jj',
        keyRemapping: {
          before: ['j', 'j'],
          source: 'vimrc',
        },
        keyRemappingType: 'unm!',
        expectNull: false,
      },
      {
        vimrcLine: 'vu <leader>"',
        keyRemapping: {
          before: ['<leader>', '"'],
          source: 'vimrc',
        },
        keyRemappingType: 'vu',
        expectNull: false,
      },
      {
        // Unmapping with <silent> argument (argument is ignored)
        vimrcLine: 'nunmap <silent> jj',
        keyRemapping: {
          before: ['j', 'j'],
          source: 'vimrc',
        },
        keyRemappingType: 'nunmap',
        expectNull: false,
      },
      {
        // Unmapping with <buffer> argument (argument is ignored)
        vimrcLine: 'nunmap <buffer> jj',
        keyRemapping: {
          before: ['j', 'j'],
          source: 'vimrc',
        },
        keyRemappingType: 'nunmap',
        expectNull: false,
      },
      {
        // Unmapping with multiple arguments (arguments are ignored)
        vimrcLine: 'nunmap <buffer> <silent> jj',
        keyRemapping: {
          before: ['j', 'j'],
          source: 'vimrc',
        },
        keyRemappingType: 'nunmap',
        expectNull: false,
      },
      {
        // Unmapping with multiple arguments with weird spacing (arguments are ignored)
        vimrcLine: 'nunmap <nowait> <silent><C-s>',
        keyRemapping: {
          before: ['<C-s>'],
          source: 'vimrc',
        },
        keyRemappingType: 'nunmap',
        expectNull: false,
      },
      {
        // Ignore non-mapping lines
        vimrcLine: 'set scrolloff=8',
        expectNull: true,
      },
      {
        // Ignore lines with mappings
        vimrcLine: 'imap jj <Esc>',
        expectNull: true,
      },
      {
        // Ignore lines with clearmappings
        vimrcLine: 'mapclear jj',
        expectNull: true,
      },
    ];

    for (const testCase of testCases) {
      const vimrcKeyRemapping = await vimrcKeyRemappingBuilder.buildUnmapping(testCase.vimrcLine);

      if (testCase.expectNull) {
        assert.strictEqual(vimrcKeyRemapping, undefined);
      } else {
        assert.deepStrictEqual(vimrcKeyRemapping!.keyRemapping, testCase.keyRemapping);
        assert.strictEqual(vimrcKeyRemapping!.keyRemappingType, testCase.keyRemappingType);
        assert.strictEqual(vimrcKeyRemapping!.keyRemapping.after, undefined);
        assert.strictEqual(vimrcKeyRemapping!.keyRemapping.commands, undefined);
      }
    }
  });
  test('Build IKeyRemapping clearMapping objects from .vimrc lines', async () => {
    const testCases = [
      {
        vimrcLine: 'mapclear',
        keyRemapping: {
          before: ['<Nop>'],
          source: 'vimrc',
        },
        keyRemappingType: 'mapclear',
        expectNull: false,
      },
      {
        vimrcLine: 'imapc',
        keyRemapping: {
          before: ['<Nop>'],
          source: 'vimrc',
        },
        keyRemappingType: 'imapc',
        expectNull: false,
      },
      {
        vimrcLine: 'imapcl',
        keyRemapping: {
          before: ['<Nop>'],
          source: 'vimrc',
        },
        keyRemappingType: 'imapcl',
        expectNull: false,
      },
      {
        vimrcLine: 'mapclear!',
        keyRemapping: {
          before: ['<Nop>'],
          source: 'vimrc',
        },
        keyRemappingType: 'mapclear!',
        expectNull: false,
      },
      {
        vimrcLine: 'vmapc',
        keyRemapping: {
          before: ['<Nop>'],
          source: 'vimrc',
        },
        keyRemappingType: 'vmapc',
        expectNull: false,
      },
      {
        // Clear mapping with <silent> argument (argument is ignored)
        vimrcLine: 'mapc <silent>',
        expectNull: true,
      },
      {
        // Clear mapping with <buffer> argument (argument is ignored)
        vimrcLine: 'nmapclear <buffer>',
        expectNull: true,
      },
      {
        // Clear mapping with multiple arguments with weird spacing (arguments are ignored)
        vimrcLine: 'nmapc <nowait> <silent>',
        expectNull: true,
      },
      {
        // Ignore non-mapping lines
        vimrcLine: 'set scrolloff=8',
        expectNull: true,
      },
      {
        // Ignore lines with mappings
        vimrcLine: 'imap jj <Esc>',
        expectNull: true,
      },
      {
        // Ignore lines with unmappings
        vimrcLine: 'unmap jj',
        expectNull: true,
      },
    ];

    for (const testCase of testCases) {
      const vimrcKeyRemapping = await vimrcKeyRemappingBuilder.buildClearMapping(
        testCase.vimrcLine,
      );

      if (testCase.expectNull) {
        assert.strictEqual(vimrcKeyRemapping, undefined);
      } else {
        assert.deepStrictEqual(vimrcKeyRemapping!.keyRemapping, testCase.keyRemapping);
        assert.strictEqual(vimrcKeyRemapping!.keyRemappingType, testCase.keyRemappingType);
        assert.strictEqual(vimrcKeyRemapping!.keyRemapping.after, undefined);
        assert.strictEqual(vimrcKeyRemapping!.keyRemapping.commands, undefined);
      }
    }
  });
});
