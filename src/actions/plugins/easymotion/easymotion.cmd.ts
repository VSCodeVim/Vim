import { VimState } from '../../../state/vimState';
import { Position } from './../../../common/motion/position';
import { Configuration } from './../../../configuration/configuration';
import { ModeName } from './../../../mode/mode';
import { RegisterAction } from './../../base';
import { BaseCommand } from './../../commands/actions';
import { EasyMotion } from './easymotion';
import {
  EasyMotionCharMoveOpions,
  EasyMotionMoveOptionsBase,
  EasyMotionWordMoveOpions,
} from './types';

export interface EasymotionTrigger {
  key: string;
  leaderCount?: number;
}

export function buildTriggerKeys(trigger: EasymotionTrigger) {
  return [
    ...Array.from({ length: trigger.leaderCount || 2 }, () => '<leader>'),
    ...trigger.key.split(''),
  ];
}

abstract class BaseEasyMotionCommand extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];

  private _baseOptions: EasyMotionMoveOptionsBase;

  public abstract getMatches(position: Position, vimState: VimState): EasyMotion.Match[];

  constructor(baseOptions: EasyMotionMoveOptionsBase, trigger?: EasymotionTrigger) {
    super();
    this._baseOptions = baseOptions;
    if (trigger) {
      this.keys = buildTriggerKeys(trigger);
    }
  }

  public abstract resolveMatchPosition(match: EasyMotion.Match): Position;

  public processMarkers(matches: EasyMotion.Match[], cursorPosition: Position, vimState: VimState) {
    // Clear existing markers, just in case
    vimState.easyMotion.clearMarkers();

    let index = 0;
    const markerGenerator = EasyMotion.createMarkerGenerator(matches.length);
    for (const match of matches) {
      const matchPosition = this.resolveMatchPosition(match);
      // Skip if the match position equals to cursor position
      if (!matchPosition.isEqual(cursorPosition)) {
        const marker = markerGenerator.generateMarker(index++, matchPosition);
        if (marker) {
          vimState.easyMotion.addMarker(marker);
        }
      }
    }
  }

  protected searchOptions(position: Position): EasyMotion.SearchOptions {
    switch (this._baseOptions.searchOptions) {
      case 'min':
        return { min: position };
      case 'max':
        return { max: position };
      default:
        return {};
    }
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    // Only execute the action if the configuration is set
    if (!Configuration.easymotion) {
      return vimState;
    } else {
      // Search all occurences of the character pressed
      const matches = this.getMatches(position, vimState);

      // Stop if there are no matches
      if (matches.length === 0) {
        return vimState;
      } else {
        vimState.easyMotion = new EasyMotion();
        this.processMarkers(matches, position, vimState);

        if (matches.length === 1) {
          // Only one found, navigate to it
          const marker = vimState.easyMotion.markers[0];
          // Set cursor position based on marker entered
          vimState.cursorPosition = marker.position;
          vimState.easyMotion.clearDecorations();
          return vimState;
        } else {
          // Store mode to return to after performing easy motion
          vimState.easyMotion.previousMode = vimState.currentMode;
          // Enter the EasyMotion mode and await further keys
          vimState.currentMode = ModeName.EasyMotionMode;
          return vimState;
        }
      }
    }
  }
}

function getMatchesForString(
  position: Position,
  vimState: VimState,
  searchString: string,
  options?: EasyMotion.SearchOptions
): EasyMotion.Match[] {
  switch (searchString) {
    case '':
      return [];
    case ' ':
      // Searching for space should only find the first space
      return vimState.easyMotion.sortedSearch(position, new RegExp(' {1,}', 'g'), options);
    default:
      // Search all occurences of the character pressed
      const ignorecase =
        Configuration.ignorecase && !(Configuration.smartcase && /[A-Z]/.test(searchString));
      const regexFlags = ignorecase ? 'gi' : 'g';
      return vimState.easyMotion.sortedSearch(
        position,
        new RegExp(searchString, regexFlags),
        options
      );
  }
}

