import * as assert from 'assert';

import { ErrorCode, ErrorMessage } from '../src/error';

suite('Error', () => {
  test('error code has message', () => {
    /* tslint:disable:forin */
    for (const errorCodeString in ErrorCode) {
      var errorCode = Number(errorCodeString);
      if (!isNaN(errorCode)) {
        assert.notEqual(ErrorMessage[errorCode], undefined, errorCodeString);
      }
    }
  });
});
