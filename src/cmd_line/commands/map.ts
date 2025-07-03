// eslint-disable-next-line id-denylist
import {
  all,
  alt,
  optWhitespace,
  Parser,
  regexp,
  seqMap,
  // eslint-disable-next-line id-denylist
  string,
  succeed,
  whitespace,
} from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { IVimrcKeyRemapping } from '../../configuration/iconfiguration';
import { keystrokesExpressionParser } from '../../vimscript/parserUtils';

// NOTE: Unsupported: 's' (Select), 'l' (Insert, Command-line, Lang-Arg), and 't' (Terminal)
export type MapMode =
  | '' // Normal, Visual, Select, Operator-pending
  | 'n' // Normal
  | 'v' // Visual and Select
  | 'x' // Visual
  | 'o' // Operator-pending
  | 'ic' // Insert and Command-line
  | 'i' // Insert
  | 'c'; // Command-line

type MapKind = 'map' | 'noremap' | 'unmap' | 'mapclear';

type MapOptions = {
  buffer?: true; // <buffer>
  nowait?: true; // <nowait>
  silent?: true; // <silent>
  script?: true; // <script>
  expr?: true; // <expr>
  unique?: true; // <unique>
};

type MapCommandArgs = (
  | { kind: 'map' }
  | { kind: 'map'; lhs: string }
  | { kind: 'map'; lhs: string; rhs: string; options: MapOptions }
  | { kind: 'noremap'; lhs: string; rhs: string; options: MapOptions }
  | { kind: 'unmap'; lhs: string }
  | { kind: 'mapclear' }
) & { mode: MapMode };

export class MapCommand extends ExCommand {
  public static argParser(kind: MapKind, mode: MapMode): Parser<MapCommand> {
    // TODO: Handle `:map` and `:map {lhs}`
    // TODO: Handle bang
    if (kind === 'map' || kind === 'noremap') {
      return seqMap(
        whitespace
          .then(
            alt<MapOptions>(
              // TODO: Does <BUFFER> work?
              string('<buffer>').map(() => ({ buffer: true })),
              string('<nowait>').map(() => ({ nowait: true })),
              string('<silent>').map(() => ({ silent: true })),
              string('<script>').map(() => ({ script: true })),
              string('<expr>').map(() => ({ expr: true })),
              string('<unique>').map(() => ({ unique: true })),
            )
              .skip(optWhitespace)
              .many(),
          )
          .map((opts: MapOptions[]) => {
            const options: MapOptions = {};
            for (const opt of opts) {
              if (opt.buffer) options.buffer = true;
              if (opt.nowait) options.nowait = true;
              if (opt.silent) options.silent = true;
              if (opt.script) options.script = true;
              if (opt.expr) options.expr = true;
              if (opt.unique) options.unique = true;
            }
            return options;
          }),
        regexp(/\S+/),
        whitespace.then(all),
        (options, lhs, rhs) =>
          new MapCommand({
            kind,
            mode,
            lhs,
            rhs,
            options,
          }),
      );
    } else if (kind === 'unmap') {
      return whitespace.then(all).map(
        (lhs) =>
          new MapCommand({
            kind,
            mode,
            lhs,
          }),
      );
    } else if (kind === 'mapclear') {
      return succeed(
        new MapCommand({
          kind,
          mode,
        }),
      );
    }
    throw new Error(`Unexpected MapKind ${kind}`);
  }

  private args: MapCommandArgs;
  constructor(args: MapCommandArgs) {
    super();
    this.args = args;
  }

  public getRemap(): IVimrcKeyRemapping | undefined {
    if (
      this.args.kind === 'unmap' ||
      this.args.kind === 'mapclear' ||
      (this.args.kind === 'map' && !('rhs' in this.args))
    ) {
      return undefined;
    }
    return {
      keyRemapping: {
        before: keystrokesExpressionParser.tryParse(this.args.lhs),
        after: keystrokesExpressionParser.tryParse(this.args.rhs),
        silent: this.args.options?.silent ?? false,
        recursive: this.args.kind === 'map',
        source: 'vimrc',
      },
      keyRemappingType: this.args.mode,
    };
  }

  public async execute(vimState: VimState): Promise<void> {
    if (this.args.kind === 'map') {
      // TODO
    } else if (this.args.kind === 'noremap') {
      // TODO
    } else if (this.args.kind === 'unmap') {
      // TODO
    } else if (this.args.kind === 'mapclear') {
      // TODO
    } else {
      throw new Error('Unexpected MapKind');
    }
  }
}