export interface EasyMotionSearchAction {
  /**
   * True if it should go to Easymotion mode
   */
  shouldFire(): boolean;

  /**
   * Command to execute when it should fire
   */
  fire(position: Position, vimState: VimState): Promise<VimState>;
  updateSearchString(s: string): void;
  getSearchString(): string;
  getMatches(position: Position, vimState: VimState): EasyMotion.Match[];
  readonly searchCharCount: number;
}

export class SearchByCharCommand extends BaseEasyMotionCommand implements EasyMotionSearchAction {
  private _searchString: string = '';
  private _options: EasyMotionCharMoveOpions;

  get searchCharCount() {
    return this._options.charCount;
  }

  constructor(options: EasyMotionCharMoveOpions) {
    super(options);
    this._options = options;
  }

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForString(
      position,
      vimState,
      this._searchString,
      this.searchOptions(position)
    );
  }

  public updateSearchString(s: string) {
    this._searchString = s;
  }

  public getSearchString() {
    return this._searchString;
  }

  public shouldFire() {
    const charCount = this._options.charCount;
    return charCount ? this._searchString.length >= charCount : true;
  }

  public fire(position: Position, vimState: VimState) {
    return this.exec(position, vimState);
  }

  public resolveMatchPosition(match: EasyMotion.Match): Position {
    const { line, character } = match.position;
    switch (this._options.labelPosition) {
      case 'after':
        return new Position(line, character + this._options.charCount);
      case 'before':
        return new Position(line, Math.max(0, character - 1));
      default:
        return match.position;
    }
  }
}

export class SearchByNCharCommand extends BaseEasyMotionCommand implements EasyMotionSearchAction {
  private _searchString: string = '';

  get searchCharCount() {
    return -1;
  }

  constructor() {
    super({});
  }

  public resolveMatchPosition(match: EasyMotion.Match): Position {
    return match.position;
  }

  public updateSearchString(s: string) {
    this._searchString = s;
  }

  public getSearchString() {
    return this._searchString;
  }

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForString(
      position,
      vimState,
      this.removeTrailingLineBreak(this._searchString),
      {}
    );
  }

  private removeTrailingLineBreak(s: string) {
    return s.replace(new RegExp('\n+$', 'g'), '');
  }

  public shouldFire() {
    // Fire when <CR> typed
    return this._searchString.endsWith('\n');
  }

  public async fire(position: Position, vimState: VimState) {
    if (this.removeTrailingLineBreak(this._searchString) === '') {
      return vimState;
    } else {
      return this.exec(position, vimState);
    }
  }
}

export class EasyMotionCharMoveCommandBase extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  private _action: EasyMotionSearchAction;

  constructor(trigger: EasymotionTrigger, action: EasyMotionSearchAction) {
    super();
    this._action = action;
    this.keys = buildTriggerKeys(trigger);
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    // Only execute the action if easymotion is enabled
    if (!Configuration.easymotion) {
      return vimState;
    } else {
      vimState.easyMotion = new EasyMotion();
      vimState.easyMotion.previousMode = vimState.currentMode;
      vimState.easyMotion.searchAction = this._action;
      vimState.globalState.hl = true;

      vimState.currentMode = ModeName.EasyMotionInputMode;
      return vimState;
    }
  }
}

export class EasyMotionWordMoveCommandBase extends BaseEasyMotionCommand {
  private _options: EasyMotionWordMoveOpions;

