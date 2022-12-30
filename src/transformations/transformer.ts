import { Position, Range } from 'vscode';
import { PositionDiff } from '../common/motion/position';
import { Logger } from '../util/logger';
import { stringify, Transformation } from './transformations';

/**
 * This class is (ideally) responsible for managing all changes made to document state, via @see Transformation.
 * Currently, changes are queued up within Actions and then executed (more or less) all at once.
 *
 * NOTE: This whole system is heavily WIP as I work through a large piecemeal refactor.
 */
export class Transformer {
  public readonly transformations: Transformation[] = [];

  public addTransformation(transformation: Transformation): void {
    Logger.debug(`Adding Transformation ${stringify(transformation)}`);
    this.transformations.push(transformation);
  }

  public insert(position: Position, text: string, diff?: PositionDiff): void {
    this.addTransformation({ type: 'insertText', position, text, diff });
  }

  public delete(range: Range, diff?: PositionDiff): void {
    this.addTransformation({ type: 'deleteRange', range, diff });
  }

  public replace(range: Range, text: string, diff?: PositionDiff): void {
    this.addTransformation({ type: 'replaceText', range, text, diff });
  }

  public moveCursor(diff: PositionDiff, cursorIndex?: number): void {
    this.addTransformation({ type: 'moveCursor', diff, cursorIndex });
  }

  public vscodeCommand(command: string, ...args: any[]): void {
    this.addTransformation({ type: 'vscodeCommand', command, args });
  }
}
