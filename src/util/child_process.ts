import * as child_process from 'child_process';
import { promisify } from 'util';

export function exec(
  command: string,
  options?: child_process.ExecOptions,
): child_process.PromiseWithChild<{ stdout: string | Buffer; stderr: string | Buffer }> {
  return promisify(child_process.exec)(command, options);
}
