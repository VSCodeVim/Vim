import * as _ from 'lodash';

import { Configuration } from '../configuration/configuration';
import { ModeName } from '../mode/mode';
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
 * Then the relevent state would be
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
    this.registerName = Configuration.useSystemClipboard ? '*' : '"';
  }

  /**
   * The keys the user has pressed that have not caused an action to be
   * executed yet. Used for showcmd and command remapping.
   */
  public commandList: string[] = [];

  /**
   * The number of keys the user has pressed that have been remapped.
   */
  public numberOfRemappedKeys: number = 0;

  /**
   * String representation of the exact keys that the user entered. Used for
   * showcmd.
   */
  public get commandString(): string {
    let result = '';

    for (const key of this.commandList) {
      if (key === Configuration.leader) {
        result += '<leader>';
      } else {
        result += key;
      }
    }

    return result;
  }
  /**
   * get the current command without the prefixed count.
   * For instance: if the current commandList is ['2', 'h'], returns only ['h'].
   */
  public getCurrentCommandWithoutCountPrefix(): string[] {
    const commandList = this.commandList;
    const result = [];
    let previousWasCount = true;

    for (const commandKey of commandList) {
      if (previousWasCount && commandKey.match(/[0-9]/)) {
        continue;
      } else {
        previousWasCount = false;
        result.push(commandKey);
      }
    }

    return result;
  }

  /**
   * lenth of the current command with remappings and the prefixed count excluded.
   */
  public get numberOfKeysInCommandWithoutCountPrefix() {
    return this.getCurrentCommandWithoutCountPrefix().length - this.numberOfRemappedKeys;
  }

  /**
   * Reset the command list.
   */
  public resetCommandList() {
    this.commandList = [];
    this.numberOfRemappedKeys = 0;
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
  public get operator(): BaseOperator {
    let list = _.filter(this.actionsRun, a => a instanceof BaseOperator).reverse();
    return list[0] as any;
  }

  public get operators(): BaseOperator[] {
    return _.filter(this.actionsRun, a => a instanceof BaseOperator).reverse() as any;
  }

  /**
   * The command (e.g. i, ., R, /) the user wants to run, if there is one.
   */
  public get command(): BaseCommand {
    const list = _.filter(this.actionsRun, a => a instanceof BaseCommand);

    // TODO - disregard <Esc>, then assert this is of length 1.

    return list[0] as any;
  }

  public get hasRunAMovement(): boolean {
    return _.filter(this.actionsRun, a => a.isMotion).length > 0;
  }

  /**
   * The number of times the user wants to repeat this action.
   */
  public count: number = 0;

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

  public operatorReadyToExecute(mode: ModeName): boolean {
    // Visual modes do not require a motion -- they ARE the motion.
    return (
      this.operator &&
      !this.hasRunOperator &&
      mode !== ModeName.SearchInProgressMode &&
      (this.hasRunAMovement ||
        (mode === ModeName.Visual || mode === ModeName.VisualLine) ||
        (this.operators.length > 1 &&
          this.operators.reverse()[0].constructor === this.operators.reverse()[1].constructor))
    );
  }
}
