import { ModeHandler } from "./mode/modeHandler";
import { IConfiguration } from "./configuration/iconfiguration";

/**
 * Global variables shared throughout extension
 */
export class Globals {
  static isTesting = false;

  static mockModeHandler: ModeHandler;

  static mockConfiguration: IConfiguration;
}
