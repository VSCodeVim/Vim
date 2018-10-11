import { Configuration } from '../testConfiguration';
import { getTestingFunctions } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('foldFix', () => {
  let { newTest } = getTestingFunctions();

  teardown(cleanUpWorkspace);
  // expect "editor.foldingStrategy": "indentation"
  const lines = [
    'region1 line wrapped onto 3',
    '\tmary had',
    '\t\ta',
    'region2',
    '\tlittle lamb',
    'unfolded interjection 2a',
    'region3',
    '\twhose fleece was ',
    'unfolded interjection 3a',
    'region4',
    '\twhite as snow',
  ];
  const [
    region1,
    foldedLine1a,
    foldedLine1b,
    region2,
    foldedLine2a,
    unfoldedLine2a,
    region3,
    foldedLine3a,
    unfoldedLine3a,
    region4,
    foldedLine4a,
  ] = lines;
  // must ensure all regions are folded prior to performing other actions
  // note however that zM presently does not fold regions where the cursor rests
  const foldAllHotKey = 'zM';

  setup('foldFix', async () => {
    let configuration = new Configuration();
    configuration.foldfix = true;
    await setupWorkspace(configuration);
  });

  const cursorStartOfRegion1 = '|' + region1;
  const cursorStartOfRegion3 = '|' + region3;
  newTest({
    title: 'j moves down over folded regions',
    start: Object.assign([...lines], { 0: cursorStartOfRegion1 }),
    keysPressed: foldAllHotKey + 'lljjj',
    end: Object.assign([...lines], { 6: 're|gion3' }),
  });

  newTest({
    title: 'k moves up over folded regions',
    start: Object.assign([...lines], { 6: cursorStartOfRegion3 }),
    keysPressed: foldAllHotKey + 'llkkk',
    end: Object.assign([...lines], { 0: 're|gion1 line wrapped onto 3' }),
  });

  newTest({
    title: 'j and k move over folded regions without unfolding',
    start: Object.assign([...lines], { 0: cursorStartOfRegion1 }),
    keysPressed: foldAllHotKey + 'lljjjjjhkkkkjj',
    end: Object.assign([...lines], { 6: 'r|egion3' }),
  });

  newTest({
    title: 'repeat prefixed j and k move over folded regions without unfolding',
    start: Object.assign([...lines], { 0: cursorStartOfRegion1 }),
    keysPressed: foldAllHotKey + '3l5j2h4k2j',
    end: Object.assign([...lines], { 6: 'r|egion3' }),
  });

  newTest({
    title: 'insert mode: j and k move over folded regions without unfolding',
    start: Object.assign([...lines], { 0: cursorStartOfRegion1 }),
    keysPressed:
      foldAllHotKey +
      'i' +
      '<right>'.repeat(3) +
      '<down>'.repeat(5) +
      '<left>'.repeat(2) +
      '<up>'.repeat(4) +
      '<down>'.repeat(2) +
      'inserted',
    end: Object.assign([...lines], { 6: 'rinserted|egion3' }),
  });
  newTest({
    title: 'visual line mode: repeat prefixed j and k move over folded regions without unfolding',
    start: Object.assign([...lines], { 0: cursorStartOfRegion1 }),
    keysPressed: foldAllHotKey + 'V5j4k2jc' + 'replaced',
    end: Object.assign([region3, foldedLine3a, unfoldedLine3a, region4, foldedLine4a], {
      0: 'replaced|',
    }),
  });

  newTest({
    title: 'd5j deletes folded regions and moves down to correct line',
    start: Object.assign([...lines], { 0: cursorStartOfRegion1 }),
    keysPressed: foldAllHotKey + 'd5j',
    end: Object.assign([region4, foldedLine4a], { 0: '|region4' }),
  });

  newTest({
    title: 'd3k deletes folded regions and moves up to correct line',
    start: Object.assign([...lines], { 6: cursorStartOfRegion3 }),
    keysPressed: foldAllHotKey + 'd3k',
    end: Object.assign([unfoldedLine3a, region4, foldedLine4a], {
      0: '|unfolded interjection 3a',
    }),
  });

  newTest({
    title: 'dd deletes folded region not at last line',
    start: Object.assign([...lines], { 6: cursorStartOfRegion3 }),
    keysPressed: foldAllHotKey + 'dd',
    end: Object.assign([...lines.slice(0, 6).concat(lines.slice(8, 12))], {
      6: '|unfolded interjection 3a',
    }),
  });

  newTest({
    title: '5dd deletes multiple folded regions not at last line',
    start: Object.assign([...lines], { 0: cursorStartOfRegion1 }),
    keysPressed: foldAllHotKey + '5dd',
    end: Object.assign([region4, foldedLine4a], { 0: '|region4' }),
  });

  newTest({
    title: '2yy yanks folded regions not at last line',
    start: Object.assign([...lines], { 0: cursorStartOfRegion1 }),
    keysPressed: foldAllHotKey + '2yyjjp',
    end: immutableSplice(
      lines,
      6,
      0,
      '|' + region1,
      foldedLine1a,
      foldedLine1b,
      region2,
      foldedLine2a
    ),
  });
});

function immutableSplice<T>(array: T[], start: number, deleteCount: number, ...items: T[]) {
  const arr = [...array];
  arr.splice(start, deleteCount, ...items);
  return arr;
}
