import * as vscode from 'vscode';
import Queue from 'queue';
import { Logger } from './util/logger';
import { extensionVersion } from './configuration/configuration';

class TaskQueue {
  private readonly logger = Logger.get('TaskQueue');
  private readonly taskQueue = new Queue({ autostart: true, concurrency: 1 });

  constructor() {
    this.taskQueue.addListener('error', (err, task) => {
      if (err instanceof Error) {
        const reportButton = 'Report bug';
        const stack = err.stack;
        vscode.window
          .showErrorMessage(err.message, reportButton)
          .then((picked: string | undefined) => {
            if (picked === reportButton) {
              let body = `**To Reproduce**\nSteps to reproduce the behavior:\n\n1.  Go to '...'\n2.  Click on '....'\n3.  Scroll down to '....'\n4.  See error\n\n**VSCodeVim version**: ${extensionVersion}`;
              if (stack) {
                body += `\n\n<details><summary>Stack trace</summary>\n\n\`\`\`\n${stack}\n\`\`\`\n\n</details>`;
              }
              vscode.commands.executeCommand(
                'vscode.open',
                vscode.Uri.parse(
                  `https://github.com/VSCodeVim/Vim/issues/new?title=${err.message}&body=${body}`
                )
              );
            }
          });
      } else {
        this.logger.error(`Error running task due to an unknown error: ${err}.`);
      }
    });
  }

  /**
   * Adds a task to the task queue.
   */
  public enqueueTask(task: () => Promise<void>): void {
    this.taskQueue.push(task);
  }
}

export let taskQueue = new TaskQueue();
