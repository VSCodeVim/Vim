import { configuration } from './../configuration/configuration';
import { Mode } from './../mode/mode';

/**
 * See https://vimhelp.org/options.txt.html#%27whichwrap%27
 *
 * @returns true if the given key should cause the cursor to wrap around line boundary
 */
export const shouldWrapKey = (mode: Mode, key: string): boolean => {
  let k: string;
  if (key === '<left>') {
    k = [Mode.Insert, Mode.Replace].includes(mode) ? '[' : '<';
  } else if (key === '<right>') {
    k = [Mode.Insert, Mode.Replace].includes(mode) ? ']' : '>';
  } else if (['<BS>', '<C-BS>', '<S-BS>'].includes(key)) {
    k = 'b';
  } else if (key === ' ') {
    k = 's';
  } else if (['h', 'l', '~'].includes(key)) {
    k = key;
  } else {
    throw new Error(`shouldWrapKey called with unexpected key='${key}'`);
  }
  return configuration.whichwrap.split(',').includes(k);
};
