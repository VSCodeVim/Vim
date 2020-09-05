import { VimState } from '../../../state/vimState';
import { Position } from './../../../common/motion/position';
import { configuration } from './../../../configuration/configuration';
import { Mode, isVisualMode } from './../../../mode/mode';
import { RegisterAction, BaseCommand } from './../../base';
import { EasyMotion } from './easymotion';
import {
  EasyMotionCharMoveOpions,
  EasyMotionMoveOptionsBase,
  EasyMotionWordMoveOpions,
} from './types';
import { globalState } from '../../../state/globalState';
import { TextEditor } from '../../../textEditor';
import { MarkerGenerator } from './markerGenerator';

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
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];

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
    const markerGenerator = new MarkerGenerator(matches.length);
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

  public async exec(position: Position, vimState: VimState): Promise<void> {
    // Only execute the action if the configuration is set
    if (configuration.easymotion) {
      // Search all occurences of the character pressed
      const matches = this.getMatches(position, vimState);

      // If previous mode was visual, restore visual selection
      if (isVisualMode(vimState.easyMotion.previousMode)) {
        vimState.cursorStartPosition = vimState.lastVisualSelection!.start;
        vimState.cursorStopPosition = vimState.lastVisualSelection!.end;
      }

      // Stop if there are no matches
      if (matches.length > 0) {
        vimState.easyMotion = new EasyMotion();
        this.processMarkers(matches, position, vimState);

        if (matches.length === 1) {
          // Only one found, navigate to it
          const marker = vimState.easyMotion.markers[0];
          // Set cursor position based on marker entered
          vimState.cursorStopPosition = marker.position;
          vimState.easyMotion.clearDecorations();
        } else {
          // Store mode to return to after performing easy motion
          vimState.easyMotion.previousMode = vimState.currentMode;
          // Enter the EasyMotion mode and await further keys
          await vimState.setCurrentMode(Mode.EasyMotionMode);
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

      // If the input is not a letter, treating it as regex can cause issues
      if (!/[a-zA-Z]/.test(searchString)) {
        return vimState.easyMotion.sortedSearch(position, searchString, options);
      }

      const ignorecase =
        configuration.ignorecase && !(configuration.smartcase && /[A-Z]/.test(searchString));
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
  fire(position: Position, vimState: VimState): Promise<void>;
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

  public async fire(position: Position, vimState: VimState): Promise<void> {
    await this.exec(position, vimState);
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

  public async fire(position: Position, vimState: VimState): Promise<void> {
    if (this.removeTrailingLineBreak(this._searchString) !== '') {
      await this.exec(position, vimState);
    }
  }
}

export class EasyMotionCharMoveCommandBase extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  private _action: EasyMotionSearchAction;

  constructor(trigger: EasymotionTrigger, action: EasyMotionSearchAction) {
    super();
    this._action = action;
    this.keys = buildTriggerKeys(trigger);
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    // Only execute the action if easymotion is enabled
    if (configuration.easymotion) {
      vimState.easyMotion = new EasyMotion();
      vimState.easyMotion.previousMode = vimState.currentMode;
      vimState.easyMotion.searchAction = this._action;
      globalState.hl = true;

      await vimState.setCurrentMode(Mode.EasyMotionInputMode);
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
    const regex = this._options.jumpToAnywhere
      ? new RegExp(configuration.easymotionJumpToAnywhereRegex, 'g')
      : new RegExp('\\w{1,}', 'g');
    return vimState.easyMotion.sortedSearch(position, regex, options);
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
      match.position = TextEditor.getFirstNonWhitespaceCharOnLine(match.position.line);
    }
    return matches;
  }
}

@RegisterAction
class EasyMotionCharInputMode extends BaseCommand {
  modes = [Mode.EasyMotionInputMode];
  keys = ['<character>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const key = this.keysPressed[0];
    const action = vimState.easyMotion.searchAction;
    const oldSearchString = action.getSearchString();
    const newSearchString =
      key === '<BS>' || key === '<shift+BS>' ? oldSearchString.slice(0, -1) : oldSearchString + key;
    action.updateSearchString(newSearchString);
    if (action.shouldFire()) {
      // Skip Easymotion input mode to make sure not to back to it
      await vimState.setCurrentMode(vimState.easyMotion.previousMode);
      await action.fire(vimState.cursorStopPosition, vimState);
    }
  }
}

@RegisterAction
class CommandEscEasyMotionCharInputMode extends BaseCommand {
  modes = [Mode.EasyMotionInputMode];
  keys = ['<Esc>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class MoveEasyMotion extends BaseCommand {
  modes = [Mode.EasyMotionMode];
  keys = ['<character>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const key = this.keysPressed[0];
    if (key) {
      // "nail" refers to the accumulated depth keys
      const nail = vimState.easyMotion.accumulation + key;
      vimState.easyMotion.accumulation = nail;

      // Find markers starting with "nail"
      const markers = vimState.easyMotion.findMarkers(nail, true);

      // If previous mode was visual, restore visual selection
      if (isVisualMode(vimState.easyMotion.previousMode)) {
        vimState.cursorStartPosition = vimState.lastVisualSelection!.start;
        vimState.cursorStopPosition = vimState.lastVisualSelection!.end;
      }

      if (markers.length === 1) {
        // Only one found, navigate to it
        const marker = markers[0];

        vimState.easyMotion.clearDecorations();
        // Restore the mode from before easy motion
        await vimState.setCurrentMode(vimState.easyMotion.previousMode);

        // Set cursor position based on marker entered
        vimState.cursorStopPosition = marker.position;
      } else if (markers.length === 0) {
        // None found, exit mode
        vimState.easyMotion.clearDecorations();
        await vimState.setCurrentMode(vimState.easyMotion.previousMode);
      }
    }
  }
}
