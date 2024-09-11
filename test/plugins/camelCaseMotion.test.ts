import { setupWorkspace } from './../testUtils';
import { newTest } from '../testSimplifier';

suite('camelCaseMotion plugin if not enabled', () => {
  suiteSetup(async () => {
    await setupWorkspace({ config: { camelCaseMotion: { enable: false } } });
  });

  newTest({
    title: "basic motion doesn't work",
    start: ['|camelWord'],
    keysPressed: '<leader>w',
    end: ['|camelWord'],
  });
});

suite('camelCaseMotion plugin', () => {
  suiteSetup(async () => {
    await setupWorkspace({ config: { camelCaseMotion: { enable: true } } });
  });

  suite('handles <leader>w for camelCaseText', () => {
    newTest({
      title: 'step over whitespace',
      start: ['|var testCamelVARWithNums555&&&Ops'],
      keysPressed: '<leader>w',
      end: ['var |testCamelVARWithNums555&&&Ops'],
    });

    newTest({
      title: 'step to Camel word',
      start: ['var |testCamelVARWithNums555&&&Ops'],
      keysPressed: '<leader>w',
      end: ['var test|CamelVARWithNums555&&&Ops'],
    });

    newTest({
      title: 'step to CAP word',
      start: ['var test|CamelVARWithNums555&&&Ops'],
      keysPressed: '<leader>w',
      end: ['var testCamel|VARWithNums555&&&Ops'],
    });

    newTest({
      title: 'step after CAP word',
      start: ['var testCamel|VARWithNums555&&&Ops'],
      keysPressed: '<leader>w',
      end: ['var testCamelVAR|WithNums555&&&Ops'],
    });

    newTest({
      title: 'step from middle of word to Camel word',
      start: ['var testCamelVARW|ithNums555&&&Ops'],
      keysPressed: '<leader>w',
      end: ['var testCamelVARWith|Nums555&&&Ops'],
    });

    newTest({
      title: 'step to number word',
      start: ['var testCamelVARWith|Nums555&&&Ops'],
      keysPressed: '<leader>w',
      end: ['var testCamelVARWithNums|555&&&Ops'],
    });

    newTest({
      title: 'step to operator word',
      start: ['var testCamelVARWithNums|555&&&Ops'],
      keysPressed: '<leader>w',
      end: ['var testCamelVARWithNums555|&&&Ops'],
    });

    newTest({
      title: 'step from inside operator word',
      start: ['var testCamelVARWithNums555&|&&Ops'],
      keysPressed: '<leader>w',
      end: ['var testCamelVARWithNums555&&&|Ops'],
    });

    newTest({
      title: 'step to operator and then over',
      start: ['|camel.camelWord'],
      keysPressed: '2<leader>w',
      end: ['camel.|camelWord'],
    });
  });

  suite('handles <leader>w for underscore_var', () => {
    newTest({
      title: 'step to _word',
      start: ['|some_var and_other23_var'],
      keysPressed: '<leader>w',
      end: ['some_|var and_other23_var'],
    });

    newTest({
      title: 'step over whitespace to word',
      start: ['some|_var and_other23_var'],
      keysPressed: '<leader>w',
      end: ['some_|var and_other23_var'],
    });

    newTest({
      title: 'step from inside word to word',
      start: ['some_var a|nd_other23_var'],
      keysPressed: '<leader>w',
      end: ['some_var and_|other23_var'],
    });

    newTest({
      title: 'step form _word to number',
      start: ['some_var and_|other23_var'],
      keysPressed: '<leader>w',
      end: ['some_var and_other|23_var'],
    });

    newTest({
      title: 'step from number word to word',
      start: ['some_var and_other2|3_var'],
      keysPressed: '<leader>w',
      end: ['some_var and_other23_|var'],
    });

    newTest({
      title: 'step from in whitespace to word',
      start: ['variable  |  more_vars'],
      keysPressed: '<leader>w',
      end: ['variable    |more_vars'],
    });

    newTest({
      title: 'step in ALL_CAPS_WORD',
      start: ['A|LL_CAPS_WORD'],
      keysPressed: '2<leader>w',
      end: ['ALL_CAPS_|WORD'],
    });
  });

  suite('handles d<leader>w', () => {
    newTest({
      title: 'delete from start of camelWord',
      start: ['|camelTwoWord'],
      keysPressed: 'd<leader>w',
      end: ['|TwoWord'],
    });

    newTest({
      title: 'delete from middle of camelWord',
      start: ['ca|melTwoWord'],
      keysPressed: 'd<leader>w',
      end: ['ca|TwoWord'],
    });

    newTest({
      title: 'delete from start of CamelWord',
      start: ['camel|TwoWord'],
      keysPressed: 'd<leader>w',
      end: ['camel|Word'],
    });

    newTest({
      title: 'delete two words from camelWord',
      start: ['ca|melTwoWord'],
      keysPressed: '2d<leader>w',
      end: ['ca|Word'],
    });

    newTest({
      title: 'delete from start of underscore_word',
      start: ['|camel_two_word'],
      keysPressed: 'd<leader>w',
      end: ['|two_word'],
    });

    newTest({
      title: 'delete from middle of underscore_word',
      start: ['ca|mel_two_word'],
      keysPressed: 'd<leader>w',
      end: ['ca|two_word'],
    });

    newTest({
      title: 'delete two words from camel_word',
      start: ['ca|mel_two_word'],
      keysPressed: '2d<leader>w',
      end: ['ca|word'],
    });
  });

  suite('handles di<leader>w', () => {
    newTest({
      title: 'delete from start of camelWord',
      start: ['|camelTwoWord'],
      keysPressed: 'di<leader>w',
      end: ['|TwoWord'],
    });

    newTest({
      title: 'delete from middle of camelWord',
      start: ['ca|melTwoWord'],
      keysPressed: 'di<leader>w',
      end: ['|TwoWord'],
    });

    newTest({
      title: 'delete from start of CamelWord',
      start: ['camel|TwoWord'],
      keysPressed: 'di<leader>w',
      end: ['camel|Word'],
    });

    newTest({
      title: 'delete two words from camelWord',
      start: ['ca|melTwoWord'],
      keysPressed: '2di<leader>w',
      end: ['|Word'],
    });

    newTest({
      title: 'delete from start of underscore_word',
      start: ['|camel_two_word'],
      keysPressed: 'di<leader>w',
      end: ['|_two_word'],
    });

    newTest({
      title: 'delete from middle of underscore_word',
      start: ['ca|mel_two_word'],
      keysPressed: 'di<leader>w',
      end: ['|_two_word'],
    });

    newTest({
      title: 'delete two words from camel_word',
      start: ['ca|mel_two_word'],
      keysPressed: '2di<leader>w',
      end: ['|_word'],
    });
  });

  suite('handles <leader>b', () => {
    newTest({
      title: 'back from middle of word',
      start: ['camel.camelWord oth|er'],
      keysPressed: '<leader>b',
      end: ['camel.camelWord |other'],
    });

    newTest({
      title: 'back over whitespace to camelWord',
      start: ['camel.camelWord |other'],
      keysPressed: '<leader>b',
      end: ['camel.camel|Word other'],
    });

    newTest({
      title: 'back twice over operator',
      start: ['camel.camel|Word other'],
      keysPressed: '2<leader>b',
      end: ['camel|.camelWord other'],
    });
  });

  suite('handles <leader>e', () => {
    newTest({
      title: 'from start to middle of underscore_word',
      start: ['|foo_bar && camelCase'],
      keysPressed: '<leader>e',
      end: ['fo|o_bar && camelCase'],
    });

    newTest({
      title: 'from middle to end of underscore_word',
      start: ['fo|o_bar && camelCase'],
      keysPressed: '<leader>e',
      end: ['foo_ba|r && camelCase'],
    });

    newTest({
      title: 'twice to end of word over operator',
      start: ['foo_ba|r && camelCase'],
      keysPressed: '2<leader>e',
      end: ['foo_bar && came|lCase'],
    });
  });
});
