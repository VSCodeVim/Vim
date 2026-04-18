import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

import { getAndUpdateModeHandler } from '../../extension';
import { ExCommandLine } from '../../src/cmd_line/commandLine';
import { configuration } from '../../src/configuration/configuration';
import { ModeHandler } from '../../src/mode/modeHandler';
import { StatusBar } from '../../src/statusBar';
import { setupWorkspace } from '../testUtils';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

function tmpFile(name: string): string {
  return path.join(
    os.tmpdir(),
    `vscodevim-source-${Date.now()}-${Math.random().toString(36).slice(2)}-${name}`,
  );
}

async function runSource(modeHandler: ModeHandler, file: string): Promise<void> {
  await new ExCommandLine(`source ${file}`, modeHandler.vimState.currentMode).run(
    modeHandler.vimState,
  );
}

suite(':source', () => {
  let modeHandler: ModeHandler;
  const tempFiles: string[] = [];

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  teardown(async () => {
    while (tempFiles.length) {
      const f = tempFiles.pop()!;
      try {
        await unlink(f);
      } catch {
        // ignore
      }
    }
  });

  const fixture = async (name: string, contents: string): Promise<string> => {
    const p = tmpFile(name);
    await writeFile(p, contents);
    tempFiles.push(p);
    return p;
  };

  test('sources an nnoremap line into the live configuration', async () => {
    const before = configuration.normalModeKeyBindingsNonRecursive.length;
    const file = await fixture('mapping.vim', 'nnoremap <leader>zz :nohl<CR>\n');

    await runSource(modeHandler, file);

    assert.strictEqual(
      configuration.normalModeKeyBindingsNonRecursive.length,
      before + 1,
      'expected one new non-recursive normal-mode binding',
    );
  });

  test('skips comments and blank lines', async () => {
    const before = configuration.normalModeKeyBindingsNonRecursive.length;
    const file = await fixture(
      'comments.vim',
      ['" a comment', '', '   " indented comment', 'nnoremap <leader>xx :nohl<CR>', ''].join('\n'),
    );

    await runSource(modeHandler, file);

    assert.strictEqual(configuration.normalModeKeyBindingsNonRecursive.length, before + 1);
  });

  test('executes regular ex commands (:nohl)', async () => {
    const file = await fixture('nohl.vim', 'nohl\n');
    await runSource(modeHandler, file);
    // :nohl is a no-op when no search is active; the test verifies it
    // does not error out and no "not yet implemented" status is set.
    assert.ok(!StatusBar.getText().includes('not yet implemented'));
  });

  test('follows nested :source', async () => {
    const before = configuration.normalModeKeyBindingsNonRecursive.length;
    const inner = await fixture('inner.vim', 'nnoremap <leader>aa :nohl<CR>\n');
    const outer = await fixture('outer.vim', `source ${inner}\n`);

    await runSource(modeHandler, outer);

    assert.strictEqual(configuration.normalModeKeyBindingsNonRecursive.length, before + 1);
  });

  test('detects recursive source cycles', async () => {
    const aPath = tmpFile('cycle-a.vim');
    const bPath = tmpFile('cycle-b.vim');
    tempFiles.push(aPath, bPath);
    await writeFile(aPath, `source ${bPath}\n`);
    await writeFile(bPath, `source ${aPath}\n`);

    await runSource(modeHandler, aPath);

    assert.ok(
      StatusBar.getText().includes('Recursive') || StatusBar.getText().includes('error'),
      `expected recursion error in status bar, got: ${StatusBar.getText()}`,
    );
  });

  test('reports missing file via status bar', async () => {
    const missing = path.join(os.tmpdir(), 'vscodevim-source-does-not-exist.vim');
    await runSource(modeHandler, missing);
    assert.ok(
      StatusBar.getText().includes("Can't open file"),
      `expected missing-file error, got: ${StatusBar.getText()}`,
    );
  });
});
