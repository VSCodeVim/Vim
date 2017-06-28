import * as _ from 'lodash';

export interface IEnqueuedTask {
  promise: () => Promise<void>;
  isRunning: boolean;
  queue?: string;
  highPriority?: boolean;
}

/**
 * TaskQueue
 *
 * Enqueue promises here. They will be run sequentially.
 */
class TaskQueue {
  private _taskQueue: {
    [key: string]: {
      tasks: IEnqueuedTask[];
      highPriorityCount: number;
    };
  } = {};

  private async _runTasks(queueName: string): Promise<void> {
    while (this._taskQueue[queueName].tasks.length > 0) {
      let task: IEnqueuedTask = this._taskQueue[queueName].tasks[0];

      try {
        task.isRunning = true;
        await task.promise();
        task.isRunning = false;
      } catch (e) {
        console.log(e);
        console.log(e.stack);
      } finally {
        this.removeTask(task);

        if (task.highPriority) {
          this._taskQueue[queueName].highPriorityCount--;
        }
      }
    }
  }

  public get tasks(): number {
    let result = 0;

    for (const list in this._taskQueue) {
      if (this._taskQueue.hasOwnProperty(list)) {
        result += this._taskQueue[list].tasks.length;
      }
    }

    return result;
  }

  /**
   * Removes a task from the task queue.
   *
   * (Keep in mind that if the task is already running, the semantics of
   * promises don't allow you to stop it.)
   */
  public removeTask(task: IEnqueuedTask): void {
    let queueName = task.queue || 'default';
    this._taskQueue[queueName].tasks.splice(
      _.findIndex(this._taskQueue[queueName].tasks, t => t === task),
      1
    );
  }

  /**
   * Adds a task to the task queue.
   */
  public enqueueTask(task: IEnqueuedTask): void {
    let queueName = task.queue || 'default';
    let otherTaskRunning =
      this._taskQueue[queueName] &&
      _.filter(this._taskQueue[queueName].tasks, x => x.isRunning).length > 0;

    if (this._taskQueue[queueName]) {
      if (task.highPriority) {
        // Insert task as the last high priotity task.

        const numHighPriority = this._taskQueue[queueName].highPriorityCount;

        this._taskQueue[queueName].tasks.splice(numHighPriority, 0, task);
        this._taskQueue[queueName].highPriorityCount++;
      } else {
        this._taskQueue[queueName].tasks.push(task);
      }
    } else {
      this._taskQueue[queueName] = {
        tasks: [task],
        highPriorityCount: 0,
      };
    }

    if (!otherTaskRunning) {
      this._runTasks(queueName);
    }
  }
}

export let taskQueue = new TaskQueue();
