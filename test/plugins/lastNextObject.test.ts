import { newTest } from '../testSimplifier';
import { setupWorkspace } from '../testUtils';

suite('lastNextObject plugin', () => {
  suite('lastNextObject plugin disabled', () => {
    suiteSetup(async () => {
      await setupWorkspace({
        fileExtension: '.js',
      });
    });

    // test next
    newTest({
      title: "next object - should not work as it's disabled",
      start: [
        '|a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'din(',
      end: [
        '|a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
  });
  suite('lastNextObject plugin', () => {
    suiteSetup(async () => {
      await setupWorkspace({
        config: {
          targets: {
            enable: true,
            bracketObjects: { enable: true },
            smartQuotes: {
              enable: false,
              breakThroughLines: false,
              aIncludesSurroundingSpaces: true,
            },
          },
        },
        fileExtension: '.js',
      });
    });

    // test next
    newTest({
      title: 'next object - 1',
      start: [
        '|a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'din(',
      end: [
        'a(|)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'next object - 2',
      start: [
        'a|(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'din(',
      end: [
        'a(b)c(|)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'next object - 3',
      start: [
        'a(|b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'din(',
      end: [
        'a(b)c(|)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'next object - 4',
      start: [
        'a(b|)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'din(',
      end: [
        'a(b)c(|)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'next object - 5',
      start: [
        'a(b)c|(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'din(',
      end: [
        'a(b)c(d)e', //
        'a (|) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'next object - 6',
      start: [
        'a(b)c(d)e', //
        'a |( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'din(',
      end: [
        'a(b)c(d)e', //
        'a ( b (|) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'next object - 7',
      start: [
        'a(b)c(d)e', //
        'a ( b |( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'din(',
      end: [
        'a(b)c(d)e', //
        'a ( b ( c ) d (|) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'next object - 8',
      start: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g|', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'din(',
      end: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(|)b', //
      ],
    });
    newTest({
      title: 'next object - 9',
      start: [
        'a(b)c(d)e', //
        'a ( b ( c ) d |( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'din(',
      end: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(|)b', //
      ],
    });
    newTest({
      title: 'next object - 10',
      start: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '|(a)b', //
      ],
      keysPressed: 'din(',
      end: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '|(a)b', //
      ],
    });
    newTest({
      title: 'next object - 11',
      start: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        '|a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'din(',
      end: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(|)b', //
      ],
    });
    newTest({
      title: 'next object - 12',
      start: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '|', //
        '(a)b', //
      ],
      keysPressed: 'din(',
      end: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(|)b', //
      ],
    });
    // test last
    newTest({
      title: 'last object - 1',
      start: [
        '|a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        '|a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 2',
      start: [
        'a|(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a|(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 3',
      start: [
        'a(|b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(|b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 4',
      start: [
        'a(b|)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(b|)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 5',
      start: [
        'a(b)|c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(|)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 6',
      start: [
        'a(b)c|(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(|)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 7',
      start: [
        'a(b)c(d|)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(|)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 8',
      start: [
        'a(b)c(d)|e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(b)c(|)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 9',
      start: [
        'a(b)c(d)e', //
        '|a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(b)c(|)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 10',
      start: [
        'a(b)c(d)e', //
        'a |( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(b)c(|)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 11',
      start: [
        'a(b)c(d)e', //
        'a ( b |( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(b)c(|)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 12',
      start: [
        'a(b)c(d)e', //
        'a ( b ( c ) |d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(b)c(d)e', //
        'a ( b (|) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 13',
      start: [
        'a(b)c(d)e', //
        'a ( b ( c ) d |( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(b)c(d)e', //
        'a ( b (|) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 14',
      start: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e )| f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(b)c(d)e', //
        'a ( b ( c ) d (|) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 15',
      start: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f |) g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(b)c(d)e', //
        'a ( b ( c ) d (|) f ) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 16',
      start: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) |g', //
        'a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(b)c(d)e', //
        'a (|) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 17',
      start: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        '|a', //
        '', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(b)c(d)e', //
        'a (|) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 18',
      start: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '|', //
        '(a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(b)c(d)e', //
        'a (|) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 19',
      start: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(|a)b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(b)c(d)e', //
        'a (|) g', //
        'a', //
        '', //
        '(a)b', //
      ],
    });
    newTest({
      title: 'last object - 20',
      start: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(a)|b', //
      ],
      keysPressed: 'dil(',
      end: [
        'a(b)c(d)e', //
        'a ( b ( c ) d ( e ) f ) g', //
        'a', //
        '', //
        '(|)b', //
      ],
    });
  });
});
