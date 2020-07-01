import { Logger } from './util/logger';

interface IEnqueuedTask {
  promise: () => Promise<void>;
  isRunning: boolean;
  queue: string;
  isHighPriority: boolean;
}

class TaskQueue {
  private readonly _logger = Logger.get('TaskQueue');
  private readonly _taskQueue: {
    [key: string]: {
      tasks: IEnqueuedTask[];
    };
  } = {};

  private isRunning(queueName: string): boolean {
    return this._taskQueue[queueName] && this._taskQueue[queueName].tasks.some((x) => x.isRunning);
  }

  private numHighPriority(queueName: string): number {
    if (!this._taskQueue[queueName]) {
      return 0;
    }
    return this._taskQueue[queueName].tasks.filter((x) => x.isHighPriority).length;
  }

  private async runTasks(queueName: string): Promise<void> {
    while (this._taskQueue[queueName].tasks.length > 0) {
      let task: IEnqueuedTask = this._taskQueue[queueName].tasks[0];

      try {
        task.isRunning = true;
        await task.promise();
        task.isRunning = false;
      } catch (e) {
        this._logger.error(`Error running task. ${e.message}.`);
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
    this._taskQueue[task.queue].tasks = this._taskQueue[task.queue].tasks.filter((t) => t !== task);
  }

  /**
   * Adds a task to the task queue.
   */
  public enqueueTask(
    action: () => Promise<void>,
    queueName: string = 'default',
    isHighPriority: boolean = false
  ): void {
    let task: IEnqueuedTask = {
      promise: action,
      queue: queueName,
      isHighPriority: isHighPriority,
      isRunning: false,
    };

    if (!this._taskQueue[queueName]) {
      this._taskQueue[queueName] = {
        tasks: [],
      };
    }

    if (isHighPriority) {
      // Insert task as the last high priority task.
      const numHighPriority = this.numHighPriority(queueName);
      this._taskQueue[queueName].tasks.splice(numHighPriority, 0, task);
    } else {
      this._taskQueue[queueName].tasks.push(task);
    }

    if (!this.isRunning(queueName)) {
      this.runTasks(queueName);
    }
  }
}

export let taskQueue = new TaskQueue();