  constructor(trigger: EasymotionTrigger, options: EasyMotionWordMoveOpions = {}) {
    super(options, trigger);
    this._options = options;
  }

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return this.getMatchesForWord(position, vimState, this.searchOptions(position));
  }

  public resolveMatchPosition(match: EasyMotion.Match): Position {
    const { line, character } = match.position;
    switch (this._options.labelPosition) {
      case 'after':
        return new Position(line, character + match.text.length - 1);
      default:
        return match.position;
    }
  }

  private getMatchesForWord(
    position: Position,
    vimState: VimState,
    options?: EasyMotion.SearchOptions
  ): EasyMotion.Match[] {
    // Search for the beginning of all words after the cursor
    return vimState.easyMotion.sortedSearch(position, new RegExp('\\w{1,}', 'g'), options);
  }
}

export class EasyMotionLineMoveCommandBase extends BaseEasyMotionCommand {
  private _options: EasyMotionMoveOptionsBase;

  constructor(trigger: EasymotionTrigger, options: EasyMotionMoveOptionsBase = {}) {
    super(options, trigger);
    this._options = options;
  }

  public resolveMatchPosition(match: EasyMotion.Match): Position {
    return match.position;
  }

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return this.getMatchesForLineStart(position, vimState, this.searchOptions(position));
  }

  private getMatchesForLineStart(
    position: Position,
    vimState: VimState,
    options?: EasyMotion.SearchOptions
  ): EasyMotion.Match[] {
    // Search for the beginning of all non whitespace chars on each line before the cursor
    const matches = vimState.easyMotion.sortedSearch(position, new RegExp('^.', 'gm'), options);
    for (const match of matches) {
      match.position = match.position.getFirstLineNonBlankChar();
    }
    return matches;
  }
}

@RegisterAction
class EasyMotionCharInputMode extends BaseCommand {
  modes = [ModeName.EasyMotionInputMode];
  keys = ['<character>'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const key = this.keysPressed[0];
    const action = vimState.easyMotion.searchAction;
    const oldSearchString = action.getSearchString();
    const newSearchString =
      key === '<BS>' || key === '<shift+BS>' ? oldSearchString.slice(0, -1) : oldSearchString + key;
    action.updateSearchString(newSearchString);
    if (action.shouldFire()) {
      // Skip Easymotion input mode to make sure not to back to it
      vimState.currentMode = vimState.easyMotion.previousMode;
      const state = await action.fire(vimState.cursorPosition, vimState);
      return state;
    }
    return vimState;
  }
}

@RegisterAction
class CommandEscEasyMotionCharInputMode extends BaseCommand {
  modes = [ModeName.EasyMotionInputMode];
  keys = ['<Esc>'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Normal;
    return vimState;
  }
}

@RegisterAction
class MoveEasyMotion extends BaseCommand {
  modes = [ModeName.EasyMotionMode];
  keys = ['<character>'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const key = this.keysPressed[0];
    if (!key) {
      return vimState;
    } else {
      // "nail" refers to the accumulated depth keys
      const nail = vimState.easyMotion.accumulation + key;
      vimState.easyMotion.accumulation = nail;

      // Find markers starting with "nail"
      const markers = vimState.easyMotion.findMarkers(nail, true);

      // If previous mode was visual, restore visual selection
      if (
        vimState.easyMotion.previousMode === ModeName.Visual ||
        vimState.easyMotion.previousMode === ModeName.VisualLine ||
        vimState.easyMotion.previousMode === ModeName.VisualBlock
      ) {
        vimState.cursorStartPosition = vimState.lastVisualSelectionStart;
        vimState.cursorPosition = vimState.lastVisualSelectionEnd;
      }

      if (markers.length === 1) {
        // Only one found, navigate to it
        const marker = markers[0];

        vimState.easyMotion.clearDecorations();
        // Restore the mode from before easy motion
        vimState.currentMode = vimState.easyMotion.previousMode;

        // Set cursor position based on marker entered
        vimState.cursorPosition = marker.position;

        return vimState;
      } else {
        if (markers.length === 0) {
          // None found, exit mode
          vimState.easyMotion.clearDecorations();
          vimState.currentMode = vimState.easyMotion.previousMode;
          return vimState;
        } else {
          return vimState;
        }
      }
    }
  }
}
