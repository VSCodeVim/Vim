//
// PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING
//
// This file is providing the test runner to use when running extension tests.
// By default the test runner in use is Mocha based.
//
// You can provide your own test runner if you want to override it by exporting
// a function run(testRoot: string, clb: (error:Error) => void) that the extension
// host can call to run the tests. The test runner is expected to use console.log
// to report the results back to the caller. When the tests are finished, return
// a possible error to the callback or null if none.
import glob from 'glob';
import Mocha from 'mocha';
import * as path from 'path';

import { Globals } from '../src/globals';
import { Configuration } from './testConfiguration';

Globals.isTesting = true;
Globals.mockConfiguration = new Configuration();

export function run(): Promise<void> {
  const mochaGrep = new RegExp(process.env.MOCHA_GREP || '');

  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 10000,
    grep: mochaGrep,
  });

  const testsRoot = path.resolve(__dirname, '.');

  return new Promise((c, e) => {
    glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
      if (err) {
        return e(err);
      }

      // Add files to the test suite
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`));
          } else {
            c();
          }
        });
      } catch (error) {
        console.error(error);
        e(error as Error);
      }
    });
  });
}
