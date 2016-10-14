import * as _ from "lodash";

export interface IEnqueuedTask {
  promise  : () => Promise<void>;
  isRunning: boolean;
  queue?: string;
}

/**
 * TaskQueue
 *
 * Enqueue promises here. They will be run sequentially.
 */
class TaskQueue {
  private _tasksQueue: {
    [key: string]: IEnqueuedTask[]
  } = {};

  private async _runTasks(queueName: string): Promise<void> {
    while (this._tasksQueue[queueName].length > 0) {
      let task: IEnqueuedTask = this._tasksQueue[queueName][0];

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

  /**
   * Removes a task from the task queue.
   *
   * (Keep in mind that if the task is already running, the semantics of
   * promises don't allow you to stop it.)
   */
  public removeTask(task: IEnqueuedTask): void {
    let queueName = task.queue || "default";
    this._tasksQueue[queueName].splice(_.findIndex(this._tasksQueue[queueName], t => t === task), 1);
  }

  /**
   * Adds a task to the task queue.
   */
  public enqueueTask(task: IEnqueuedTask): void {
    let queueName = task.queue || "default";
    let otherTaskRunning = _.filter(this._tasksQueue[queueName], x => x.isRunning).length > 0;

    if (this._tasksQueue[queueName]) {
      this._tasksQueue[queueName].push(task);
    } else {
      this._tasksQueue[queueName] = [];
    }

    if (!otherTaskRunning) {
      this._runTasks(queueName);
    }
  }
}

export let taskQueue = new TaskQueue();