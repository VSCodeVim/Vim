import { newTest } from '../../testSimplifier';
import { setupWorkspace } from './../../testUtils';

suite('matchpair empty', () => {
  setup(async () => {
    await setupWorkspace({ config: { matchpairs: '' } });
  });

  newTest({
    title: "basic motion doesn't work",
    start: ['bla |< blubb >'],
    keysPressed: '%',
    end: ['bla |< blubb >'],
  });
});

suite('matchpairs enabled', () => {
  suiteSetup(async () => {
    await setupWorkspace({ config: { matchpairs: '<:>' } });
  });

  suite('Tests for % with matchpairs', () => {
    newTest({
      title: 'basic jump with %',
      start: ['for |< bar > baz'],
      keysPressed: '%',
      end: ['for < bar |> baz'],
    });

    newTest({
      title: 'basic jump with %. cursor before pair',
      start: ['|for < bar > baz'],
      keysPressed: '%',
      end: ['for < bar |> baz'],
    });

    newTest({
      title: 'backwards jump with %',
      start: ['for < bar |> baz'],
      keysPressed: '%',
      end: ['for |< bar > baz'],
    });

    newTest({
      title: 'nested jump with %',
      start: ['for |< < bar > <boo> > baz'],
      keysPressed: '%',
      end: ['for < < bar > <boo> |> baz'],
    });
  });
});
