import { Position, Range } from 'vscode';
import { PositionDiff } from '../common/motion/position';
import { Logger } from '../util/logger';
import { stringify, Transformation } from './transformations';

export class Transformer {
  public readonly transformations: Transformation[] = [];

  private logger = Logger.get('Transformer');

  public addTransformation(transformation: Transformation): void {
    this.logger.debug(`Adding Transformation ${stringify(transformation)}`);
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
}
