import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

const dvorakLangmap =
  '\'q,\\,w,.e,pr,yt,fy,gu,ci,ro,lp,/[,=],aa,os,ed,uf,ig,dh,hj,tk,nl,s\\;,-\',\\;z,qx,jc,kv,xb,bn,mm,w\\,,v.,z/,[-,]=,"Q,<W,>E,PR,YT,FY,GU,CI,RO,LP,?{,+},AA,OS,ED,UF,IG,DH,HJ,TK,NL,S:,_",:Z,QX,JC,KV,XB,BN,MM,W<,V>,Z?';

suite('Langmap', () => {
  suiteSetup(async () => {
    await setupWorkspace({
      config: {
        langmap: dvorakLangmap,
      },
    });
  });
  suiteTeardown(async () => {
    await setupWorkspace({
      config: {
        langmap: '',
      },
    });
    await cleanUpWorkspace();
  });

  newTest({
    title: 'Test example binding (ee → dd)',
    start: ['lorem ispum', 'dolor |sit amet', 'consectetur adipiscing elit'],
    keysPressed: 'ee',
    end: ['lorem ispum', '|consectetur adipiscing elit'],
  });

  newTest({
    title: "Remapped keys shouldn't behave like their original mappings. (dd → hh)",
    start: ['lorem ispum', 'dolor |sit amet', 'consectetur adipiscing elit'],
    keysPressed: 'dd',
    end: ['lorem ispum', 'dolo|r sit amet', 'consectetur adipiscing elit'],
  });

  newTest({
    title: "Test macros ('aee'@a → qaeeq@a)",
    start: ['|a', 'b', 'c'],
    keysPressed: "'aee'@a",
    end: ['|c'],
  });

  newTest({
    title: "Test macro register mapping (''ee'@' → qqeeq@q)",
    start: ['|a', 'b', 'c'],
    keysPressed: "''ee'@'",
    end: ['|c'],
  });

  newTest({
    title: "Test no double macro register mapping (',ee'@, → qweeq@w)",
    start: ['|a', 'b', 'c'],
    keysPressed: "',ee'@,",
    end: ['|c'],
  });

  newTest({
    title: "Test marks (mah-a, → maj'a)",
    start: ['|a', 'b'],
    keysPressed: 'mah-a',
    end: ['|a', 'b'],
  });

  newTest({
    title: "Test mark register remapping (m'h-' → mqj'q)",
    start: ['|a', 'b'],
    keysPressed: "m'h-'",
    end: ['|a', 'b'],
  });

  newTest({
    title: "Test no double mark register remapping (m,h-, → mwj'w)",
    start: ['|a', 'b'],
    keysPressed: 'm,h-,',
    end: ['|a', 'b'],
  });

  newTest({
    title: 'Test <character> search (uu → fu)',
    start: ['|Hello, how are you?'],
    keysPressed: 'uu',
    end: ['Hello, how are yo|u?'],
  });

  newTest({
    title: 'Test <character> replacement (pp → rp)',
    start: ['|r'],
    keysPressed: 'pp',
    end: ['|p'],
  });

  newTest({
    title: 'Test no ctrl remapping (<C-v> → <C-v>)',
    start: ['one', 't|wo', 'three'],
    keysPressed: '<C-v>' + 'h' + 'e',
    end: ['one', 't|o', 'tree'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Test no insert mode remapping (cc → ic)',
    start: ['|'],
    keysPressed: 'c' + 'c',
    end: ['c|'],
    endMode: Mode.Insert,
  });
});
