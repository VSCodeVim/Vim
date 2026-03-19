/**
 * Utilities for handling symmetric pair delimiters in text objects and surround operations.
 *
 * Symmetric pairs are characters that can be used as both opening and closing delimiters,
 * such as $, /, _, #, etc. This is in contrast to asymmetric pairs like (), [], {}.
 */

/**
 * Regex matching a single non-alphanumeric character that isn't already
 * handled by a dedicated movement class.
 *
 * Excludes:
 * - Alphanumerics: A-Z, a-z, 0-9
 * - Quotes: " ' `
 * - Brackets: ( ) [ ] { } < >
 *
 * Used for registering symmetric pair text object actions (i$, a$, etc.)
 */
export const SYMMETRIC_PAIR_REGEX = /^[^A-Za-z0-9()\[\]{}<>"'`]$/;

/**
 * Check if a character should be treated as a symmetric pair delimiter
 * by the generic symmetric pair matcher.
 *
 * Returns true for characters like $, /, _, #, etc.
 * Returns false for alphanumerics and characters with dedicated handlers.
 */
export function isSymmetricPairChar(char: string): boolean {
  return SYMMETRIC_PAIR_REGEX.test(char);
}

/**
 * Check if a character is valid for surround operations.
 * This is more permissive than {@link isSymmetricPairChar} - it includes all
 * non-alphanumeric characters, even those handled by
 * `SurroundHelper`'s `edgePairings`.
 *
 * Used by the surround plugin to validate target/replacement characters.
 */
export function isValidSurroundChar(char: string): boolean {
  return /^[^A-Za-z0-9]$/.test(char);
}
