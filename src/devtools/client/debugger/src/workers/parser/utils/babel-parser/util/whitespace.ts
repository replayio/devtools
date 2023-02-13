import * as charCodes from "charcodes";

// Matches a whole line break (where CRLF is considered a single
// line break). Used to count lines.
export const lineBreak = /\r\n?|[\n\u2028\u2029]/;
export const lineBreakG = new RegExp(lineBreak.source, "g");

// https://tc39.github.io/ecma262/#sec-line-terminators
export function isNewLine(code: number): boolean {
  switch (code) {
    case charCodes.lineFeed:
    case charCodes.carriageReturn:
    case charCodes.lineSeparator:
    case charCodes.paragraphSeparator:
      return true;

    default:
      return false;
  }
}

export const skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;

export const skipWhiteSpaceInLine =
  /(?:[^\S\n\r\u2028\u2029]|\/\/.*|\/\*.*?\*\/)*/y;

// Skip whitespace and single-line comments, including /* no newline here */.
// After this RegExp matches, its lastIndex points to a line terminator, or
// the start of multi-line comment (which is effectively a line terminator),
// or the end of string.
export const skipWhiteSpaceToLineBreak = new RegExp(
  // Unfortunately JS doesn't support Perl's atomic /(?>pattern)/ or
  // possessive quantifiers, so we use a trick to prevent backtracking
  // when the look-ahead for line terminator fails.
  "(?=(" +
    // Capture the whitespace and comments that should be skipped inside
    // a look-ahead assertion, and then re-match the group as a unit.
    skipWhiteSpaceInLine.source +
    "))\\1" +
    // Look-ahead for either line terminator, start of multi-line comment,
    // or end of string.
    /(?=[\n\r\u2028\u2029]|\/\*(?!.*?\*\/)|$)/.source,
  "y", // sticky
);

// https://tc39.github.io/ecma262/#sec-white-space
export function isWhitespace(code: number): boolean {
  switch (code) {
    case 0x0009: // CHARACTER TABULATION
    case 0x000b: // LINE TABULATION
    case 0x000c: // FORM FEED
    case charCodes.space:
    case charCodes.nonBreakingSpace:
    case charCodes.oghamSpaceMark:
    case 0x2000: // EN QUAD
    case 0x2001: // EM QUAD
    case 0x2002: // EN SPACE
    case 0x2003: // EM SPACE
    case 0x2004: // THREE-PER-EM SPACE
    case 0x2005: // FOUR-PER-EM SPACE
    case 0x2006: // SIX-PER-EM SPACE
    case 0x2007: // FIGURE SPACE
    case 0x2008: // PUNCTUATION SPACE
    case 0x2009: // THIN SPACE
    case 0x200a: // HAIR SPACE
    case 0x202f: // NARROW NO-BREAK SPACE
    case 0x205f: // MEDIUM MATHEMATICAL SPACE
    case 0x3000: // IDEOGRAPHIC SPACE
    case 0xfeff: // ZERO WIDTH NO-BREAK SPACE
      return true;

    default:
      return false;
  }
}
