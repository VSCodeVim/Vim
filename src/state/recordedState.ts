import { configuration } from '../configuration/configuration';
import { Mode } from '../mode/mode';
import { BaseAction } from './../actions/base';
import { BaseCommand } from './../actions/commands/actions';
import { BaseOperator } from './../actions/operator';
import { PositionDiff } from './../common/motion/position';
import { Transformation } from './../transformations/transformations';

/**
 * The RecordedState class holds the current action that the user is
 * doing. Example: Imagine that the user types:
 *
 * 5"qdw
 *
 * Then the relevant state would be
 *   * count of 5
 *   * copy into q register
 *   * delete operator
 *   * word movement
 *
 *
 * Or imagine the user types:
 *
 * vw$}}d
 *
 * Then the state would be
 *   * Visual mode action
 *   * (a list of all the motions you ran)
 *   * delete operator
 */
export class RecordedState {
  constructor() {
    this.registerName = configuration.useSystemClipboard ? '*' : '"';
  }

  /**
   * The keys the user has pressed that have not caused an action to be
   * executed yet. Used for showcmd and command remapping.
   */
  public commandList: string[] = [];

  /**
   * String representation of the exact keys that the user entered. Used for
   * showcmd.
   */
  public get commandString(): string {
    let result = '';

    for (const key of this.commandList) {
      if (key === configuration.leader) {
        result += '<leader>';
      } else {
        result += key;
      }
    }

    return result;
  }

  /**
   * Determines if the current command list is prefixed with a count
   */
  public get commandWithoutCountPrefix() {
    return this.commandList.join('').replace(/^[0-9]+/g, '');
  }

  /**
   * Reset the command list.
   */
  public resetCommandList() {
    this.commandList = [];
  }

  /**
   * Keeps track of keys pressed for the next action. Comes in handy when parsing
   * multiple length movements, e.g. gg.
   */
  public actionKeys: string[] = [];

  /**
   * Every action that has been run.
   */
  public actionsRun: BaseAction[] = [];

  public getLastActionRun(): BaseAction | undefined {
    if (this.actionsRun.length === 0) {
      return;
    }

    return this.actionsRun[this.actionsRun.length - 1];
  }

  public hasRunOperator = false;

  public hasRunSurround = false;
  public surroundKeys: string[] = [];
  public surroundKeyIndexStart = 0;

  /**
   * This is kind of a hack and should be associated with something like this:
   *
   * https://github.com/VSCodeVim/Vim/issues/805
   */
  public operatorPositionDiff: PositionDiff | undefined;

  public isInsertion = false;

  /**
   * The text transformations that we want to run. They will all be run after the action has been processed.
   *
   * Running an individual action will generally queue up to one of these, but if you're in
   * multi-cursor mode, you'll queue one per cursor, or more.
   *
   * Note that the text transformations are run in parallel. This is useful in most cases,
   * but will get you in trouble in others.
   */
  public transformations: Transformation[] = [];

  /**
   * The operator (e.g. d, y, >) the user wants to run, if there is one.
   */
  public get operator(): BaseOperator | undefined {
    const operators = this.operators;
    return operators.length > 0 ? operators[0] : undefined;
  }

  public get operators(): BaseOperator[] {
    return this.actionsRun.filter((a) => a instanceof BaseOperator).reverse() as BaseOperator[];
  }

  /**
   * The command (e.g. i, ., R, /) the user wants to run, if there is one.
   */
  public get command(): BaseCommand {
    const list = this.actionsRun.filter((a) => a instanceof BaseCommand).reverse();

    // TODO - disregard <Esc>, then assert this is of length 1.

    return list[0] as BaseCommand;
  }

  public get hasRunAMovement(): boolean {
    return this.actionsRun.some((a) => a.isMotion);
  }

  /**
   * The number of times the user wants to repeat this action.
   */
  public count: number = 0;

  /**
   * The number of times the user wants to repeat the operator. If after the operator the user
   * uses a motion with count that count will be multiplied by this count.
   *
   * Example: if user presses 2d3w it deletes 6 words.
   */
  public operatorCount: number = 0;

  /**
   * The register name for this action.
   */
  public registerName: string;

  public clone(): RecordedState {
    const res = new RecordedState();

    // TODO: Actual clone.

    res.actionKeys = this.actionKeys.slice(0);
    res.actionsRun = this.actionsRun.slice(0);
    res.hasRunOperator = this.hasRunOperator;
    res.hasRunSurround = this.hasRunSurround;
    res.surroundKeys = this.surroundKeys;

    return res;
  }

  public operatorReadyToExecute(mode: Mode): boolean {
    // Visual modes do not require a motion -- they ARE the motion.
    return (
      this.operator !== undefined &&
      !this.hasRunOperator &&
      mode !== Mode.SearchInProgressMode &&
      mode !== Mode.CommandlineInProgress &&
      (this.hasRunAMovement ||
        mode === Mode.Visual ||
        mode === Mode.VisualLine ||
        (this.operators.length > 1 &&
          this.operators.reverse()[0].constructor === this.operators.reverse()[1].constructor))
    );
  }
}
