import { Position } from './../../../common/motion/position';
import { Configuration } from './../../../configuration/configuration';
import { EasyMotion } from './easymotion';

export class MarkerGenerator {
  private matchesCount: number;
  private keyTable: string[];
  private prefixKeyTable: string[];

  constructor(matchesCount: number) {
    this.matchesCount = matchesCount;
    this.keyTable = this.getKeyTable();
    this.prefixKeyTable = this.createPrefixKeyTable();
  }

  public generateMarker(index: number, markerPosition: Position): EasyMotion.Marker | null {
    const keyTable = this.keyTable;
    const prefixKeyTable = this.prefixKeyTable;

    if (index >= keyTable.length - prefixKeyTable.length) {
      const remainder = index - (keyTable.length - prefixKeyTable.length);
      const currentStep = Math.floor(remainder / keyTable.length) + 1;
      if (currentStep > prefixKeyTable.length) {
        return null;
      } else {
        const prefix = prefixKeyTable[currentStep - 1];
        const label = keyTable[remainder % keyTable.length];
        return new EasyMotion.Marker(prefix + label, markerPosition);
      }
    } else {
      const label = keyTable[index];
      return new EasyMotion.Marker(label, markerPosition);
    }
  }

  private createPrefixKeyTable(): string[] {
    const keyTable = this.keyTable;
    const totalRemainder = Math.max(this.matchesCount - keyTable.length, 0);
    const totalSteps = Math.ceil(totalRemainder / keyTable.length);
    const reversed = this.keyTable.slice().reverse();
    const count = Math.min(totalSteps, reversed.length);
    return reversed.slice(0, count);
  }

  /**
   * The key sequence for marker name generation
   */
  private getKeyTable(): string[] {
    if (Configuration.easymotionKeys) {
      return Configuration.easymotionKeys.split('');
    } else {
      return 'hklyuiopnm,qwertzxcvbasdgjf;'.split('');
    }
  }
}
