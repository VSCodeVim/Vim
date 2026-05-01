import { IConfiguration, IKeyRemapping } from '../../configuration/iconfiguration';

export class PluginDefaultMappings {
  // plugin authers may add entries here
  private static defaultMappings: Array<{
    mode: string;
    configSwitch: string;
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

  public static getPluginDefaultMappings(mode: string, config: IConfiguration): IKeyRemapping[] {
    return this.defaultMappings
      .filter((m) => m.mode === mode && config[m.configSwitch])
      .map((m) => m.mapping);
  }
}
