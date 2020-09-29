import { readFileAsync, writeFileAsync, unlink } from 'platform/fs';
import { tmpdir } from '../util/os';
import { join } from '../util/path';
import { VimError, ErrorCode } from '../error';
import { promisify } from 'util';

class ExternalCommand {
  private previousExternalCommand: string | undefined;

  private getRandomFileName(): string {
    return Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substr(0, 10);
  }

  /**
   * Expands the given command by replacing any '!' with the previous external
   * command. The '!' can be escaped if there is a backslash preceeding the
   * '!', then the backslash is removed and the '!' is kept.
   *
   * If a '!' is present but there is no previous external command, then a
   * VimError is thrown.
   * @param command the command to expand
   */
  private expandCommand(command: string): string {
    let result: string[] = [];

    for (let i = 0; i < command.length; i++) {
      if (command[i] === '!') {
        if (i > 0 && command[i - 1] === '\\') {
          // escape the '!' and keep it
          result.pop();
          result.push('!');
        } else if (!this.previousExternalCommand) {
          // no previous command available to substitute
          throw VimError.fromCode(ErrorCode.NoPreviousCommand);
        } else {
          result.push(this.previousExternalCommand);
        }
      } else {
        result.push(command[i]);
      }
    }
    return result.join('');
  }

  /**
   * Creates a shell command from a command string, and redirects stdin and
   * stdout/stderr to the given input/output files.
   *
   * @param command the command to redirect
   * @param inputFile path to the input file
   * @param outputFile path to the output file
   */
  private redirectCommand(command: string, inputFile: string, outputFile: string): string {
    let result: string;
    if (process.platform === 'win32') {
      // need to put the '<' redirection after the first command in the pipe
      const pipeIndex = command.indexOf('|');

      if (pipeIndex !== -1) {
        const firstCommand = command.slice(0, pipeIndex);
        const restOfCommand = command.slice(pipeIndex);
        result = `${firstCommand} < ${inputFile} ${restOfCommand} > ${outputFile}`;
      } else {
        result = `${command} < ${inputFile} > ${outputFile}`;
      }
    } else if (process.env.SHELL === 'fish') {
      result = `begin; ${command}; end < ${inputFile} > ${outputFile}`;
    } else {
      result = `(${command}) < ${inputFile} > ${outputFile}`;
    }

    // combines stdout and stderr (compatible for all platforms)
    result += ' 2>&1';
    return result;
  }

  /**
   * Runs the given command and returns the output (stdout and stderr).
   * Optionally, `stdin` can be piped into stdin during execution.
   *
   * @param command the command to run
   * @param stdin string to pipe into stdin, by default the empty string
   */
  public async run(command: string, stdin: string = ''): Promise<string> {
    const inputFile = join(tmpdir(), this.getRandomFileName());
    const outputFile = join(tmpdir(), this.getRandomFileName());
    let result = '';

    try {
      await writeFileAsync(inputFile, stdin, 'utf8');

      command = this.expandCommand(command);
      this.previousExternalCommand = command;
      command = this.redirectCommand(command, inputFile, outputFile);
      try {
        await import('child_process').then((cp) => {
          return promisify(cp.exec)(command);
        });
      } catch (e) {
        // exec throws an error if exit code != 0
        // keep going and read the output anyway (just like vim)
      }

      result = await readFileAsync(outputFile, 'utf8');
      // vim behavior: always trim newlines
      if (result.endsWith('\n')) {
        result = result.slice(0, -1);
      }
    } finally {
      // always delete tmp files at the end
      await unlink(inputFile);
      await unlink(outputFile);
    }

    return result;
  }
}

export const externalCommand = new ExternalCommand();
