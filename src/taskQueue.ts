import * as vscode from 'vscode';
import { Logger } from './util/logger';
import { extensionVersion } from './configuration/configuration';

interface IEnqueuedTask {
  promise: () => Promise<void>;
  isRunning: boolean;
  queue: string;
  isHighPriority: boolean;
}

class TaskQueue {
  private readonly logger = Logger.get('TaskQueue');
  private readonly taskQueue: {
    [key: string]: {
      tasks: IEnqueuedTask[];
    };
  } = {};

  private isRunning(queueName: string): boolean {
    return this.taskQueue[queueName] && this.taskQueue[queueName].tasks.some((x) => x.isRunning);
  }

  private numHighPriority(queueName: string): number {
    if (!this.taskQueue[queueName]) {
      return 0;
    }
    return this.taskQueue[queueName].tasks.filter((x) => x.isHighPriority).length;
  }

  private async runTasks(queueName: string): Promise<void> {
    while (this.taskQueue[queueName].tasks.length > 0) {
      const task: IEnqueuedTask = this.taskQueue[queueName].tasks[0];

      try {
        task.isRunning = true;
        await task.promise();
        task.isRunning = false;
      } catch (e) {
        if (e instanceof Error) {
          const reportButton = 'Report bug';
          const stack = e.stack;
          vscode.window
            .showErrorMessage(e.message, reportButton)
            .then((picked: string | undefined) => {
              if (picked === reportButton) {
                let body = `**To Reproduce**\nSteps to reproduce the behavior:\n\n1.  Go to '...'\n2.  Click on '....'\n3.  Scroll down to '....'\n4.  See error\n\n**VSCodeVim version**: ${extensionVersion}`;
                if (stack) {
                  body += `\n\n<details><summary>Stack trace</summary>\n\n\`\`\`\n${stack}\n\`\`\`\n\n</details>`;
                }
                vscode.commands.executeCommand(
                  'vscode.open',
                  vscode.Uri.parse(
                    `https://github.com/VSCodeVim/Vim/issues/new?title=${e.message}&body=${body}`
                  )
                );
              }
            });
        } else {
          this.logger.error(`Error running task due to an unknown error: ${e}.`);
        }
      } finally {
        this.dequeueTask(task);
      }
    }
  }

  /**
   * Dequeues a task from the task queue.
   *
   * Note: If the task is already running, the semantics of
   *       promises don't allow you to stop it.
   */
  private dequeueTask(task: IEnqueuedTask): void {
    this.taskQueue[task.queue].tasks = this.taskQueue[task.queue].tasks.filter((t) => t !== task);
  }

  /**
   * Adds a task to the task queue.
   */
  public enqueueTask(
    action: () => Promise<void>,
    queueName: string = 'default',
    isHighPriority: boolean = false
  ): void {
    const task: IEnqueuedTask = {
      promise: action,
      queue: queueName,
      isHighPriority,
      isRunning: false,
    };

    if (!this.taskQueue[queueName]) {
      this.taskQueue[queueName] = {
        tasks: [],
      };
    }

    if (isHighPriority) {
      // Insert task as the last high priority task.
      const numHighPriority = this.numHighPriority(queueName);
      this.taskQueue[queueName].tasks.splice(numHighPriority, 0, task);
    } else {
      this.taskQueue[queueName].tasks.push(task);
    }

    if (!this.isRunning(queueName)) {
      this.runTasks(queueName);
    }
  }
}

export let taskQueue = new TaskQueue();
