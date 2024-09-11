import { newTest } from '../../test/testSimplifier';
import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../../src/mode/modeHandler';
import { assertEqualLines, setupWorkspace } from './../testUtils';

// TODO(#4844): this fails on Windows
suite('bang (!) cmd_line', () => {
  if (process.platform === 'win32') {
    return;
  }

  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  suite('parsing', () => {
    test('simple !', async () => {
      await modeHandler.handleMultipleKeyEvents(':.!echo hello world\n'.split(''));
      assertEqualLines(['hello world']);
    });

    test('simple ! with space between bang and command', async () => {
      await modeHandler.handleMultipleKeyEvents(':.! echo hello world\n'.split(''));
      assertEqualLines(['hello world']);
    });

    test('! with line', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', '123\n456\n789', '<Esc>']);
      await modeHandler.handleMultipleKeyEvents(':2!echo hello world\n'.split(''));
      assertEqualLines(['123', 'hello world', '789']);
    });

    test('! with line range', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', '123\n456\n789', '<Esc>']);
      await modeHandler.handleMultipleKeyEvents(':2,3!echo hello world\n'.split(''));
      assertEqualLines(['123', 'hello world']);
    });
  });

  suite('previous external commands (embedded bangs)', () => {
    test('!! should execute previous command', async () => {
      await modeHandler.handleMultipleKeyEvents(':.! echo hello world\n'.split(''));
      await modeHandler.handleMultipleKeyEvents(['o', '<Esc>']);
      await modeHandler.handleMultipleKeyEvents(':.!!\n'.split(''));
      assertEqualLines(['hello world', 'hello world']);
    });

    test('!! should support command concatenation', async () => {
      await modeHandler.handleMultipleKeyEvents(':.! echo hello world\n'.split(''));
      await modeHandler.handleMultipleKeyEvents(['o', '<Esc>']);
      await modeHandler.handleMultipleKeyEvents(':.!! world\n'.split(''));
      assertEqualLines(['hello world', 'hello world world']);
    });

    test('any ! in cmd is replaced with previous external command', async () => {
      await modeHandler.handleMultipleKeyEvents(':!dir\n'.split(''));
      await modeHandler.handleMultipleKeyEvents(':.!echo !! hello\n'.split(''));
      assertEqualLines(['dirdir hello']);
    });

    test('only the ! character can be unescaped, with a backslash', async () => {
      await modeHandler.handleMultipleKeyEvents(':!dir\n'.split(''));
      await modeHandler.handleMultipleKeyEvents(':.!echo "! \\! \\\\! \\p"\n'.split(''));
      assertEqualLines(['dir ! \\! \\p']);
    });
  });

  suite('stdin/stdout/stderr', () => {
    test('! can read from stdin', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', 'abc', '<Esc>']);
      await modeHandler.handleMultipleKeyEvents(':.!cat\n'.split(''));
      assertEqualLines(['abc']);
    });

    test(':{line}!{cmd} should pass in line as stdin', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', 'hello world', '<Esc>']);
      await modeHandler.handleMultipleKeyEvents(':1!cat\n'.split(''));
      assertEqualLines(['hello world']);
    });

    test(':{range}!{cmd} should pass in line range as stdin', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', '4\n3\n2\n1', '<Esc>']);
      await modeHandler.handleMultipleKeyEvents(':2,4!sort -n\n'.split(''));
      assertEqualLines(['4', '1', '2', '3']);
    });

    test('! with commands expecting stdin do not block when no stdin is supplied', async () => {
      await modeHandler.handleMultipleKeyEvents(':!cat\n'.split(''));
      assertEqualLines(['']);
    });

    test('! can read from both stdout and stderr', async () => {
      await modeHandler.handleMultipleKeyEvents(
        ':.!echo "stdout" && >&2 echo "stderr"\n'.split(''),
      );
      assertEqualLines(['stdout', 'stderr']);
    });

    test('piping commands works', async () => {
      await modeHandler.handleMultipleKeyEvents(':.!printf "c\\nb\\na" | sort\n'.split(''));
      assertEqualLines(['a', 'b', 'c']);
    });
  });
});

suite('custom bang shell', () => {
  if (process.platform === 'win32') {
    return;
  }

  for (const shell of ['sh', 'bash']) {
    suite(shell, () => {
      setup(async () => {
        await setupWorkspace({
          config: { shell: `/bin/${shell}` },
        });
      });

      newTest({
        title: `! supports /bin/${shell}`,
        start: ['|'],
        keysPressed: '<Esc>:.!echo $0\n',
        end: [`|/bin/${shell}`],
      });
    });
  }
});
