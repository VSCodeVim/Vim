import {
  buildTriggerKeys,
  EasymotionTrigger,
} from '../../src/actions/plugins/easymotion/easymotion.cmd';
import { Configuration } from '../testConfiguration';
import { newTest } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './../testUtils';

function easymotionCommand(trigger: EasymotionTrigger, searchWord: string, jumpKey: string) {
  return [...buildTriggerKeys(trigger), searchWord, jumpKey].join('');
}

suite('easymotion plugin', () => {
  setup(async () => {
    const configuration = new Configuration();
    configuration.easymotion = true;

    await setupWorkspace(configuration);
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: 'Can handle s move',
    start: ['a|bcdabcd'],
    keysPressed: easymotionCommand({ key: 's' }, 'a', 'k'),
    end: ['|abcdabcd'],
  });

  newTest({
    title: 'Can handle 2s move',
    start: ['ab|cdabcd'],
    keysPressed: easymotionCommand({ key: '2s' }, 'ab', 'k'),
    end: ['|abcdabcd'],
  });

  newTest({
    title: 'Can handle f move',
    start: ['a|bcdabcdabcd'],
    keysPressed: easymotionCommand({ key: 'f' }, 'a', 'k'),
    end: ['abcdabcd|abcd'],
  });

  newTest({
    title: 'Can handle 2f move',
    start: ['a|bcdabcdabcd'],
    keysPressed: easymotionCommand({ key: '2f' }, 'ab', 'k'),
    end: ['abcdabcd|abcd'],
  });

  newTest({
    title: 'Can handle F move',
    start: ['abcdabc|dabcd'],
    keysPressed: easymotionCommand({ key: 'F' }, 'a', 'k'),
    end: ['|abcdabcdabcd'],
  });

  newTest({
    title: 'Can handle 2F move',
    start: ['abcdabc|dabcd'],
    keysPressed: easymotionCommand({ key: '2F' }, 'ab', 'k'),
    end: ['|abcdabcdabcd'],
  });

  newTest({
    title: 'Can handle t move',
    start: ['abcd|abcdabcd'],
    keysPressed: easymotionCommand({ key: 't' }, 'c', 'k'),
    end: ['abcdabcda|bcd'],
  });

  newTest({
    title: 'Can handle bd-t move',
    start: ['abcd|abcdabcd'],
    keysPressed: easymotionCommand({ key: 'bdt', leaderCount: 3 }, 'c', 'k'),
    end: ['a|bcdabcdabcd'],
  });

  newTest({
    title: 'Can handle 2t move',
    start: ['abcd|abcdabcd'],
    keysPressed: easymotionCommand({ key: '2t' }, 'cd', 'k'),
    end: ['abcdabcda|bcd'],
  });

  newTest({
    title: 'Can handle bd-t2 move',
    start: ['abcd|abcdabcd'],
    keysPressed: easymotionCommand({ key: 'bd2t', leaderCount: 3 }, 'cd', 'k'),
    end: ['a|bcdabcdabcd'],
  });

  newTest({
    title: 'Can handle T move',
    start: ['abcdab|cdabcd'],
    keysPressed: easymotionCommand({ key: 'T' }, 'a', 'k'),
    end: ['a|bcdabcdabcd'],
  });

  newTest({
    title: 'Can handle 2T move',
    start: ['abcdabc|dabcd'],
    keysPressed: easymotionCommand({ key: '2T' }, 'ab', 'k'),
    end: ['ab|cdabcdabcd'],
  });

  newTest({
    title: 'Can handle w move',
    start: ['abc |def ghi jkl'],
    keysPressed: easymotionCommand({ key: 'w' }, '', 'k'),
    end: ['abc def ghi |jkl'],
  });

  newTest({
    title: 'Can handle bd-w move',
    start: ['abc |def ghi jkl'],
    keysPressed: easymotionCommand({ key: 'bdw', leaderCount: 3 }, '', 'k'),
    end: ['|abc def ghi jkl'],
  });

  newTest({
    title: 'Can handle b move',
    start: ['abc def |ghi jkl'],
    keysPressed: easymotionCommand({ key: 'b' }, '', 'k'),
    end: ['|abc def ghi jkl'],
  });

  newTest({
    title: 'Can handle e move',
    start: ['abc |def ghi jkl'],
    keysPressed: easymotionCommand({ key: 'e' }, '', 'k'),
    end: ['abc def ghi jk|l'],
  });

  newTest({
    title: 'Can handle bd-e move',
    start: ['abc |def ghi jkl'],
    keysPressed: easymotionCommand({ key: 'bde', leaderCount: 3 }, '', 'k'),
    end: ['ab|c def ghi jkl'],
  });

  newTest({
    title: 'Can handle ge move',
    start: ['abc def |ghi jkl'],
    keysPressed: easymotionCommand({ key: 'ge' }, '', 'k'),
    end: ['ab|c def ghi jkl'],
  });

  newTest({
    title: 'Can handle n-char move',
    start: ['abc |def ghi jkl', 'abc def ghi jkl'],
    keysPressed: easymotionCommand({ key: '/' }, 'ghi\n', 'k'),
    end: ['abc def ghi jkl', 'abc def |ghi jkl'],
  });

  newTest({
    title: 'Can handle j move',
    start: ['abc', 'd|ef', 'ghi', 'jkl'],
    keysPressed: easymotionCommand({ key: 'j' }, '', 'k'),
    end: ['abc', 'def', 'ghi', '|jkl'],
  });

  newTest({
    title: 'Can handle k move',
    start: ['abc', 'def', 'g|hi', 'jkl'],
    keysPressed: easymotionCommand({ key: 'k' }, '', 'k'),
    end: ['abc', '|def', 'ghi', 'jkl'],
  });

  newTest({
    title: 'Can handle bd-jk move (1)',
    start: ['abc', 'def', '|ghi', 'jkl'],
    keysPressed: easymotionCommand({ key: 'bdjk', leaderCount: 3 }, '', 'k'),
    end: ['abc', '|def', 'ghi', 'jkl'],
  });

  newTest({
    title: 'Can handle bd-jk move (2)',
    start: ['abc', 'def', '|ghi', 'jkl'],
    keysPressed: easymotionCommand({ key: 'bdjk', leaderCount: 3 }, '', 'h'),
    end: ['abc', 'def', 'ghi', '|jkl'],
  });

  newTest({
    title: 'Can handle lineforward move (1)',
    start: ['|abcDefGhi'],
    keysPressed: easymotionCommand({ key: 'l', leaderCount: 2 }, '', 'h'),
    end: ['abc|DefGhi'],
  });

  newTest({
    title: 'Can handle lineforward move (2)',
    start: ['|abcDefGhi'],
    keysPressed: easymotionCommand({ key: 'l', leaderCount: 2 }, '', 'k'),
    end: ['abcDef|Ghi'],
  });

  newTest({
    title: 'Can handle linebackward move (1)',
    start: ['abcDefGh|i'],
    keysPressed: easymotionCommand({ key: 'h', leaderCount: 2 }, '', 'k'),
    end: ['abc|DefGhi'],
  });

  newTest({
    title: 'Can handle linebackward move (2)',
    start: ['abcDefGh|i'],
    keysPressed: easymotionCommand({ key: 'h', leaderCount: 2 }, '', 'h'),
    end: ['abcDef|Ghi'],
  });

  newTest({
    title: 'Can handle searching for backslash (\\)',
    start: ['|https:\\\\www.google.com'],
    keysPressed: easymotionCommand({ key: 'f' }, '\\', 'k'),
    end: ['https:\\|\\www.google.com'],
  });

  newTest({
    title: 'Can handle searching for carat (^)',
    start: ['|<^_^>'],
    keysPressed: easymotionCommand({ key: 'f' }, '^', 'h'),
    end: ['<|^_^>'],
  });

  newTest({
    title: 'Can handle searching for dot (.)',
    start: ['|https:\\\\www.google.com'],
    keysPressed: easymotionCommand({ key: 'f' }, '.', 'k'),
    end: ['https:\\\\www.google|.com'],
  });
});

