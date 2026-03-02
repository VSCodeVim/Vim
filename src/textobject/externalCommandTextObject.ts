import { TextObject } from './textobject';
import { VimState } from '../state/vimState';
import { Position } from 'vscode';
import { IMovement, failedMovement } from '../actions/baseMotion';
import { commands } from 'vscode';
import { isVisualMode, Mode } from '../mode/mode';
import type { ITextObjectConfig } from '../configuration/iconfiguration';
import { RegisterAction } from '../actions/base';

type TextObjectResult = {
  start: Position;
  stop: Position;
};

type TextObjectArgs = {
  position: Position;
  mode: 'visual' | 'normal' | 'insert';
};

export class ExternalCommandTextObject extends TextObject {
  keys: string[];
  command: string;
  override modes: Mode[] = [Mode.Normal, Mode.Visual, Mode.VisualBlock];

  constructor(keys: string[], command: string) {
    super();
    this.keys = keys;
    this.command = command;
  }

  public override async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    try {
      const mode = vimState.currentMode;
      const args: TextObjectArgs = {
        position,
        mode: isVisualMode(mode) ? 'visual' : mode === Mode.Insert ? 'insert' : 'normal',
      };
      const result = await commands.executeCommand(this.command, args);
      assertResult(result);
      return {
        start: result.start,
        stop: result.stop,
      };
    } catch (e) {
      return failedMovement(vimState);
    }
  }
}

function assertResult(result: unknown): asserts result is TextObjectResult {
  if (typeof result !== 'object' || result === null) {
    throw new Error('Invalid result');
  }

  if (!('start' in result) || !('stop' in result)) {
    throw new Error('Invalid result');
  }
  const start = result.start;
  const stop = result.stop;

  if (typeof start !== 'object' || start === null) {
    throw new Error('Invalid start');
  }

  if (typeof stop !== 'object' || stop === null) {
    throw new Error('Invalid stop');
  }

  if (!('line' in start) || typeof start.line !== 'number') {
    throw new Error('Invalid start line');
  }

  if (!('character' in start) || typeof start.character !== 'number') {
    throw new Error('Invalid start character');
  }

  if (!('line' in stop) || typeof stop.line !== 'number') {
    throw new Error('Invalid stop line');
  }

  if (!('character' in stop) || typeof stop.character !== 'number') {
    throw new Error('Invalid stop character');
  }
}

export function registerTextObjects(objects: ITextObjectConfig[]): void {
  for (const obj of objects) {
    class DynamicTextObject extends ExternalCommandTextObject {
      constructor() {
        super(obj.keys, obj.command);
      }
    }
    RegisterAction(DynamicTextObject);
  }
}
