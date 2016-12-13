import * as _ from "lodash";

export interface IEnqueuedTask {
  promise  : () => Promise<void>;
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
    [key: string]: IEnqueuedTask[]
  } = {};

  private async _runTasks(queueName: string): Promise<void> {
    while (this._taskQueue[queueName].length > 0) {
      let task: IEnqueuedTask = this._taskQueue[queueName][0];

      try {
        task.isRunning = true;
        await task.promise();
        task.isRunning = false;
      } catch (e) {
        console.log(e);
        console.log(e.stack);
      } finally {
        this.removeTask(task);
      }
    }
  }

  public get tasks(): number {
    let result = 0;

    for (const list in this._taskQueue) {
      if (this._taskQueue.hasOwnProperty(list)) {
        result += this._taskQueue[list].length;
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
    let queueName = task.queue || "default";
    this._taskQueue[queueName].splice(_.findIndex(this._taskQueue[queueName], t => t === task), 1);
  }

  /**
   * Adds a task to the task queue.
   */
  public enqueueTask(task: IEnqueuedTask): void {
    let queueName = task.queue || "default";
    let otherTaskRunning = _.filter(this._taskQueue[queueName], x => x.isRunning).length > 0;

    if (this._taskQueue[queueName]) {
      if (task.highPriority) {
        this._taskQueue[queueName].unshift(task);
      } else {
        this._taskQueue[queueName].push(task);
      }
    } else {
      this._taskQueue[queueName] = [task];
    }

    if (!otherTaskRunning) {
      this._runTasks(queueName);
    }
  }
}

export let taskQueue = new TaskQueue();