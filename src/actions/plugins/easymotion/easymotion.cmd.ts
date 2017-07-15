import { EasyMotion } from './easymotion';
import { Position } from './../../../common/motion/position';
import { ModeName } from './../../../mode/mode';
import { Configuration } from './../../../configuration/configuration';
import { BaseCommand } from './../../commands/actions';
import { RegisterAction } from './../../base';
import { VimState } from './../../../mode/modeHandler';

abstract class BaseEasyMotionCommand extends BaseCommand {
  public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];

  public abstract getMatches(position: Position, vimState: VimState): EasyMotion.Match[];

  public getMatchPosition(
    match: EasyMotion.Match,
    position: Position,
    vimState: VimState
  ): Position {
    return match.position;
  }

  public processMarkers(matches: EasyMotion.Match[], position: Position, vimState: VimState) {
    // Clear existing markers, just in case
    vimState.easyMotion.clearMarkers();

    let index = 0;
    for (const match of matches) {
      const pos = this.getMatchPosition(match, position, vimState);

      if (!match.position.isEqual(position)) {
        const marker = EasyMotion.generateMarker(index++, matches.length, position, pos);
        if (marker) {
          vimState.easyMotion.addMarker(marker);
        }
      }
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
        // Enter the EasyMotion mode and await further keys
        vimState.easyMotion = new EasyMotion();
        // Store mode to return to after performing easy motion
        vimState.easyMotion.previousMode = vimState.currentMode;
        vimState.currentMode = ModeName.EasyMotionMode;

        this.processMarkers(matches, position, vimState);

        return vimState;
      }
    }
  }
}

function createCommandKeys(command: { trigger: string[], useChar: boolean }) {
  return command.useChar
    ? ['<leader>', '<leader>', ...command.trigger, '<character>']
    : ['<leader>', '<leader>', ...command.trigger];
}

function getMatchesForChar(
  position: Position,
  vimState: VimState,
  searchChar: string,
  options?: EasyMotion.SearchOptions): EasyMotion.Match[] {
  // Search all occurences of the character pressed
  if (searchChar === ' ') {
    // Searching for space should only find the first space
    return vimState.easyMotion.sortedSearch(position, new RegExp(' {1,}', 'g'), options);
  } else {
    return vimState.easyMotion.sortedSearch(position, searchChar, options);
  }
}

function getMatchesForWord(position: Position, vimState: VimState, options?: EasyMotion.SearchOptions): EasyMotion.Match[] {
  // Search for the beginning of all words after the cursor
  return vimState.easyMotion.sortedSearch(position, new RegExp('\\w{1,}', 'g'), options);
}

function getMatchesForLineStart(position: Position, vimState: VimState, options?: EasyMotion.SearchOptions): EasyMotion.Match[] {
  // Search for the beginning of all non whitespace chars on each line before the cursor
  const matches = vimState.easyMotion.sortedSearch(position, new RegExp('^.', 'gm'), options);
  for (const match of matches) {
    match.position = match.position.getFirstLineNonBlankChar();
  }
  return matches;
}

@RegisterAction
class ActionEasyMotionSearchCommand extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['s'], useChar: true });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForChar(position, vimState, this.keysPressed[3]);
  }
}

@RegisterAction
class ActionEasyMotionFindForwardCommand extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['f'], useChar: true });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForChar(position, vimState, this.keysPressed[3], { min: position });
  }
}

@RegisterAction
class ActionEasyMotionFindBackwardCommand extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['F'], useChar: true });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForChar(position, vimState, this.keysPressed[3], { max: position });
  }
}

@RegisterAction
class ActionEasyMotionTilForwardCommand extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['t'], useChar: true });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForChar(position, vimState, this.keysPressed[3], { min: position });
  }

  public getMatchPosition(
    match: EasyMotion.Match,
    position: Position,
    vimState: VimState
  ): Position {
    return new Position(match.position.line, Math.max(0, match.position.character - 1));
  }
}

@RegisterAction
class ActionEasyMotionTilBackwardCommand extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['T'], useChar: true });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForChar(position, vimState, this.keysPressed[3], { max: position });
  }

  public getMatchPosition(
    match: EasyMotion.Match,
    position: Position,
    vimState: VimState
  ): Position {
    return new Position(match.position.line, Math.max(0, match.position.character + 1));
  }
}

@RegisterAction
class ActionEasyMotionWordCommand extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['w'], useChar: false });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForWord(position, vimState, { min: position });
  }
}

@RegisterAction
class ActionEasyMotionEndForwardCommand extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['e'], useChar: false });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForWord(position, vimState, { min: position });
  }

  public getMatchPosition(
    match: EasyMotion.Match,
    position: Position,
    vimState: VimState
  ): Position {
    return new Position(match.position.line, match.position.character + match.text.length - 1);
  }
}

@RegisterAction
class ActionEasyMotionEndBackwardCommand extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['g', 'e'], useChar: false });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForWord(position, vimState, { max: position });
  }

  public getMatchPosition(
    match: EasyMotion.Match,
    position: Position,
    vimState: VimState
  ): Position {
    return new Position(match.position.line, match.position.character + match.text.length - 1);
  }
}

@RegisterAction
class ActionEasyMotionBeginningWordCommand extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['b'], useChar: false });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForWord(position, vimState, { max: position });
  }
}

@RegisterAction
class ActionEasyMotionDownLines extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['j'], useChar: false });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForLineStart(position, vimState, { min: position });
  }
}

@RegisterAction
class ActionEasyMotionUpLines extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['k'], useChar: false });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForLineStart(position, vimState, { max: position });
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
      const markers = vimState.easyMotion.findMarkers(nail);

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
