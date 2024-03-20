import * as assert from 'assert';

import { ErrorCode, ErrorMessage } from '../src/error';

suite('Error', () => {
  test('error code has message', () => {
    // eslint-disable-next-line guard-for-in
    for (const errorCodeString in ErrorCode) {
      const errorCode = Number(errorCodeString);
      if (!isNaN(errorCode)) {
        assert.notStrictEqual(ErrorMessage[errorCode], undefined, errorCodeString);
      }
    }
  });
});
