import { configuration } from './../configuration/configuration';
import { VimState } from './../state/vimState';
import { ModeName } from './../mode/mode';

const modes = {};

modes[ModeName.Normal] = {
  '<left>': '<',
  '<right>': '>',
};

modes[ModeName.Visual] = modes[ModeName.Normal];

modes[ModeName.Insert] = {
  '<left>': '[',
  '<right>': ']',
};

const translateMovementKey = (mode: ModeName, key: string) => {
  return (modes[mode] || {})[key] || key;
};

export const shouldWrapKey = (vimState: VimState, keysPressed: string[]): boolean => {
  const key = translateMovementKey(vimState.currentMode, keysPressed[0]);
  return !!configuration.wrapKeys[key];
};
