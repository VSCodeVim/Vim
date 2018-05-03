import { IConfiguration } from './configuration/iconfiguration';
import { ModeHandler } from './mode/modeHandler';

/**
 * Global variables shared throughout extension
 */
export class Globals {
  static isTesting = false;

  static mockModeHandler: ModeHandler;

  static mockConfiguration: IConfiguration;
}
