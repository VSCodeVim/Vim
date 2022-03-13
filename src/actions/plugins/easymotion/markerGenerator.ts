import { Position } from 'vscode';
import { configuration } from './../../../configuration/configuration';
import { Marker } from './types';

export class MarkerGenerator {
  private matchesCount: number;
  private keyTable: string[];
  private prefixKeyTable: string[];

  constructor(matchesCount: number, keyTable?: string) {
    this.matchesCount = matchesCount;
    if (keyTable) {
      this.keyTable = keyTable.split('');
    } else {
      this.keyTable = this.getKeyTable();
    }
    this.prefixKeyTable = this.createPrefixKeyTable();
  }

  public generateMarker(
    index: number,
    markerPosition: Position,
    generateTwoCharacterMarkers = true
  ): Marker | null {
    const { keyTable, prefixKeyTable } = this;

    if (!generateTwoCharacterMarkers) {
      return index < keyTable.length
        ? {
            name: keyTable[index],
            position: markerPosition,
          }
        : null;
    }

    if (index >= keyTable.length - prefixKeyTable.length) {
      const remainder = index - (keyTable.length - prefixKeyTable.length);
      const currentStep = Math.floor(remainder / keyTable.length) + 1;
      if (currentStep > prefixKeyTable.length) {
        return null;
      } else {
        const prefix = prefixKeyTable[currentStep - 1];
        const label = keyTable[remainder % keyTable.length];
        return {
          name: prefix + label,
          position: markerPosition,
        };
      }
    } else {
      return {
        name: keyTable[index],
        position: markerPosition,
      };
    }
  }

  private createPrefixKeyTable(): string[] {
    const totalRemainder = Math.max(this.matchesCount - this.keyTable.length, 0);
    const totalSteps = Math.ceil(totalRemainder / this.keyTable.length);
    const reversed = this.keyTable.slice().reverse();
    const count = Math.min(totalSteps, reversed.length);
    return reversed.slice(0, count);
  }

  /**
   * The key sequence for marker name generation
   */
  private getKeyTable(): string[] {
    if (configuration.easymotionKeys) {
      return configuration.easymotionKeys.split('');
    } else {
      return 'hklyuiopnm,qwertzxcvbasdgjf;'.split('');
    }
  }
}
