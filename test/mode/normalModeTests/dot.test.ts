import { Mode } from '../../../src/mode/mode';
import { Configuration } from '../../testConfiguration';
import { newTest } from '../../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './../../testUtils';

suite('Dot Operator', () => {
  suiteSetup(async () => {
    const configuration = new Configuration();
    configuration.tabstop = 4;
    configuration.expandtab = false;

    await setupWorkspace(configuration);
  });
  suiteTeardown(cleanUpWorkspace);

  newTest({
    title: "Can repeat '~' with <num>",
    start: ['|teXt'],
    keysPressed: '4~',
    end: ['TEx|T'],
  });

  newTest({
    title: "Can repeat '~' with dot",
    start: ['|teXt'],
    keysPressed: '~...',
    end: ['TEx|T'],
  });

  newTest({
    title: "Can repeat 'x'",
    start: ['|text'],
    keysPressed: 'x.',
    end: ['|xt'],
  });

  newTest({
    title: "Can repeat 'J'",
    start: ['|one', 'two', 'three'],
    keysPressed: 'J.',
    end: ['one two| three'],
  });

  newTest({
    title: 'Can handle dot with A',
    start: ['|one', 'two', 'three'],
    keysPressed: 'A!<Esc>j.j.',
    end: ['one!', 'two!', 'three|!'],
  });

  newTest({
    title: 'Can handle dot with I',
    start: ['on|e', 'two', 'three'],
    keysPressed: 'I!<Esc>j.j.',
    end: ['!one', '!two', '|!three'],
  });

  newTest({
    title: 'Can repeat actions that require selections',
    start: ['on|e', 'two'],
    keysPressed: 'Vj>.',
    end: ['\t\t|one', '\t\ttwo'],
  });
});

