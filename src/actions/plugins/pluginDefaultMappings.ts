import {
  IConfiguration,
  IKeyRemapping,
  KeyBindingsConfigKey,
} from '../../configuration/iconfiguration';

/**
 * Settings that turn a plugin on or off
 */
type BooleanConfigKey = {
  [K in keyof IConfiguration]: IConfiguration[K] extends boolean ? K : never;
}[keyof IConfiguration];

export class PluginDefaultMappings {
  // plugin authers may add entries here
  private static defaultMappings: Array<{
    mode: KeyBindingsConfigKey;
    configSwitch: BooleanConfigKey;
    mapping: IKeyRemapping;
  }> = [
    // default maps for surround
    {
      mode: 'normalModeKeyBindingsNonRecursive',
      configSwitch: 'surround',
      mapping: { before: ['y', 's'], after: ['<plugys>'] },
    },
    {
      mode: 'normalModeKeyBindingsNonRecursive',
      configSwitch: 'surround',
      mapping: { before: ['y', 's', 's'], after: ['<plugys>', '<plugys>'] },
    },
    {
      mode: 'normalModeKeyBindingsNonRecursive',
      configSwitch: 'surround',
      mapping: { before: ['c', 's'], after: ['<plugcs>'] },
    },
    {
      mode: 'normalModeKeyBindingsNonRecursive',
      configSwitch: 'surround',
      mapping: { before: ['d', 's'], after: ['<plugds>'] },
    },
  ];

  public static getPluginDefaultMappings(
    mode: KeyBindingsConfigKey,
    config: IConfiguration,
  ): IKeyRemapping[] {
    return this.defaultMappings
      .filter((m) => m.mode === mode && config[m.configSwitch])
      .map((m) => m.mapping);
  }
}
