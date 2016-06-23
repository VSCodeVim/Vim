"use strict";

import { setupWorkspace, cleanUpWorkspace } from './../../testUtils';
import { ModeHandler } from '../../../src/mode/modeHandler';
import { getTestingFunctions } from '../../testSimplifier';

suite("Motions in Normal Mode", () => {
    let modeHandler: ModeHandler = new ModeHandler();

    let {
        newTest
    } = getTestingFunctions(modeHandler);

    setup(async () => {
        await setupWorkspace();
    });

    teardown(cleanUpWorkspace);

    newTest({
      title: "Can handle %",
      start: ['|((( )))'],
      keysPressed: '%',
      end: ["((( ))|)"],
    });

    newTest({
      title: "Can handle %",
      start: ['((( ))|)'],
      keysPressed: '%',
      end: ["|((( )))"],
    });

    newTest({
      title: "Can handle %",
      start: ['|[(( ))]'],
      keysPressed: '%',
      end: ["[(( ))|]"],
    });

    newTest({
      title: "Can handle %",
      start: ['|[(( }}} ))]'],
      keysPressed: '%',
      end: ["[(( }}} ))|]"],
    });

    newTest({
      title: "Can handle %",
      start: ['|[(( }}} ))]'],
      keysPressed: '%',
      end: ["[(( }}} ))|]"],
    });

    newTest({
      title: "Can handle %",
      start: ['[(( }}} ))|]'],
      keysPressed: '%',
      end: ["|[(( }}} ))]"],
    });

    newTest({
      title: "Can handle 'ge'",
      start: ['text tex|t'],
      keysPressed: '$ge',
      end: ['tex|t text'],
    });

    newTest({
      title: "Can handle 'gg'",
      start: ['text', 'text', 'tex|t'],
      keysPressed: '$jkjgg',
      end: ['|text', 'text', 'text'],
    });

    newTest({
      title: "Retain same column when moving up/down",
      start: ['text text', 'text', 'text tex|t'],
      keysPressed: 'kk',
      end: ['text tex|t', 'text', 'text text'],
    });

    newTest({
      title: "Can handle <enter>",
      start: ['text te|xt', 'text'],
      keysPressed: '\n',
      end: ['text text', '|text']
    });

    newTest({
      title: "$ always keeps cursor on EOL",
      start: ['text text', 'text', 'text tex|t'],
      keysPressed: 'gg$jj',
      end: ['text text', 'text', 'text tex|t'],
    });

    newTest({
      title: "Can handle 'f'",
      start: ['text tex|t'],
      keysPressed: '^ft',
      end: ['tex|t text']
    });

    newTest({
      title: "Can handle 'f' twice",
      start: ['text tex|t'],
      keysPressed: '^ftft',
      end: ['text |text']
    });

    newTest({
      title: "Can handle 'F'",
      start: ['text tex|t'],
      keysPressed: '$Ft',
      end: ['text |text']
    });

    newTest({
      title: "Can handle 'F' twice",
      start: ['text tex|t'],
      keysPressed: '$FtFt',
      end: ['tex|t text']
    });

    newTest({
      title: "Can handle 't'",
      start: ['text tex|t'],
      keysPressed: '^tt',
      end: ['te|xt text']
    });

    newTest({
      title: "Can handle 't' twice",
      start: ['text tex|t'],
      keysPressed: '^tttt',
      end: ['te|xt text']
    });

    newTest({
      title: "Can handle 'T'",
      start: ['text tex|t'],
      keysPressed: '$Tt',
      end: ['text t|ext']
    });

    newTest({
      title: "Can handle 'T' twice",
      start: ['text tex|t'],
      keysPressed: '$TtTt',
      end: ['text t|ext']
    });

    newTest({
      title: "Can run a basic search",
      start: ['|one two three'],
      keysPressed: '/thr\n',
      end: ['one two |three'],
    });

    newTest({
      title: "Can run a basic search",
      start: ['|one two three'],
      keysPressed: '/thr\n',
      end: ['one two |three'],
    });

    newTest({
      title: "Can run a basic search",
      start: ['|one two two two'],
      keysPressed: '/two\nn',
      end: ['one two |two two'],
    });

    newTest({
      title: "Can run a basic search",
      start: ['one two thre|e'],
      keysPressed: '?two\n',
      end: ['one |two three'],
    });

    newTest({
      title: "Can run a basic search",
      start: ['one two two thre|e'],
      keysPressed: '?two\nn',
      end: ['one |two two three'],
    });

    newTest({
      title: "maintains column position correctly",
      start: ['|one one one', 'two', 'three'],
      keysPressed: 'lllljj',
      end: ['one one one', 'two', 'thre|e'],
    });

    newTest({
      title: "maintains column position correctly with $",
      start: ['|one one one', 'two', 'three'],
      keysPressed: '$jj',
      end: ['one one one', 'two', 'thre|e'],
    });

    newTest({
      title: "Can handle G ",
      start: ['|one', 'two', 'three'],
      keysPressed: 'G',
      end: ['one', 'two', '|three']
    });

    newTest({
      title: "Can handle G with number prefix",
      start: ['|one', 'two', 'three'],
      keysPressed: '2G',
      end: ['one', '|two', 'three']
    });

    newTest({
      title: "Can handle gg",
      start: ['one', '|two', 'three'],
      keysPressed: 'gg',
      end: ['|one', 'two', 'three']
    });

    newTest({
      title: "Can handle gg with number prefix",
      start: ['|one', 'two', 'three'],
      keysPressed: '2gg',
      end: ['one', '|two', 'three']
    });

    newTest({
      title: "Can handle dot with A",
      start: ['|one', 'two', 'three'],
      keysPressed: 'A!<esc>j.j.',
      end: ['one!', 'two!', 'three|!']
    });

    newTest({
      title: "Can handle dot with I",
      start: ['on|e', 'two', 'three'],
      keysPressed: 'I!<esc>j.j.',
      end: ['!one', '!two', '|!three']
    });

    newTest({
      title: "Can handle 0",
      start: ['blah blah bla|h'],
      keysPressed: '0',
      end: ['|blah blah blah']
    });

    newTest({
      title: "Can handle 0 as part of a repeat",
      start: ['|blah blah blah'],
      keysPressed: '10l',
      end: ['blah blah |blah']
    });

    newTest({
      title: "Can handle *",
      start: ['|blah duh blah duh blah'],
      keysPressed: '*',
      end: ['blah duh |blah duh blah']
    });

    newTest({
      title: "Can handle tricky *",
      start: ['|blah blahblah duh blah'],
      keysPressed: '*',
      end: ['blah blahblah duh |blah']
    });

    newTest({
      title: "Can handle **",
      start: ['|blah duh blah duh blah'],
      keysPressed: '**',
      end: ['blah duh blah duh |blah']
    });

    newTest({
      title: "Can handle #",
      start: ['blah duh |blah duh blah'],
      keysPressed: '#',
      end: ['|blah duh blah duh blah']
    });

    newTest({
      title: "Can handle ##",
      start: ['blah duh blah duh |blah'],
      keysPressed: '##',
      end: ['|blah duh blah duh blah']
    });

    /*
    newTest({
      title: "Can handle |",
      start: ['blah duh blah duh |blah'],
      keysPressed: '|',
      end: ['|blah duh blah duh blah']
    });

    newTest({
      title: "Can handle <number> |",
      start: ['blah duh blah duh |blah'],
      keysPressed: '3|',
      end: ['|blah duh blah duh blah']
    });
    */

});