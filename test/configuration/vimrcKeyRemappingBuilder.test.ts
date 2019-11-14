import * as assert from 'assert';
import { IKeyRemapping, IVimrcKeyRemapping } from '../../src/configuration/iconfiguration';
import { vimrcKeyRemappingBuilder } from '../../src/configuration/vimrcKeyRemappingBuilder';

suite('VimrcKeyRemappingBuilder', () => {
  test('Build IKeyRemapping objects from .vimrc lines', () => {
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
        // Mapping with a command
        vimrcLine: 'nnoremap <C-s> :w',
        keyRemapping: {
          before: ['<C-s>'],
          commands: [':w'],
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
    ];

    for (const testCase of testCases) {
      const vimrcKeyRemapping: IVimrcKeyRemapping | undefined = vimrcKeyRemappingBuilder.build(
        testCase.vimrcLine
      );

      if (testCase.expectNull) {
        assert.strictEqual(vimrcKeyRemapping, undefined);
      } else {
        assert.deepStrictEqual(vimrcKeyRemapping!.keyRemapping, testCase.keyRemapping);
        assert.strictEqual(vimrcKeyRemapping!.keyRemappingType, testCase.keyRemappingType);
      }
    }
  });
});
