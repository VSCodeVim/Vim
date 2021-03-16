import * as os from 'os';

export function tmpdir(): string {
  return os.tmpdir();
}