suite('Repeat content change', () => {
  suiteSetup(async () => {
    const configuration = new Configuration();
    configuration.tabstop = 4;
    configuration.expandtab = false;

    await setupWorkspace(configuration);
  });
  suiteTeardown(cleanUpWorkspace);

  newTest({
    title: 'Can repeat `<BS>`',
    start: ['abcd|e', 'ABCDE'],
    keysPressed: 'i<BS><Esc>' + 'j$.',
    end: ['abce', 'AB|CE'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can repeat `<BS><BS>`',
    start: ['abcd|e', 'ABCDE'],
    keysPressed: 'i<BS><BS><Esc>' + 'j$.',
    end: ['abe', 'A|BE'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can repeat `<BS>` within larger insertion',
    start: ['abcd|e', 'ABCDE'],
    keysPressed: 'ixy<BS>z<Esc>' + 'j$.',
    end: ['abcdxze', 'ABCDx|zE'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can repeat `<Del>`',
    start: ['|abcde', 'ABCDE'],
    keysPressed: 'a<Del><Esc>' + 'j0.',
    end: ['acde', '|ACDE'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can repeat `<Del><Del>`',
    start: ['|abcde', 'ABCDE'],
    keysPressed: 'a<Del><Del><Esc>' + 'j0.',
    end: ['ade', '|ADE'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can repeat `<Del>` within larger insertion',
    start: ['|abcde', 'ABCDE'],
    keysPressed: 'axy<Del>z<Esc>' + 'j0.',
    end: ['axyzcde', 'Axy|zCDE'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can repeat `<BS>` and `<Del>`',
    start: ['abc|def', 'ABCDEF'],
    keysPressed: 'i<BS><Del>0<Esc>' + 'j0fD.',
    end: ['ab0ef', 'AB|0EF'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can repeat insertion with newline',
    start: ['ab|cde', 'ABCDE'],
    keysPressed: 'i1\n2<Esc>' + 'j0ll.',
    end: ['ab1', '2cde', 'AB1', '|2CDE'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can repeat insertion with auto-matched brackets',
    start: ['|', ''],
    keysPressed: 'ifoo(bar<Esc>' + 'j.',
    end: ['foo(bar)', 'foo(ba|r)'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Repeat insertion with auto-matched parentheses in the middle',
    start: ['geometry.append(|width);', 'geometry.append(height);'],
    keysPressed: 'ce' + 'std::to_string(' + '<C-r>"' + '<Esc>' + 'j0fh' + '.',
    end: ['geometry.append(std::to_string(width));', 'geometry.append(std::to_string(heigh|t));'],
  });

  newTest({
    title: 'Repeat insertion that deletes auto-matched closing parenthesis',
    start: ['|', ''],
    keysPressed: 'i' + '[(' + '<Del>' + 'xyz' + '<Esc>' + 'j.',
    end: ['[(xyz]', '[(xy|z]'],
  });

  newTest({
    title: 'Can repeat `<C-y>`',
    start: ['abcde', '|12', 'ABCDE', '12'],
    keysPressed: 'A<C-y><C-y><Esc>' + 'jj0.',
    end: ['abcde', '12cd', 'ABCDE', '12c|d'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can repeat `<C-e>`',
    start: ['abcde', '|12', 'ABCDE', '12'],
    keysPressed: 'A<C-e><C-e><Esc>' + 'jj0.',
    end: ['abcde', '12CD', 'ABCDE', '12C|D'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can repeat '<C-t>'",
    start: ['on|e', 'two'],
    keysPressed: 'a<C-t><Esc>j.',
    end: ['\tone', '\ttw|o'],
  });

  newTest({
    title: "Can repeat insert change and '<C-t>'",
    start: ['on|e', 'two'],
    keysPressed: 'a<C-t>b<Esc>j.',
    end: ['\toneb', '\ttwo|b'],
  });

  newTest({
    title: 'Can repeat change by `<C-a>`',
    start: ['on|e', 'two'],
    keysPressed: 'a<C-t>b<Esc>ja<C-a><Esc>',
    end: ['\toneb', '\ttwo|b'],
  });

  newTest({
    title: 'Repeating insertion with arrows ignores everything before last arrow',
    start: ['one |two three'],
    keysPressed: 'i' + 'X<left>Y<left>Z' + '<Esc>' + 'W.',
    end: ['one ZYXtwo |Zthree'],
  });

  newTest({
    title: 'Repeating insertion with arrows always inserts just before cursor',
    start: ['o|ne two three'],
    keysPressed: 'A' + 'X<left>Y<left>Z' + '<Esc>' + '0W.',
    end: ['one |Ztwo threeZYX'],
  });

  newTest({
    title: 'Cached content change will be cleared by arrow keys',
    start: ['on|e', 'two'],
    keysPressed: 'a<C-t>b<left>c<Esc>j.',
    end: ['\tonecb', 'tw|co'],
  });

  newTest({
    title: 'Can repeat change after v<Esc> and :<Esc>',
    start: ['aaa bbb ccc dd|d'],
    keysPressed: 'ciwxxx<Esc>' + 'bb.' + 'bbv<Esc>.' + 'bb:<Esc>.',
    end: ['xx|x xxx xxx xxx'],
  });

  newTest({
    title: 'Can repeat change after V<Esc> and <C-q><Esc>',
    start: ['aaa bbb ccc dd|d'],
    keysPressed: 'ciwxxx<Esc>' + 'bb.' + 'bbV<Esc>.' + 'bb<C-q><Esc>.',
    end: ['xx|x xxx xxx xxx'],
  });
});

suite('Dot Operator repeat with remap', () => {
  setup(async () => {
    const configuration = new Configuration();
    configuration.insertModeKeyBindings = [
      {
        before: ['j', 'j', 'k'],
        after: ['<esc>'],
      },
    ];
    configuration.normalModeKeyBindings = [
      {
        before: ['<leader>', 'w'],
        after: ['d', 'w'],
      },
    ];
    configuration.leader = ' ';

    await setupWorkspace(configuration);
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: "Can repeat content change using 'jjk' mapped to '<Esc>' without trailing characters",
    start: ['on|e', 'two'],
    keysPressed: 'ciwfoojjkj.',
    end: ['foo', 'fo|o'],
  });

  newTest({
    title: "Can repeat '<leader>w' when mapped to 'dw'",
    start: ['|one two three'],
    keysPressed: ' w.',
    end: ['|three'],
  });

  newTest({
    title: 'Repeatable dot with insert mode',
    start: ['|', ''],
    keysPressed: 'ivar<Esc>j4.',
    end: ['var', 'varvarvarva|r'],
  });

  newTest({
    title: 'Repeatable dot with replace mode',
    start: ['|aaaaa', 'aaaaa'],
    keysPressed: 'r.j4.',
    end: ['.aaaa', '...|.a'],
  });
});
