import { Position } from './../common/motion/position';
import { Mode, ModeName } from './mode';
import { VSCodeVimCursorType } from './mode';
import { VimState } from '../state/vimState';

export enum VisualBlockInsertionType {
  /**
   * Triggered with I
   */
  Insert,

  /**
   * Triggered with A
   */
  Append,
}

export class NormalMode extends Mode {
  constructor() {
    super(ModeName.Normal, '-- Normal --', VSCodeVimCursorType.Block);
  }
}

export class InsertMode extends Mode {
  constructor() {
    super(ModeName.Insert, '-- Insert --', VSCodeVimCursorType.Native);
  }

  getStatusBarCommandText(vimState: VimState): string {
    return '';
  }
}

export class VisualMode extends Mode {
  constructor() {
    super(ModeName.Visual, '-- Visual --', VSCodeVimCursorType.TextDecoration, true);
  }
}

export class VisualBlockMode extends Mode {
  constructor() {
    super(ModeName.VisualBlock, '-- Visual Block --', VSCodeVimCursorType.TextDecoration, true);
  }

  public static getTopLeftPosition(start: Position, stop: Position): Position {
    return new Position(Math.min(start.line, stop.line), Math.min(start.character, stop.character));
  }

  public static getBottomRightPosition(start: Position, stop: Position): Position {
    return new Position(Math.max(start.line, stop.line), Math.max(start.character, stop.character));
  }
}

export class VisualLineMode extends Mode {
  constructor() {
    super(ModeName.VisualLine, '-- Visual Line --', VSCodeVimCursorType.Block, true);
  }
}

export class SearchInProgressMode extends Mode {
  constructor() {
    super(ModeName.SearchInProgressMode, '', VSCodeVimCursorType.Block);
  }

  getStatusBarText(vimState: VimState): string {
    return `/${vimState.globalState.searchState!.searchString}`;
  }

  getStatusBarCommandText(vimState: VimState): string {
    return '';
  }
}

export class CommandlineInProgress extends Mode {
  constructor() {
    super(ModeName.CommandlineInProgress, '', VSCodeVimCursorType.Block);
  }

  getStatusBarText(vimState: VimState): string {
    let stringWithCursor = vimState.currentCommandlineText.split('');
    stringWithCursor.splice(vimState.statusBarCursorCharacterPos, 0, '|');

    return `:${stringWithCursor.join('')}`;
  }

  getStatusBarCommandText(vimState: VimState): string {
    return '';
  }
}

export class ReplaceMode extends Mode {
  constructor() {
    super(ModeName.Replace, '-- Replace --', VSCodeVimCursorType.Underline);
  }
}

export class EasyMotionMode extends Mode {
  constructor() {
    super(ModeName.EasyMotionMode, '-- EasyMotion --', VSCodeVimCursorType.Block);
  }

  getStatusBarCommandText(vimState: VimState): string {
    return `Target key: ${vimState.easyMotion.accumulation}`;
  }
}

export class EasyMotionInputMode extends Mode {
  constructor() {
    super(ModeName.EasyMotionInputMode, '-- EasyMotion Input --', VSCodeVimCursorType.Block);
  }

  getStatusBarCommandText(vimState: VimState): string {
    if (!vimState.easyMotion) {
      return '';
    }

    const searchCharCount = vimState.easyMotion.searchAction.searchCharCount;
    const message =
      searchCharCount > 0
        ? `Search for ${searchCharCount} character(s): `
        : 'Search for characters: ';
    return message + vimState.easyMotion.searchAction.getSearchString();
  }
}

export class SurroundInputMode extends Mode {
  constructor() {
    super(ModeName.SurroundInputMode, '-- Surround Input --', VSCodeVimCursorType.Block);
  }

  getStatusBarCommandText(vimState: VimState): string {
    return vimState.surround && vimState.surround.replacement ? vimState.surround.replacement : '';
  }
}

export class DisabledMode extends Mode {
  constructor() {
    super(ModeName.Disabled, '-- VIM: Disabled --', VSCodeVimCursorType.Line);
  }
}
