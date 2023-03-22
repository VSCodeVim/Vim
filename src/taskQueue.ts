import Queue from 'queue';
import { Logger } from './util/logger';

class TaskQueue {
  private readonly taskQueue = new Queue({ autostart: true, concurrency: 1 });

  constructor() {
    this.taskQueue.addListener('error', (err, task) => {
      // TODO: Report via telemetry API?
      Logger.error(`Error running task: ${err}`);
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