suite('easymotion plugin Chinese Phonetic mode', () => {
  setup(async () => {
    const configuration = new Configuration();
    configuration.easymotion = true;
    configuration.easymotionChinesePhonetic = {};
    await setupWorkspace(configuration);
  });

  teardown(cleanUpWorkspace);

  // Chinese Phonetic test
  newTest({
    title: 'Can handle s move',
    start: ['爱|不错的爱不错的'],
    keysPressed: easymotionCommand({ key: 's' }, 'a', 'k'),
    end: ['|爱不错的爱不错的'],
  });

  newTest({
    title: 'Can handle 2s move',
    start: ['爱不|错的爱不错的'],
    keysPressed: easymotionCommand({ key: '2s' }, 'ab', 'k'),
    end: ['|爱不错的爱不错的'],
  });

  newTest({
    title: 'Can handle f move',
    start: ['爱|不错的爱不错的爱不错的'],
    keysPressed: easymotionCommand({ key: 'f' }, 'a', 'k'),
    end: ['爱不错的爱不错的|爱不错的'],
  });

  newTest({
    title: 'Can handle 2f move',
    start: ['爱|不错的爱不错的爱不错的'],
    keysPressed: easymotionCommand({ key: '2f' }, 'ab', 'k'),
    end: ['爱不错的爱不错的|爱不错的'],
  });

  newTest({
    title: 'Can handle F move',
    start: ['爱不错的爱不错|的爱不错的'],
    keysPressed: easymotionCommand({ key: 'F' }, 'a', 'k'),
    end: ['|爱不错的爱不错的爱不错的'],
  });

  newTest({
    title: 'Can handle 2F move',
    start: ['爱不错的爱不错|的爱不错的'],
    keysPressed: easymotionCommand({ key: '2F' }, 'ab', 'k'),
    end: ['|爱不错的爱不错的爱不错的'],
  });

  newTest({
    title: 'Can handle t move',
    start: ['爱不错的|爱不错的爱不错的'],
    keysPressed: easymotionCommand({ key: 't' }, 'c', 'k'),
    end: ['爱不错的爱不错的爱|不错的'],
  });

  newTest({
    title: 'Can handle bd-t move',
    start: ['爱不错的|爱不错的爱不错的'],
    keysPressed: easymotionCommand({ key: 'bdt', leaderCount: 3 }, 'c', 'k'),
    end: ['爱|不错的爱不错的爱不错的'],
  });

  newTest({
    title: 'Can handle 2t move',
    start: ['爱不错的|爱不错的爱不错的'],
    keysPressed: easymotionCommand({ key: '2t' }, 'cd', 'k'),
    end: ['爱不错的爱不错的爱|不错的'],
  });

  newTest({
    title: 'Can handle bd-t2 move',
    start: ['爱不错的|爱不错的爱不错的'],
    keysPressed: easymotionCommand({ key: 'bd2t', leaderCount: 3 }, 'cd', 'k'),
    end: ['爱|不错的爱不错的爱不错的'],
  });

  newTest({
    title: 'Can handle T move',
    start: ['爱不错的爱不|错的爱不错的'],
    keysPressed: easymotionCommand({ key: 'T' }, 'a', 'k'),
    end: ['爱|不错的爱不错的爱不错的'],
  });

  newTest({
    title: 'Can handle 2T move',
    start: ['爱不错的爱不错|的爱不错的'],
    keysPressed: easymotionCommand({ key: '2T' }, 'ab', 'k'),
    end: ['爱不|错的爱不错的爱不错的'],
  });

  newTest({
    title: 'Can handle n-char move',
    start: ['爱不错 |第二份 规划局 看了吗', '爱不错 第二份 规划局 看了吗'],
    keysPressed: easymotionCommand({ key: '/' }, 'ghj\n', 'k'),
    end: ['爱不错 第二份 规划局 看了吗', '爱不错 第二份 |规划局 看了吗'],
  });

  newTest({
    title: 'Can handle searching for (、)',
    start: ['|爱不错第二份：、、\\\\规划局看了吗'],
    keysPressed: easymotionCommand({ key: 'f' }, '\\', 'k'),
    end: ['爱不错第二份：、|、\\\\规划局看了吗'],
  });

  newTest({
    title: 'Can handle searching for (￥)',
    start: ['|<￥_￥><$_$>'],
    keysPressed: easymotionCommand({ key: 'f' }, '$', 'h'),
    end: ['<|￥_￥><$_$>'],
  });

  newTest({
    title: 'Can handle searching for (。)',
    start: ['|一句话说完。第二句话就来。第三句话。是不是'],
    keysPressed: easymotionCommand({ key: 'f' }, '.', 'k'),
    end: ['一句话说完。第二句话就来|。第三句话。是不是'],
  });

  newTest({
    title: 'Can handle searching for (×)',
    start: ['|。。×。×。。'],
    keysPressed: easymotionCommand({ key: 'f' }, '*', 'k'),
    end: ['。。×。|×。。'],
  });

  newTest({
    title: 'Can handle searching for (“”)',
    start: ['|噗噗噗“”噗噗噗“”噗噗噗'],
    keysPressed: easymotionCommand({ key: 'f' }, '"', 'k'),
    end: ['噗噗噗“|”噗噗噗“”噗噗噗'],
  });

  newTest({
    title: 'Can handle searching for (『』)',
    start: ['|噗噗噗『』噗噗噗『』噗噗噗'],
    keysPressed: easymotionCommand({ key: 'f' }, '"', 'k'),
    end: ['噗噗噗『|』噗噗噗『』噗噗噗'],
  });

  newTest({
    title: 'Can handle searching for (‘’)',
    start: ['|噗噗噗‘’噗噗噗‘’噗噗噗'],
    keysPressed: easymotionCommand({ key: 'f' }, "'", 'k'),
    end: ['噗噗噗‘|’噗噗噗‘’噗噗噗'],
  });

  newTest({
    title: 'Can handle searching for (「」)',
    start: ['|噗噗噗「」噗噗噗「」噗噗噗'],
    keysPressed: easymotionCommand({ key: 'f' }, "'", 'k'),
    end: ['噗噗噗「|」噗噗噗「」噗噗噗'],
  });

  newTest({
    title: 'Can handle searching for (～)',
    start: ['|噗噗噗～～噗噗噗～～噗噗噗'],
    keysPressed: easymotionCommand({ key: 'f' }, '~', 'k'),
    end: ['噗噗噗～|～噗噗噗～～噗噗噗'],
  });

  newTest({
    title: 'Can handle searching for (》)',
    start: ['|噗噗噗》》噗噗噗》》噗噗噗'],
    keysPressed: easymotionCommand({ key: 'f' }, '>', 'k'),
    end: ['噗噗噗》|》噗噗噗》》噗噗噗'],
  });

  newTest({
    title: 'Can handle searching for (《)',
    start: ['|噗噗噗《《噗噗噗《《噗噗噗'],
    keysPressed: easymotionCommand({ key: 'f' }, '<', 'k'),
    end: ['噗噗噗《|《噗噗噗《《噗噗噗'],
  });

  newTest({
    title: 'Can handle searching for (）)',
    start: ['|噗噗噗））噗噗噗））噗噗噗'],
    keysPressed: easymotionCommand({ key: 'f' }, ')', 'k'),
    end: ['噗噗噗）|）噗噗噗））噗噗噗'],
  });

  newTest({
    title: 'Can handle searching for (（)',
    start: ['|噗噗噗（（噗噗噗（（噗噗噗'],
    keysPressed: easymotionCommand({ key: 'f' }, '(', 'k'),
    end: ['噗噗噗（|（噗噗噗（（噗噗噗'],
  });

  newTest({
    title: 'Can handle searching for (；)',
    start: ['|噗噗噗；；噗噗噗；；噗噗噗'],
    keysPressed: easymotionCommand({ key: 'f' }, ';', 'k'),
    end: ['噗噗噗；|；噗噗噗；；噗噗噗'],
  });

  newTest({
    title: 'Can handle searching for (！)',
    start: ['|噗噗噗！！噗噗噗！！噗噗噗'],
    keysPressed: easymotionCommand({ key: 'f' }, '!', 'k'),
    end: ['噗噗噗！|！噗噗噗！！噗噗噗'],
  });

  newTest({
    title: 'Can handle searching for (：)',
    start: ['|噗噗噗：：噗噗噗：：噗噗噗'],
    keysPressed: easymotionCommand({ key: 'f' }, ':', 'k'),
    end: ['噗噗噗：|：噗噗噗：：噗噗噗'],
  });

  newTest({
    title: 'Can handle searching for (？)',
    start: ['|噗噗噗？？噗噗噗？？噗噗噗'],
    keysPressed: easymotionCommand({ key: 'f' }, '?', 'k'),
    end: ['噗噗噗？|？噗噗噗？？噗噗噗'],
  });

  newTest({
    title: 'Can handle searching for (，)',
    start: ['|噗噗噗，，噗噗噗，，噗噗噗'],
    keysPressed: easymotionCommand({ key: 'f' }, ',', 'k'),
    end: ['噗噗噗，|，噗噗噗，，噗噗噗'],
  });
});
