import { ReplaceState } from '../state/replaceState';
import { Mode } from './mode';

/** Modes which have no extra associated data. */
export type SimpleMode = Exclude<Mode, Mode.Replace | Mode.SearchInProgressMode>;

/** State associated with the current mode. */
export type ModeData =
  | {
      mode: Mode.Replace;
      replaceState: ReplaceState;
    }
  | {
      mode: Mode.SearchInProgressMode;
      /** The first line number that was visible when SearchInProgressMode began */
      firstVisibleLineBeforeSearch: number;
    }
  | {
      mode: SimpleMode;
    };

export type ModeDataFor<T extends Mode> = { mode: T } & ModeData;
