import { configuration } from '../../../configuration/configuration';

export function useSmartQuotes(): boolean {
  return (
    (configuration.targets.enable === true && configuration.targets.smartQuotes.enable !== false) ||
    (configuration.targets.enable === undefined &&
      configuration.targets.smartQuotes.enable === true)
  );
}
