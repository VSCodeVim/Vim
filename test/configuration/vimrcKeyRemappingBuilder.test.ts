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
});
