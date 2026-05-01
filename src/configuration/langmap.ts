import { SetCommand } from '../cmd_line/commands/set';
import { Mode } from '../mode/mode';
import { configuration } from './configuration';

const nonMatchable = /<(any|leader|number|alpha|character|register|macro)>/;
const literalKeys = /<(any|number|alpha|character)>/; // do not treat <register> or <macro> as literal!
const literalModes = [
  Mode.Insert,
  Mode.Replace,
  Mode.CommandlineInProgress,
  Mode.SearchInProgressMode,
];

let lastLangmapString = '';

SetCommand.addListener('langmap', () => {
  updateLangmap(configuration.langmap);
});
configuration.addLoadListener(() => {
  updateLangmap(configuration.langmap);
});
updateLangmap(configuration.langmap);

export function updateLangmap(langmapString: string) {
  if (lastLangmapString === langmapString) return;
  const { bindings, reverseBindings } = parseLangmap(langmapString);

  lastLangmapString = langmapString;
  configuration.langmap = langmapString;
  configuration.langmapBindingsMap = bindings;
  configuration.langmapReverseBindingsMap = reverseBindings;
}

/**
 *  From :help langmap
 *  The 'langmap' option is a list of parts, separated with commas.  Each
 *      part can be in one of two forms:
 *      1.  A list of pairs.  Each pair is a "from" character immediately
 *          followed by the "to" character.  Examples: "aA", "aAbBcC".
 *      2.  A list of "from" characters, a semi-colon and a list of "to"
 *          characters.  Example: "abc;ABC"
 */
function parseLangmap(langmapString: string): {
  bindings: Map<string, string>;
  reverseBindings: Map<string, string>;
} {
  if (!langmapString) return { bindings: new Map(), reverseBindings: new Map() };

  const bindings: Map<string, string> = new Map();
  const reverseBindings: Map<string, string> = new Map();

  const getEscaped = (list: string) => {
    return list.split(/\\?(.)/).filter(Boolean);
  };
  langmapString.split(/((?:[^\\,]|\\.)+),/).map((part) => {
    if (!part) return;
    const semicolon = part.split(/((?:[^\\;]|\\.)+);/);
    if (semicolon.length === 3) {
      const from = getEscaped(semicolon[1]);
      const to = getEscaped(semicolon[2]);
      if (from.length !== to.length) return; // skip over malformed part
      for (let i = 0; i < from.length; ++i) {
        bindings.set(from[i], to[i]);
        reverseBindings.set(to[i], from[i]);
      }
    } else if (semicolon.length === 1) {
      const pairs = getEscaped(part);
      if (pairs.length % 2 !== 0) return; // skip over malformed part
      for (let i = 0; i < pairs.length; i += 2) {
        bindings.set(pairs[i], pairs[i + 1]);
        reverseBindings.set(pairs[i + 1], pairs[i]);
      }
    }
  });

  return { bindings, reverseBindings };
}

export function isLiteralMode(mode: Mode): boolean {
  return literalModes.includes(mode);
}

function map(langmap: Map<string, string>, key: string): string {
  // Notice that we're not currently remapping <C-> combinations.
  // From my experience, Vim doesn't handle ctrl remapping either.
  // It's possible that it's caused by my exact keyboard setup.
  // We might need to revisit this in the future, in case some user needs it.
  if (key.length !== 1) return key;
  return langmap.get(key) || key;
}

export function remapKey(key: string): string {
  return map(configuration.langmapBindingsMap, key);
}

function unmapKey(key: string): string {
  return map(configuration.langmapReverseBindingsMap, key);
}

// This is needed for bindings like "fa".
// We expect this to jump to the next occurence of "a".
// Thus, we need to revert "a" to its unmapped state.
export function unmapLiteral(
  reference: readonly string[] | readonly string[][],
  keys: readonly string[],
): string[] {
  if (reference.length === 0 || keys.length === 0) return [];

  // find best matching if there are multiple
  if (Array.isArray(reference[0])) {
    for (const possibility of reference as string[][]) {
      if (possibility.length !== keys.length) continue;
      let allMatch = true;
      for (let i = 0; i < possibility.length; ++i) {
        if (nonMatchable.test(possibility[i])) continue;
        if (possibility[i] !== keys[i]) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) return unmapLiteral(possibility, keys);
    }
  }

  const unmapped = [...keys];
  for (let i = 0; i < keys.length; ++i) {
    if (literalKeys.test((reference as string[])[i])) {
      unmapped[i] = unmapKey(keys[i]);
    }
  }
  return unmapped;
}
