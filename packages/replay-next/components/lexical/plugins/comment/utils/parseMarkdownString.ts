import { IS_BOLD, IS_CODE, IS_ITALIC, IS_STRIKETHROUGH } from "../constants";
import { FormattedTextRange } from "../types";

// This is a best-effort parser that supports a subset of Markdown.
// It does not handle all cases and will incorrectly parse lone underscores (e.g. foo_bar) as italic.
// It is only meant to be used for an initial import of Markdown text, not for a persistence mechanism.
export default function parseMarkdownString(markdown: string): FormattedTextRange[] {
  const ranges: FormattedTextRange[] = [];

  let currentIsBold = false;
  let currentIsCode = false;
  let currentIsItalic = false;
  let currentIsMention = false;
  let currentIsStrikethrough = false;
  let currentRange: FormattedTextRange | null = null;
  let didFormatChange = false;
  let shouldRecreateRangeImmediately = false;
  let trimmedText = "";

  for (let charIndex = 0; charIndex < markdown.length; charIndex++) {
    const char = markdown[charIndex];
    const nextChar = markdown[charIndex + 1];

    didFormatChange = false;
    shouldRecreateRangeImmediately = false;

    switch (char) {
      case "@": {
        if (charIndex === 0) {
          currentIsMention = true;
          didFormatChange = true;
          shouldRecreateRangeImmediately = true;
        } else {
          const prevChar = markdown[charIndex - 1];
          if (prevChar !== "@" && prevChar.match(/\B/) !== null) {
            currentIsMention = true;
            didFormatChange = true;
            shouldRecreateRangeImmediately = true;
          } else {
            if (currentIsMention) {
              currentIsMention = false;

              for (let rangeIndex = ranges.length - 1; rangeIndex >= 0; rangeIndex--) {
                const existingRange = ranges[rangeIndex];
                if (existingRange.isMention) {
                  existingRange.isMention = false;
                } else {
                  break;
                }
              }
            }
          }
        }
        break;
      }
      case "*": {
        if (nextChar === "*") {
          didFormatChange = true;
          charIndex++;
          currentIsBold = !currentIsBold;
        } else {
          didFormatChange = true;
          currentIsItalic = !currentIsItalic;
        }
        break;
      }
      case "_": {
        if (nextChar === "_") {
          didFormatChange = true;
          charIndex++;
          currentIsBold = !currentIsBold;
        } else {
          didFormatChange = true;
          currentIsItalic = !currentIsItalic;
        }
        break;
      }
      case "~": {
        if (nextChar === "~") {
          didFormatChange = true;
          charIndex++;
          currentIsStrikethrough = !currentIsStrikethrough;
        }
        break;
      }
      case "`": {
        didFormatChange = true;
        currentIsCode = !currentIsCode;
        break;
      }
    }

    // Special case; handle end of mention
    if (currentIsMention) {
      if (char !== "@" && char.match(/[\w\-]/) === null) {
        currentIsMention = false;
        didFormatChange = true;
        shouldRecreateRangeImmediately = true;
      }
    }

    if (didFormatChange) {
      currentRange = null;
    }

    if (!didFormatChange || shouldRecreateRangeImmediately) {
      if (currentRange === null) {
        let format = 0;
        format |= currentIsBold ? IS_BOLD : 0;
        format |= currentIsCode ? IS_CODE : 0;
        format |= currentIsItalic ? IS_ITALIC : 0;
        format |= currentIsStrikethrough ? IS_STRIKETHROUGH : 0;

        currentRange = {
          beginIndex: trimmedText.length,
          endIndex: trimmedText.length,
          format,
          isMention: currentIsMention,
          text: char,
        };

        ranges.push(currentRange);
      } else {
        currentRange.endIndex++;
        currentRange.text += char;
      }

      trimmedText += char;
    }
  }

  return ranges;
}
