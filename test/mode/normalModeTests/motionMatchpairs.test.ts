import { newTest } from '../../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './../../testUtils';
import { Configuration } from '../../testConfiguration';

suite('matchpair empty', () => {
  setup(async () => {
    const configuration = new Configuration();
    configuration.matchpairs = '';
    await setupWorkspace(configuration);
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: "basic motion doesn't work",
    start: ['bla |< blubb >'],
    keysPressed: '%',
    end: ['bla |< blubb >'],
  });
});

suite('matchpairs enabled', () => {
  suiteSetup(async () => {
    const configuration = new Configuration();
    configuration.matchpairs = '<:>';
    await setupWorkspace(configuration);
  });
  suiteTeardown(cleanUpWorkspace);

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
