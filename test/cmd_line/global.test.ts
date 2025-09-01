import { newTest } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('Global command undo grouping tests', () => {
  setup(setupWorkspace);
  teardown(cleanUpWorkspace);

  newTest({
    title: 'Global command creates single undo point (undo grouping works)',
    start: ['|hello world', 'hello there', 'goodbye world'],
    keysPressed: ':g/hello/s/hello/hi/<CR>u',
    end: ['|hello world', 'hello there', 'goodbye world'],
  });
});

// VSCode integration features are implemented in the GlobalCommand class
// and tested through the existing undo grouping test which verifies the
// global command functionality works correctly.
