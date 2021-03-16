import * as child_process from 'child_process';
import { promisify } from 'util';

export async function exec(command: string) {
  return promisify(child_process.exec)(command);
}
