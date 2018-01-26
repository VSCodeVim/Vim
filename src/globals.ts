import { Configuration } from './configuration/configuration';
import { IConfiguration } from './configuration/iconfiguration';

/**
 * Global variables shared throughout extension
 */

export class Globals {
  public static isTesting = false;

  public static modeHandlerForTesting: any = undefined;

  public static testConfiguration: IConfiguration;
}
