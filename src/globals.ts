import { ConfigurationBase } from './configuration/configurationBase';
import { ModeHandler } from './mode/modeHandler';

/**
 * Global variables shared throughout extension
 */

export class Globals {
  public static isTesting: boolean = false;
  public static testModeHandler: ModeHandler;
  public static testConfiguration: ConfigurationBase;
}
