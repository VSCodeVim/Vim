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
        },
        keyRemappingType: 'nnoremap',
        expectNull: false
      },
      {
        vimrcLine: 'imap jj <Esc>',
        keyRemapping: {
          before: ['j', 'j'],
          after: ['<Esc>'],
        },
        keyRemappingType: 'imap',
        expectNull: false
      },
      {
        vimrcLine: 'vnoremap <leader>" c""<Esc>P',
        keyRemapping: {
          before: ['<leader>', '"'],
          after: ['c', '"', '"', '<Esc>', 'P'],
        },
        keyRemappingType: 'vnoremap',
        expectNull: false
      },
      {
        // Mapping with a command
        vimrcLine: 'nnoremap <C-s> :w',
        keyRemapping: {
          before: ['<C-s>'],
          commands: [':w'],
        },
        keyRemappingType: 'nnoremap',
        expectNull: false
      },
      {
        // Ignore non-mapping lines
        vimrcLine: 'set scrolloff=8',
        expectNull: true
      },
    ];

    for (const testCase of testCases) {
      let vimrcKeyRemapping: IVimrcKeyRemapping | null =
        vimrcKeyRemappingBuilder.build(testCase.vimrcLine);

      if (testCase.expectNull) {
        assert.equal(vimrcKeyRemapping, null);
      } else {
        assert.deepEqual(vimrcKeyRemapping!.keyRemapping, testCase.keyRemapping);
        assert.equal(vimrcKeyRemapping!.keyRemappingType, testCase.keyRemappingType);
      }
    }
  });
});
