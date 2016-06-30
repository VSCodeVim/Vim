import * as _ from "lodash";

export interface IEnqueuedTask {
    promise  : () => Promise<void>;
    isRunning: boolean;
}

export class TaskQueue {
    private _tasks: IEnqueuedTask[] = [];

    private async _runTasks(): Promise<void> {
        while (this._tasks.length > 0) {
            let task: IEnqueuedTask = this._tasks[0];

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
        this._tasks.splice(_.findIndex(this._tasks, t => t === task), 1);
    }

    /**
     * Adds a task to the task queue.
     */
    public enqueueTask(task: IEnqueuedTask): void {
        let otherTaskRunning = _.filter(this._tasks, x => x.isRunning).length > 0;

        this._tasks.push(task);

        if (!otherTaskRunning) {
            this._runTasks();
        }
    }
}
