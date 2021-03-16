import { Logger } from '../util/logger';
import { Transformation } from './transformations';

export class Transformer {
  public readonly transformations: Transformation[] = [];

  private logger = Logger.get('Transformer');

  public addTransformation(transformation: Transformation) {
    this.logger.debug(`Adding Transformation ${JSON.stringify(transformation)}`);
    this.transformations.push(transformation);
  }
}
