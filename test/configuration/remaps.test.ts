import { getAndUpdateModeHandler } from '../../extension';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { newTestWithRemaps, newTestWithRemapsSkip } from '../testSimplifier';
import { setupWorkspace } from '../testUtils';

suite('Remaps', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    // The timeout shouldn't be lower then 200ms when testing because it might result in some tests
    // failing when they shouldn't. I ran this test successfully with this timeout as low as 50ms, but
    // lower than that I start getting some issues. I still set this a little bit higher because it
    // might change from machine to machine.
    await setupWorkspace({
      config: {
        timeout: 200,
        leader: ' ',
      },
    });
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  newTestWithRemaps({
    title: 'Can handle ambiguous remaps on different recursiveness mappings',
    start: ['|one two three'],
    remaps: {
      normalModeKeyBindings: [
        {
          before: ['<leader>', 'w'],
          after: ['w'],
        },
        {
          before: ['w', 'w'],
          after: ['b'],
        },
      ],
      normalModeKeyBindingsNonRecursive: [
        {
          before: ['w'],
          after: ['w', 'w'],
        },
      ],
    },
    steps: [
      {
        // Step 0: Press keys '<space>w' that remap to 'w' but since 'w' is an ambiguous remap it waits
        // for timeout or another key to come. In step result with 'end' we assert the result right after
        // the keys are handled. When we use the 'endAfterTimeout' we are telling the test to wait for
        // timeout to end and then assert the result.
        keysPressed: ' w',
        stepResult: {
          end: ['|one two three'],
          endAfterTimeout: ['one two |three'],
        },
      },
      {
        // Step 1: Again we press the keys '<space>w' that remaps to 'w' and waits for timeout and we assert
        // that nothing has changed since the last result after the keys are handled.
        keysPressed: ' w',
        stepResult: {
          end: ['one two |three'],
        },
      },
      {
        // Step 2: Since we didn't wait for timeout on the previous step it is still waiting for timeout to
        // finish or another key to come so when we now press the key 'w' it gets 'ww' and remaps it to 'b'.
        keysPressed: 'w',
        stepResult: {
          end: ['one |two three'],
        },
      },
    ],
  });

  newTestWithRemaps({
    title:
      'Potential and ambiguous remaps on different recursiveness mappings with different sizes are handled by the correct Remapper',
    start: ['|one two three'],
    remaps: {
      normalModeKeyBindings: [
        {
          before: ['<leader>', 'b', 'b'],
          after: ['w'],
        },
        {
          before: ['<leader>', 'w'],
          after: ['$'],
        },
        {
          before: ['<leader>', 'e', 'e'],
          after: ['i', 'e', 'e', '<Esc>'],
        },
        {
          before: ['<leader>', 'l', 'l', 'l'],
          after: ['i', 'l', 'l', 'l', '<Esc>'],
        },
      ],
      normalModeKeyBindingsNonRecursive: [
        {
          before: ['<leader>', 'b'],
          after: ['0'],
        },
        {
          before: ['<leader>', 'w', 'w'],
          after: ['b'],
        },
        {
          before: ['<leader>', 'e', 'e', 'e'],
          after: ['i', 'e', 'e', 'e', '<Esc>'],
        },
        {
          before: ['<leader>', 'l', 'l'],
          after: ['i', 'l', 'l', '<Esc>'],
        },
      ],
    },
    steps: [
      {
        // Step 0: Press keys '<space>w' that remap to '$' but since there is the '<space>ww' potential
        // remap it waits for timeout or another key to come. The recursive remap needs to know that it
        // has a potential remap and needs to wait but after timeout finishes it also needs to know that
        // there is a NonRecursive remap with a potential remap that needs to be checked and vice-versa.
        // In step result with 'end' we assert the result right after the keys are handled. When we use
        // the 'endAfterTimeout' we are telling the test to wait for timeout to end and then assert the
        // result.
        keysPressed: ' w',
        stepResult: {
          end: ['|one two three'],
          endAfterTimeout: ['one two thre|e'],
        },
      },
      {
        // Step 1: Again we press the keys '<space>w' and we assert that nothing has changed since the
        // last result after the keys are handled.
        keysPressed: ' w',
        stepResult: {
          end: ['one two thre|e'],
        },
      },
      {
        // Step 2: Since we didn't wait for timeout on the previous step it is still waiting for timeout to
        // finish or another key to come so when we now press the key 'w' it gets '<space>ww' and remaps it
        // to 'b'.
        keysPressed: 'w',
        stepResult: {
          end: ['one two |three'],
        },
      },
      {
        // Step 3: Press keys '<space>b' that remap to '0' but since there is the '<space>bb' potential
        // remap it waits for timeout or another key to come. Same thing as step 0 applies but in different
        // recursiveness.
        keysPressed: ' b',
        stepResult: {
          end: ['one two |three'],
          endAfterTimeout: ['|one two three'],
        },
      },
      {
        // Step 4: Again we press the keys '<space>b' and we assert that nothing has changed since the
        // last result after the keys are handled.
        keysPressed: ' b',
        stepResult: {
          end: ['|one two three'],
        },
      },
      {
        // Step 5: Since we didn't wait for timeout on the previous step it is still waiting for timeout to
        // finish or another key to come so when we now press the key 'b' it gets '<space>bb' and remaps it
        // to 'w'.
        keysPressed: 'b',
        stepResult: {
          end: ['one |two three'],
        },
      },
      {
        // Step 6: '<space>ee' should be handled by the RecursiveRemapper after timeout
        keysPressed: ' ee',
        stepResult: {
          end: ['one |two three'],
          endAfterTimeout: ['one e|etwo three'],
        },
      },
      {
        // Step 7: '<space>eee' should be handled by the NonRecursiveRemapper without timeout
        keysPressed: ' eee',
        stepResult: {
          end: ['one eee|eetwo three'],
        },
      },
      {
        // Step 8: '<space>ll' should be handled by the NonRecursiveRemapper after timeout
        keysPressed: ' ll',
        stepResult: {
          end: ['one eee|eetwo three'],
          endAfterTimeout: ['one eeel|leetwo three'],
        },
      },
      {
        // Step 9: '<space>lll' should be handled by the RecursiveRemapper without timeout
        keysPressed: ' lll',
        stepResult: {
          end: ['one eeelll|lleetwo three'],
        },
      },
    ],
  });

  newTestWithRemaps({
    title:
      'A multiple key sequence with potential remaps on both recursiveness but without a \
    remapping, handles all its keys after timeout',
    start: ['|one two three'],
    remaps: {
      normalModeKeyBindings: [
        {
          before: ['x', 'x', 'x', 'x'],
          after: ['i', '4', 'x', '<Esc>'],
        },
        {
          before: ['l', 'l', 'l', 'l', 'l'],
          after: ['i', '5', 'l', '<Esc>'],
        },
      ],
      normalModeKeyBindingsNonRecursive: [
        {
          before: ['x', 'x', 'x', 'x', 'x'],
          after: ['i', '5', 'x', '<Esc>'],
        },
        {
          before: ['l', 'l', 'l', 'l'],
          after: ['i', '4', 'l', '<Esc>'],
        },
      ],
    },
    steps: [
      {
        // Step 0: 'xxx' has no remapping and not actions so it does nothing but should still
        // wait for timeout because of the potential remaps.
        title: '"xxx" has no remapping but still needs to wait for timeout to finish.',
        keysPressed: 'xxx',
        stepResult: {
          end: ['|one two three'],
          endAfterTimeout: ['| two three'],
        },
      },
      {
        // Step 1: 'lll' has no remapping and not actions so it does nothing but should still
        // wait for timeout because of the potential remaps.
        title: '"lll" has no remapping but still needs to wait for timeout to finish.',
        keysPressed: 'lll',
        stepResult: {
          end: ['| two three'],
          endAfterTimeout: [' tw|o three'],
        },
      },
    ],
  });

  newTestWithRemaps({
    title: 'Can handle vimrc mappings',
    start: ['one |two three'],
    remaps: ['nmap <leader>w w', 'nmap <leader>a <leader>w', 'nmap <leader>ww b'],
    steps: [
      {
        // Step 0:
        keysPressed: ' a',
        stepResult: {
          end: ['one |two three'],
          endAfterTimeout: ['one two |three'],
        },
      },
    ],
  });

  newTestWithRemaps({
    title: "Recursive mappings where the after starts with before don't loop",
    remaps: ['nmap ab abcd'],
    start: ['|'],
    steps: [
      {
        // Step 0:
        keysPressed: 'ab',
        stepResult: {
          end: ['bcd|'],
          endMode: Mode.Insert,
        },
      },
    ],
  });

  // TODO: skipped (flaky)
  newTestWithRemapsSkip({
    title:
      'Ambiguous Mappings with a long remapping still succeed after timeout or when a key is pressed to break ambiguity',
    remaps: [
      'nmap ab abcdefghijklmnopqrstuvwxyz',
      'nmap abc aAmbiguous<Esc>',
      'imap jj <Esc>',
      'imap jn AnotherLongAmbiguousRemap<Esc>',
      'imap jnbn IExistJustToCreateAmbiguityWithRemainingKeys<Esc>',
    ],
    start: ['|'],
    steps: [
      {
        // Step 0:
        title: 'Before timeout should be equal to start and waits for timeout before remapping',
        keysPressed: 'ab',
        stepResult: {
          end: ['|'],
          endMode: Mode.Normal,
          endAfterTimeout: ['bcdefghijklmnopqrstuvwxyz|'],
          endModeAfterTimeout: Mode.Insert,
        },
      },
      {
        // Step 1:
        title:
          'Key given after the ambiguous remap that breaks ambiguity makes it run straight away',
        keysPressed: '<Esc>ddab<Esc>',
        stepResult: {
          end: ['bcdefghijklmnopqrstuvwxy|z'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 2:
        title:
          'Key given after the ambiguous remap that breaks ambiguity makes it run straight away even if that key is itself a remap',
        keysPressed: 'jjddabjj',
        stepResult: {
          end: ['bcdefghijklmnopqrstuvwxy|z'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 3:
        title:
          'Key given after the ambiguous remap that breaks ambiguity makes it run straight away even if that key is itself another potential remap that waits for timeout',
        keysPressed: 'jjddabj',
        stepResult: {
          end: ['bcdefghijklmnopqrstuvwxyz|'],
          endMode: Mode.Insert,
          endAfterTimeout: ['bcdefghijklmnopqrstuvwxyzj|'],
          endModeAfterTimeout: Mode.Insert,
        },
      },
      {
        // Step 4:
        title:
          'Key given after the ambiguous remap that breaks ambiguity makes it run straight away even if that key is itself another long ambiguous remap that waits for timeout and has remaining keys to be handled',
        keysPressed: 'jjddabjnb',
        stepResult: {
          end: ['bcdefghijklmnopqrstuvwxyz|'],
          endMode: Mode.Insert,
          endAfterTimeout: ['|bcdefghijklmnopqrstuvwxyzAnotherLongAmbiguousRemap'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
    ],
  });

  newTestWithRemaps({
    title: 'Remaps that call themselves run until an error',
    remaps: ['nmap <leader>$ 0f£xA$00<Esc>', 'nmap <leader>$G <leader>$j<leader>$G'],
    start: ['|10£', '15£', '350£', '2£', '5£'],
    steps: [
      {
        // Step 0:
        title:
          'Calls itself until it errors (if this test fails with wrong cursor on last character instead of first it might mean that someone made the "j" fail when on last line YAY! :) if so please update this step to change the expected cursor to be on last character of last line)',
        keysPressed: ' $G',
        stepResult: {
          end: ['10$00', '15$00', '350$00', '2$00', '|5$00'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 1:
        title: 'Prepare for next step',
        keysPressed: 'uG5o<Esc>gg',
        stepResult: {
          end: ['|10£', '15£', '350£', '2£', '5£', '', '', '', '', ''],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 2:
        title:
          'Calls itself until it errors and checks that the remaining keys that break ambiguity are not handled because they are not typed by the user',
        keysPressed: ' $G',
        stepResult: {
          end: ['10$00', '15$00', '350$00', '2$00', '5$00', '|', '', '', '', ''],
          endMode: Mode.Normal,
        },
      },
    ],
  });

  newTestWithRemaps({
    title:
      'Potential remaps that have remaining keys when broken should only handle those keys if typed by the user (test mentioned on remapper.ts)',
    remaps: [
      'nmap <leader>lf Lfill',
      'nmap <leader>lF Lfillr',
      'nmap Lfillc 4I<space><esc>',
      'nmap Lfillp 2I<space><esc>',
      'nmap Lfillrs 2I<space><esc>',
    ],
    start: ['|Hello World again!', 'Hello World!'],
    steps: [
      {
        // Step 0:
        title:
          'Lfill typed by the user should handle all keys even if there is a failed action in the middle (in this case the "fi")',
        keysPressed: 'Lfill',
        stepResult: {
          end: ['|Hello World again!', 'Hello World!'],
          endMode: Mode.Normal,
          endAfterTimeout: ['Hello World again!', 'He|llo World!'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 1:
        title: 'Lfill typed via remap should handle all keys if there is no failed action',
        keysPressed: 'ai<Esc>k0 lf',
        stepResult: {
          end: ['|Hello World again!', 'Helilo World!'],
          endMode: Mode.Normal,
          endAfterTimeout: ['Hello World again!', 'Helil|o World!'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 2:
        title:
          'Lfill typed via remap should not handle the remaining keys after a failed action in the middle (in this case the "fi")',
        keysPressed: 'hhxk0 lf',
        stepResult: {
          end: ['|Hello World again!', 'Hello World!'],
          endMode: Mode.Normal,
          endAfterTimeout: ['Hello World again!', '|Hello World!'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 3:
        title:
          'Lfill typed via remap with a user pressed key after should run the corresponding remap',
        keysPressed: 'k0 lfc',
        stepResult: {
          end: ['   | Hello World again!', 'Hello World!'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 4:
        title:
          'Lfill typed via remap with a wrong user pressed key after should not handle the keys after failed action but should handle the user pressed key',
        keysPressed: 'j0 lfx',
        stepResult: {
          end: ['    Hello World again!', '|ello World!'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 5:
        title:
          'Lfill typed via remap with multiple wrong user pressed keys after should not handle the keys after failed action but should handle the user pressed keys',
        keysPressed: ' lfrcl',
        stepResult: {
          end: ['    Hello World again!', 'c|llo World!'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 6:
        title:
          'Lfillr typed via remap with a wrong user pressed key after should not handle the keys after failed action but should handle the user pressed key',
        keysPressed: ' lFdl',
        stepResult: {
          end: ['    Hello World again!', '|llo World!'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 7:
        title:
          'Lfill typed via remap with multiple right user pressed keys after should run the corresponding remap and the rest of the keys',
        keysPressed: ' lfrsl',
        stepResult: {
          end: ['    Hello World again!', '  |llo World!'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 8:
        title: 'Lfillrdl typed by the user should handle all the keys',
        keysPressed: 'Lfillrdl',
        stepResult: {
          end: ['    Hello World again!', '  d|lo World!'],
          endMode: Mode.Normal,
        },
      },
    ],
  });

  newTestWithRemaps({
    title:
      'Ambiguous remaps that have remaining keys when broken should only handle those keys if typed by the user (test mentioned on remapper.ts)',
    remaps: [
      'nmap <leader>lf Lfill',
      'nmap <leader>lF Lfillr',
      'nmap L G',
      'nmap Lfillc 4I<space><esc>',
      'nmap Lfillp 2I<space><esc>',
      'nmap Lfillrs 2I<space><esc>',
    ],
    start: ['|Hello World again!', 'Hello World!'],
    steps: [
      {
        // Step 0:
        title:
          'Lfill typed by the user should handle all keys even if there is a failed action in the middle (in this case the "fi")',
        keysPressed: 'Lfill',
        stepResult: {
          end: ['|Hello World again!', 'Hello World!'],
          endMode: Mode.Normal,
          endAfterTimeout: ['Hello World again!', 'He|llo World!'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 1:
        title: 'Lfill typed via remap should handle all keys if there is no failed action',
        keysPressed: 'ai<Esc>k0 lf',
        stepResult: {
          end: ['|Hello World again!', 'Helilo World!'],
          endMode: Mode.Normal,
          endAfterTimeout: ['Hello World again!', 'Helil|o World!'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 2:
        title:
          'Lfill typed via remap should not handle the remaining keys after a failed action in the middle (in this case the "fi")',
        keysPressed: 'hhxk0 lf',
        stepResult: {
          end: ['|Hello World again!', 'Hello World!'],
          endMode: Mode.Normal,
          endAfterTimeout: ['Hello World again!', '|Hello World!'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 3:
        title:
          'Lfill typed via remap with a user pressed key after should run the corresponding remap',
        keysPressed: 'k0 lfc',
        stepResult: {
          end: ['   | Hello World again!', 'Hello World!'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 4:
        title:
          'Lfill typed via remap with a wrong user pressed key after should not handle the keys after failed action but should handle the user pressed key',
        keysPressed: 'j0 lfx',
        stepResult: {
          end: ['    Hello World again!', '|ello World!'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 5:
        title:
          'Lfill typed via remap with multiple wrong user pressed keys after should not handle the keys after failed action but should handle the user pressed keys',
        keysPressed: ' lfrcl',
        stepResult: {
          end: ['    Hello World again!', 'c|llo World!'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 6:
        title:
          'Lfillr typed via remap with a wrong user pressed key after should not handle the keys after failed action but should handle the user pressed key',
        keysPressed: ' lFdl',
        stepResult: {
          end: ['    Hello World again!', '|llo World!'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 7:
        title:
          'Lfill typed via remap with multiple right user pressed keys after should run the corresponding remap',
        keysPressed: ' lfrsl',
        stepResult: {
          end: ['    Hello World again!', '  |llo World!'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 8:
        title: 'Lfillrdl typed by the user should handle all the keys',
        keysPressed: 'Lfillrdl',
        stepResult: {
          end: ['    Hello World again!', '  d|lo World!'],
          endMode: Mode.Normal,
        },
      },
    ],
  });

  newTestWithRemaps({
    title:
      'Ambiguous remaps that have remaining keys when broken should only handle those keys if typed by the user (with changing Modes)',
    remaps: ['vmap jk <Esc>', 'vmap jkfila <Esc>', 'vmap jkff jkfil'],
    start: ['|Hello World again!', 'Hello World!'],
    steps: [
      {
        // Step 0:
        title: 'jkfil typed by the user should handle all keys',
        keysPressed: 'vjkfil',
        stepResult: {
          end: ['|Hello World again!', 'Hello World!'],
          endMode: Mode.Visual,
          endAfterTimeout: ['Hello World agai|n!', 'Hello World!'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 1:
        title:
          'jkfil typed by the user should handle all keys even if there is a failed action in the middle (in this case the "fi")',
        keysPressed: 'j0vjkfil',
        stepResult: {
          end: ['Hello World again!', '|Hello World!'],
          endMode: Mode.Visual,
          endAfterTimeout: ['Hello World again!', 'H|ello World!'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 2:
        title: 'jkfil typed via remap should handle all keys if there is no failed action',
        keysPressed: 'k0vjkff',
        stepResult: {
          end: ['|Hello World again!', 'Hello World!'],
          endMode: Mode.Visual,
          endAfterTimeout: ['Hello World agai|n!', 'Hello World!'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 3:
        title:
          'jkfil typed via remap should not handle the remaining keys after a failed action in the middle (in this case the "fi")',
        keysPressed: 'j0vjkff',
        stepResult: {
          end: ['Hello World again!', '|Hello World!'],
          endMode: Mode.Visual,
          endAfterTimeout: ['Hello World again!', '|Hello World!'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
    ],
  });

  newTestWithRemaps({
    title: 'Non recursive remaps should stop running when they encounter a failed action',
    remaps: ['nn <leader>a 0f£r€'],
    start: ['|10£', '15€'],
    steps: [
      {
        keysPressed: ' a',
        stepResult: {
          end: ['10|€', '15€'],
        },
      },
      {
        keysPressed: 'j a',
        stepResult: {
          end: ['10€', '|15€'],
        },
      },
    ],
  });

  newTestWithRemaps({
    title: 'Can remap 0 and still use 0 in count',
    remaps: ['nmap 0 dw'],
    start: ['|one two three four five six seven eight nine ten'],
    steps: [
      {
        title: 'Here 0 should be remapped',
        keysPressed: '0',
        stepResult: {
          end: ['|two three four five six seven eight nine ten'],
        },
      },
      {
        title: 'Here 0 should not be remapped',
        keysPressed: '10l',
        stepResult: {
          end: ['two three |four five six seven eight nine ten'],
        },
      },
    ],
  });

  newTestWithRemaps({
    title: 'Can handle operator pending mode remaps',
    remaps: ['omap L g_', 'ono w aw'],
    start: ['|Just another test sentence', 'Just another test sentence'],
    steps: [
      {
        keysPressed: 'dL',
        stepResult: {
          end: ['|', 'Just another test sentence'],
        },
      },
      {
        keysPressed: 'jldw',
        stepResult: {
          end: ['', '|another test sentence'],
        },
      },
    ],
  });

  newTestWithRemaps({
    title:
      'Can handle remaps with multiple keys other than the ones starting with <leader>, g or z',
    remaps: [
      'map ,l $', // this map creates the mapping for normal, operatorPending and visual modes
    ],
    start: ['|Yet another test sentence'],
    steps: [
      {
        keysPressed: ',l',
        stepResult: {
          end: ['Yet another test sentenc|e'],
        },
      },
      {
        keysPressed: '0d,l',
        stepResult: {
          end: ['|'],
        },
      },
      {
        keysPressed: 'u',
        stepResult: {
          end: ['|Yet another test sentence'],
        },
      },
      {
        keysPressed: 'lv,ld',
        stepResult: {
          end: ['|Y'],
        },
      },
    ],
  });

  newTestWithRemaps({
    title: 'Can handle d -> "_d remaps even when doing dd',
    remaps: ['nnoremap d "_d'],
    start: ['|one two three'],
    steps: [
      {
        keysPressed: 'yww',
        stepResult: {
          end: ['one |two three'],
        },
      },
      {
        keysPressed: 'dw',
        stepResult: {
          end: ['one |three'],
        },
      },
      {
        keysPressed: 'P',
        stepResult: {
          end: ['one one| three'],
        },
      },
      {
        keysPressed: 'dd',
        stepResult: {
          end: ['|'],
        },
      },
      {
        keysPressed: 'p',
        stepResult: {
          end: ['one| '],
        },
      },
    ],
  });

  newTestWithRemaps({
    title:
      'Can handle multiple insert remaps even when starting one with a leading key that is the start of another possible remap',
    remaps: {
      insertModeKeyBindings: [
        {
          before: ['q', 'r'],
          after: ['<Esc>'],
        },
        {
          before: ['t', 'h', 'r', 'u', 'n'],
          after: [
            't',
            'h',
            'r',
            'o',
            'w',
            ' ',
            '"',
            'U',
            'n',
            'i',
            'm',
            'p',
            'l',
            'e',
            'm',
            'e',
            'n',
            't',
            'e',
            'd',
            '"',
            ';',
            ' ',
            '/',
            '/',
            'T',
            'O',
            'D',
            'O',
            ' ',
            'i',
            'm',
            'p',
            'l',
            'e',
            'm',
            'e',
            'n',
            't',
            'q',
            'r',
            '=',
            '0',
          ],
        },
      ],
    },
    start: ['|'],
    steps: [
      {
        keysPressed: 'atest\nqr',
        stepResult: {
          end: ['test', '|'],
          endMode: Mode.Normal,
        },
      },
      {
        keysPressed: 'ithrun',
        stepResult: {
          end: ['test', '|throw "Unimplemented"; //TODO implement'],
          endMode: Mode.Normal,
        },
      },
      {
        keysPressed: 'itqr',
        stepResult: {
          end: ['test', '|tthrow "Unimplemented"; //TODO implement'],
          endMode: Mode.Normal,
        },
      },
      {
        keysPressed: 'oqthrun',
        stepResult: {
          end: [
            'test',
            'tthrow "Unimplemented"; //TODO implement',
            '|qthrow "Unimplemented"; //TODO implement',
          ],
          endMode: Mode.Normal,
        },
      },
    ],
  });

  newTestWithRemaps({
    title:
      'Can handle remaps with ambiguous remaps on both types of recursiveness with longer NonRecursive remaps',
    remaps: [
      'nmap ab aab<Esc>',
      'nmap abcdef aabcdef<Esc>',
      'nmap abcdefghij aabcdefghi<Esc>',
      'nnoremap abcd aabcd<Esc>',
      'nnoremap abcdefg aabcdefg<Esc>',
      'nnoremap abcdefgh aabcdefgh<Esc>',
    ],
    start: ['|'],
    steps: [
      {
        // Step 0: there is no timeout because 'b' breaks ambiguity
        title: 'Can handle "abb" has "ab" recursive remap + "b"',
        keysPressed: 'abb',
        stepResult: {
          end: ['|ab'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 1: there will be timeout
        title: 'Can handle "abcd" has "abcd" non recursive remap',
        keysPressed: 'ddabcd',
        stepResult: {
          end: ['|'],
          endMode: Mode.Normal,
          endAfterTimeout: ['abc|d'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 2: there will be timeout
        title: 'Can handle "abcde" has "abcd" non recursive remap + "e"',
        keysPressed: '0abcde',
        stepResult: {
          end: ['|abcd'],
          endMode: Mode.Normal,
          endAfterTimeout: ['aabcdbc|d'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 3: No timeout because 'x' breaks ambiguity
        title: 'Can handle "abcdex" has "abcd" non recursive remap + "ex"',
        keysPressed: '0abcdex',
        stepResult: {
          end: ['aabcdabcdb|c'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 4: there will be timeout
        title: 'Can handle "abcdef" has "abcdef" recursive remap',
        keysPressed: 'ddabcdef',
        stepResult: {
          end: ['|'],
          endMode: Mode.Normal,
          endAfterTimeout: ['abcde|f'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 5: there will be timeout
        title: 'Can handle "abcdefghi" has "abcdefgh" non recursive remap + "i"',
        keysPressed: 'ddabcdefghi',
        stepResult: {
          end: ['|'],
          endMode: Mode.Normal,
          endAfterTimeout: ['abcdefg|h'],
          endModeAfterTimeout: Mode.Insert,
        },
      },
      {
        // Step 6: there will be no timeout because "x" breaks ambiguity
        title: 'Can handle "abcdefghix" has "abcdefgh" non recursive remap + "ix"',
        keysPressed: '<Esc>ddabcdefghix',
        stepResult: {
          end: ['abcdefgx|h'],
          endMode: Mode.Insert,
        },
      },
    ],
  });

  newTestWithRemaps({
    title:
      'Can handle remaps with ambiguous remaps on both types of recursiveness with longer Recursive remaps',
    remaps: [
      'nnoremap ab aab<Esc>',
      'nnoremap abcdef aabcdef<Esc>',
      'nnoremap abcdefghij aabcdefghi<Esc>',
      'nmap abcd aabcd<Esc>',
      'nmap abcdefg aabcdefg<Esc>',
      'nmap abcdefgh aabcdefgh<Esc>',
    ],
    start: ['|'],
    steps: [
      {
        // Step 0: there is no timeout because 'b' breaks ambiguity
        title: 'Can handle "abb" has "ab" recursive remap + "b"',
        keysPressed: 'abb',
        stepResult: {
          end: ['|ab'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 1: there will be timeout
        title: 'Can handle "abcd" has "abcd" non recursive remap',
        keysPressed: 'ddabcd',
        stepResult: {
          end: ['|'],
          endMode: Mode.Normal,
          endAfterTimeout: ['abc|d'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 2: there will be timeout
        title: 'Can handle "abcde" has "abcd" non recursive remap + "e"',
        keysPressed: '0abcde',
        stepResult: {
          end: ['|abcd'],
          endMode: Mode.Normal,
          endAfterTimeout: ['aabcdbc|d'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 3: No timeout because 'x' breaks ambiguity
        title: 'Can handle "abcdex" has "abcd" non recursive remap + "ex"',
        keysPressed: '0abcdex',
        stepResult: {
          end: ['aabcdabcdb|c'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 4: there will be timeout
        title: 'Can handle "abcdef" has "abcdef" recursive remap',
        keysPressed: 'ddabcdef',
        stepResult: {
          end: ['|'],
          endMode: Mode.Normal,
          endAfterTimeout: ['abcde|f'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 5: there will be timeout
        title: 'Can handle "abcdefghi" has "abcdefgh" non recursive remap + "i"',
        keysPressed: 'ddabcdefghi',
        stepResult: {
          end: ['|'],
          endMode: Mode.Normal,
          endAfterTimeout: ['abcdefg|h'],
          endModeAfterTimeout: Mode.Insert,
        },
      },
      {
        // Step 6: there will be no timeout because "x" breaks ambiguity
        title: 'Can handle "abcdefghix" has "abcdefgh" non recursive remap + "ix"',
        keysPressed: '<Esc>ddabcdefghix',
        stepResult: {
          end: ['abcdefgx|h'],
          endMode: Mode.Insert,
        },
      },
    ],
  });

  newTestWithRemaps({
    title:
      'Can handle timeout finished with a sequence of multiple potential remaps that end on a key that waits for other keys like `f`',
    remaps: {
      normalModeKeyBindings: [
        {
          before: ['l', 'f', 'f'],
          after: ['A', 'l', 'f', 'f', '<Esc>'],
        },
        {
          before: ['l', 't'],
          after: ['A', 'l', 't', '<Esc>'],
        },
      ],
    },
    start: ['hello |world'],
    steps: [
      {
        // Step 0:
        title: 'Can handle sequential potential remaps that waited for timeout',
        keysPressed: 'llf',
        stepResult: {
          end: ['hello w|orld'],
          endMode: Mode.Normal,
          endAfterTimeout: ['hello wo|rld'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 1:
        title:
          'After the previous step there is no undefined key left that messes up the next action',
        keysPressed: 'd',
        stepResult: {
          end: ['hello worl|d'],
          endMode: Mode.Normal,
        },
      },
    ],
  });

  newTestWithRemaps({
    title: 'Can handle a remapping right after a failed movement',
    remaps: ['nmap j gj'],
    start: ['|first line', 'second line'],
    steps: [
      {
        // Step 0:
        keysPressed: 'fxj',
        stepResult: {
          end: ['first line', '|second line'],
        },
      },
    ],
  });

  newTestWithRemaps({
    title: 'Remaps create an undo point only at the end of the remap handling',
    remaps: [
      'nmap <leader>$ 0f£xA$00<Esc>',
      'nmap <leader>$G <leader>$j<leader>$G',
      'nno <leader>a oThis is a Non Recursive Remap!<Esc>',
    ],
    start: ['|10£', '15£', '350£', '2£', '5£'],
    steps: [
      {
        // Step 0:
        title: 'Run remap once that executes two different steps',
        keysPressed: ' $',
        stepResult: {
          end: ['|10£', '15£', '350£', '2£', '5£'],
          endAfterTimeout: ['10$0|0', '15£', '350£', '2£', '5£'],
          endModeAfterTimeout: Mode.Normal,
        },
      },
      {
        // Step 1:
        title: 'Undo removes the $00 that was inserted and reinserts the deleted £ all at once',
        keysPressed: 'u',
        stepResult: {
          end: ['10|£', '15£', '350£', '2£', '5£'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 2:
        title: 'Calls itself until it errors',
        keysPressed: ' $G',
        stepResult: {
          end: ['10$00', '15$00', '350$00', '2$00', '|5$00'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 3:
        title: 'Undo should undo all the lines that were changed by the recursive remap',
        keysPressed: 'u',
        stepResult: {
          end: ['10|£', '15£', '350£', '2£', '5£'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 4:
        title: 'Make a non recursive remap',
        keysPressed: 'G a',
        stepResult: {
          end: ['10£', '15£', '350£', '2£', '5£', 'This is a Non Recursive Remap|!'],
          endMode: Mode.Normal,
        },
      },
      {
        // Step 5:
        title: 'Undo works on NonRecursive remaps',
        keysPressed: 'u',
        stepResult: {
          end: ['10£', '15£', '350£', '2£', '|5£'],
          endMode: Mode.Normal,
        },
      },
    ],
  });

  newTestWithRemaps({
    title:
      'Potential remap key followed by a remapped key in insert mode should insert first potential remap key and then handle the following remapped key.',
    remaps: ['imap jk <Esc>', 'imap <C-e> <C-o>A'],
    start: ['|Test'],
    steps: [
      {
        // Step 0:
        keysPressed: 'ij<C-e>',
        stepResult: {
          end: ['jTest|'],
          endMode: Mode.Insert,
        },
      },
    ],
  });

  newTestWithRemaps({
    title: `Don't confuse a '<' keystroke with a potential special key like '<C-e>'`,
    remaps: ['inoremap <C-e> <C-o>$'],
    start: ['|test'],
    steps: [
      {
        // Step 0:
        keysPressed: 'i<',
        stepResult: {
          end: ['<|test'],
          endMode: Mode.Insert,
        },
      },
    ],
  });

  newTestWithRemaps({
    title:
      'Forced stop recursive remaps that are not infinite remaps should stop without throwing error',
    remaps: {
      insertModeKeyBindings: [
        {
          before: ['i', 'i'],
          commands: ['extension.vim_escape'],
        },
      ],
    },
    start: ['|test'],
    steps: [
      {
        // Step 0:
        keysPressed: 'aii<Esc>l',
        stepResult: {
          end: ['t|est'],
          endMode: Mode.Normal,
        },
      },
    ],
  });
});
