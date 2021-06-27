import { Position, Range } from 'vscode';
import { Logger } from '../util/logger';
import { stringify, Transformation } from './transformations';

export class Transformer {
  public readonly transformations: Transformation[] = [];

  private logger = Logger.get('Transformer');

  public addTransformation(transformation: Transformation): void {
    this.logger.debug(`Adding Transformation ${stringify(transformation)}`);
    this.transformations.push(transformation);
  }

  public insert(position: Position, text: string): void {
    this.addTransformation({ type: 'insertText', position, text });
  }

  public delete(range: Range): void {
    this.addTransformation({ type: 'deleteRange', range });
  }

  public replace(range: Range, text: string): void {
    this.addTransformation({ type: 'replaceText', range, text });
  }
}
