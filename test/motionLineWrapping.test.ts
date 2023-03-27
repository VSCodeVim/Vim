import { Configuration } from './testConfiguration';
import { newTest } from './testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';

suite('motion line wrapping', () => {
  suiteTeardown(cleanUpWorkspace);

  suite('whichwrap enabled', () => {
    suiteSetup(async () => {
      const configuration = new Configuration();
      configuration.tabstop = 4;
      configuration.expandtab = false;
      configuration.whichwrap = 'h,l,<,>,[,]';

      await setupWorkspace(configuration);
    });

    suite('normal mode', () => {
      newTest({
        title: 'h wraps to previous line',
        start: ['line 1', '|line 2'],
        keysPressed: 'h',
        end: ['line |1', 'line 2'],
      });

      newTest({
        title: 'l wraps to next line',
        start: ['line |1', 'line 2'],
        keysPressed: 'l',
        end: ['line 1', '|line 2'],
      });

      newTest({
        title: '<left> wraps to previous line',
        start: ['line 1', '|line 2'],
        keysPressed: '<left>',
        end: ['line |1', 'line 2'],
      });

      newTest({
        title: '<right> wraps to next line',
        start: ['line |1', 'line 2'],
        keysPressed: '<right>',
        end: ['line 1', '|line 2'],
      });
    });

    suite('insert mode', () => {
      newTest({
        title: '<left> wraps to previous line',
        start: ['line 1', '|line 2'],
        // insert mode moves cursor one space to the left,
        // but not at beginning of line
        keysPressed: 'i<left>',
        end: ['line 1|', 'line 2'],
      });

      newTest({
        title: '<right> once goes to end of line',
        start: ['line |1', 'line 2'],
        // insert mode moves cursor one space to the left
        // so <right> once should go to eol
        keysPressed: 'i<right>',
        end: ['line 1|', 'line 2'],
      });

      newTest({
        title: '<right> twice wraps to next line',
        start: ['line |1', 'line 2'],
        // insert mode moves cursor one space to the left
        // so need to go right twice to wrap
        keysPressed: 'i<right><right>',
        end: ['line 1', '|line 2'],
      });
    });
  });

  suite('whichwrap disabled', () => {
    suiteSetup(async () => {
      const configuration = new Configuration();
      configuration.tabstop = 4;
      configuration.expandtab = false;

      await setupWorkspace(configuration);
    });

    suite('normal mode', () => {
      newTest({
        title: 'h does not wrap to previous line',
        start: ['line 1', '|line 2'],
        keysPressed: 'h',
        end: ['line 1', '|line 2'],
      });

      newTest({
        title: 'l does not wrap to next line',
        start: ['line |1', 'line 2'],
        keysPressed: 'l',
        end: ['line |1', 'line 2'],
      });

      newTest({
        title: '<left> does not wrap to previous line',
        start: ['line 1', '|line 2'],
        keysPressed: '<left>',
        end: ['line 1', '|line 2'],
      });

      newTest({
        title: '<right> does not wrap to next line',
        start: ['line |1', 'line 2'],
        keysPressed: '<right>',
        end: ['line |1', 'line 2'],
      });
    });

    suite('insert mode', () => {
      newTest({
        title: '<left> does not wrap to previous line',
        start: ['line 1', '|line 2'],
        keysPressed: 'i<left>',
        end: ['line 1', '|line 2'],
      });

      newTest({
        title: '<right> does not wrap to next line',
        start: ['line |1', 'line 2'],
        keysPressed: 'i<right><right>',
        end: ['line 1|', 'line 2'],
      });
    });
  });

  suite('wrapscan enabled', () => {
    suiteSetup(async () => {
      const configuration = new Configuration();
      configuration.wrapscan = true;

      await setupWorkspace(configuration);
    });

    newTest({
      title: 'search wraps around the end of the file',
      start: ['|line 1', 'line 2'],
      keysPressed: '/line\nn',
      end: ['|line 1', 'line 2'],
    });

    newTest({
      title: 'search wraps around the start of the file',
      start: ['|line 1', 'line 2'],
      keysPressed: '/line\nNN',
      end: ['line 1', '|line 2'],
    });
  });

  suite('wrapscan disabled', () => {
    suiteSetup(async () => {
      const configuration = new Configuration();
      configuration.wrapscan = false;

      await setupWorkspace(configuration);
    });

    newTest({
      title: 'search stops at the end of the file',
      start: ['|line 1', 'line 2'],
      keysPressed: '/line\nn',
      end: ['line 1', '|line 2'],
      statusBar: 'E385: Search hit BOTTOM without match for: line',
    });

    newTest({
      title: 'search stops at the start of the file',
      start: ['|line 1', 'line 2'],
      keysPressed: '/line\nNN',
      end: ['|line 1', 'line 2'],
      statusBar: 'E384: Search hit TOP without match for: line',
    });
  });
});
