import { IConfiguration, IKeyRemapping } from './configuration/iconfiguration';
import { ModeHandler } from './mode/modeHandler';

/**
 * Global variables shared throughout extension
 */
export class Globals {
  /**
   * This is where we put files like HistoryFile. The path is given to us by VSCode.
   */
  static extensionStoragePath: string;

  /**
   * Used for testing.
   */
  static isTesting = false;
  static mockModeHandler: ModeHandler;
  static mockConfiguration: IConfiguration;
  static mockConfigurationDefaultBindings: {
    defaultNormalModeKeyBindings: IKeyRemapping[];
    defaultNormalModeKeyBindingsNonRecursive: IKeyRemapping[];
    defaultInsertModeKeyBindings: IKeyRemapping[];
    defaultInsertModeKeyBindingsNonRecursive: IKeyRemapping[];
    defaultVisualModeKeyBindings: IKeyRemapping[];
    defaultVisualModeKeyBindingsNonRecursive: IKeyRemapping[];
    defaultCommandLineModeKeyBindings: IKeyRemapping[];
    defaultCommandLineModeKeyBindingsNonRecursive: IKeyRemapping[];
    defaultOperatorPendingModeKeyBindings: IKeyRemapping[];
    defaultOperatorPendingModeKeyBindingsNonRecursive: IKeyRemapping[];
  } = {
    defaultNormalModeKeyBindings: [],
    defaultNormalModeKeyBindingsNonRecursive: [],
    defaultInsertModeKeyBindings: [],
    defaultInsertModeKeyBindingsNonRecursive: [],
    defaultVisualModeKeyBindings: [],
    defaultVisualModeKeyBindingsNonRecursive: [],
    defaultCommandLineModeKeyBindings: [],
    defaultCommandLineModeKeyBindingsNonRecursive: [],
    defaultOperatorPendingModeKeyBindings: [],
    defaultOperatorPendingModeKeyBindingsNonRecursive: [],
  };
}
