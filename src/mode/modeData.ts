import { ExCommandLine, SearchCommandLine } from '../cmd_line/commandLine';
import { ReplaceState } from '../state/replaceState';
import { Mode } from './mode';

/** Modes which have no extra associated data. */
export type SimpleMode = Exclude<
  Mode,
  Mode.Replace | Mode.SearchInProgressMode | Mode.CommandlineInProgress | Mode.Insert
>;

/** State associated with the current mode. */
export type ModeData =
  | {
      mode: Mode.Replace;
      replaceState: ReplaceState;
    }
  | {
      mode: Mode.CommandlineInProgress;
      commandLine: ExCommandLine;
    }
  | {
      mode: Mode.SearchInProgressMode;
      commandLine: SearchCommandLine;
      /** The first line number that was visible when SearchInProgressMode began */
      firstVisibleLineBeforeSearch: number;
    }
  | {
      mode: Mode.Insert;
      /** The high surrogate of an incomplete pair */
      highSurrogate: string | undefined;
    }
  | {
      mode: SimpleMode;
    };

export type ModeDataFor<T extends Mode> = { mode: T } & ModeData;
