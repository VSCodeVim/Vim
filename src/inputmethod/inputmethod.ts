import { Mode } from '../mode/mode';
import { exec } from 'child_process'

/**
 * This function executes a shell command and returns the standard output as a string.
 */
const EXEC_ON_NORMAL:number = 0x01;
const EXEC_ON_PWSH:number = 0x10;

export function executeShell(cmd: string): Promise<string> {
  return internalExecuteShell(cmd, EXEC_ON_NORMAL);
}

export function executePowerShell(cmd: string): Promise<string> {
  return internalExecuteShell(cmd, EXEC_ON_PWSH);
}

function internalExecuteShell(cmd:string, flag:number): Promise<string> {
  let opt:any = null;
  if (flag === EXEC_ON_PWSH) {
    opt = {shell:"pwsh.exe"};
  }

  return new Promise<string>((resolve, reject) => {
    try {
      exec(cmd, opt, (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve(stdout.toString());
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export class InputMethod {
  protected execute: (cmd: string) => Promise<string>;

  constructor(execute: (cmd: string) => Promise<string> = executeShell) {
    this.execute = execute;
  }

  protected static isInsertLikeMode(mode: Mode): boolean {
    return [Mode.Insert, Mode.Replace, Mode.SurroundInputMode].includes(mode);
  }
}