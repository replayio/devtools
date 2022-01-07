/**
 * A collection of functions for manipulating strings in terms of unicode "code points".
 *
 * Code Points vs. Code Units
 *
 * Normal JS string operations operate in terms of unicode "code units",
 * but our system source "columns" are defined in terms of "code points".
 *
 * This is important for unicode strings with any characters outside of ASCII range.
 *
 * For example, the string "Spooky! 👻"'s code unit length is `10`
 * because "👻" is encoded with 2 code units...
 *
 * ```
 * "Spooky! 👻".length === 10
 * ```
 *
 * "Spooky! 👻"'s _code point_ length is `9`,
 * which aligns with how we think of a "column" in code.
 *
 * ```
 * [..."Spooky! 👻"].length === 9
 * ```
 */

/**
 * Similar to `str.split('')`, but returns a "code point" character array,
 */
export function getCodePoints(str: string): string[] {
  return [...str];
}

/**
 * Returns the "code point" length of a string.
 */
export function getCodePointsLength(str: string): number {
  return getCodePoints(str).length;
}

/**
 * Returns a substring according to "code point" indicies.
 */
export function sliceCodePoints(str: string, from: number, to?: number): string {
  return getCodePoints(str).slice(from, to).join("");
}
