import { useMemo, useState } from "react";

import { Value as ClientValue } from "replay-next/src/utils/protocol";

import styles from "./shared.module.css";

type ValueType = ClientValue["type"];

const previewTypeToClassName: Partial<Record<ValueType, string>> = {
  bigint: styles.BigInt,
  boolean: styles.Boolean,
  nan: styles.NaN,
  null: styles.Null,
  number: styles.Number,
  string: styles.String,
  symbol: styles.Symbol,
  undefined: styles.Undefined,
};

// Arbitrary cutoffs for now
const MAX_NESTED_STRING_LENGTH = 100;
const MAX_EXPANDED_STRING_LENGTH = 200;
const TRUNCATION_INDICATOR = "[...]";

// Copied from utils/string and made global
export const NEW_LINE_REGEX = /\r\n?|\n|\u2028|\u2029/g;

// Default renderer for primitive values (like numbers, strings, etc).
export default function ClientValueValueRenderer({
  clientValue,
  context,
  disableExpandStringToggle = false,
}: {
  clientValue: ClientValue;
  context: "console" | "default" | "nested";
  disableExpandStringToggle?: boolean;
}) {
  // We'll let the child `<Expandable>` tell us when it's expanded
  const [isStringExpanded, setIsStringExpanded] = useState(false);
  const className = previewTypeToClassName[clientValue.type];

  const [formattedValue, needsExpandStringToggle] = useMemo(() => {
    let preview = clientValue.preview;
    let needsExpandStringToggle = false;

    if (clientValue.type == "string" && preview != undefined) {
      if (context === "nested") {
        // Replace actual newlines with literal "\n" text to keep the
        // preview text on a single line
        preview = preview.replace(NEW_LINE_REGEX, "\\n");

        if (preview.length > MAX_NESTED_STRING_LENGTH) {
          preview = preview.slice(0, MAX_NESTED_STRING_LENGTH) + TRUNCATION_INDICATOR;
        }
      } else {
        // We want to show the string as-is including actual newlines.
        // However, we'll still potentially truncate it to save vertical space.
        // We need to determine if it _can_ be truncated, and if we're _displaying_ it truncated.
        needsExpandStringToggle = preview.length > MAX_EXPANDED_STRING_LENGTH;
        if (needsExpandStringToggle && !isStringExpanded) {
          preview = preview.slice(0, MAX_EXPANDED_STRING_LENGTH) + TRUNCATION_INDICATOR;
        }
      }

      // Strings displayed at the top level of a console don't require explicit quotation mark wrappers.
      // In fact, this makes them harder to read for the most common case of console logging.
      // However, nested values (either inline previews or expanded key-value pairs) require explicit wrappers
      // to distinguish between string values and variables/pointers.
      if (context !== "console") {
        preview = `"${preview}"`;
      }
    }

    return [preview, needsExpandStringToggle] as const;
  }, [clientValue, context, isStringExpanded]);

  const finalFormattedValue = formattedValue || " ";
  let contents: React.ReactNode = finalFormattedValue;

  if (needsExpandStringToggle && !disableExpandStringToggle) {
    contents = (
      <>
        {finalFormattedValue}
        <button
          className={styles.StringToggleButton}
          onClick={() => setIsStringExpanded(!isStringExpanded)}
        >
          {isStringExpanded ? "Less" : "More"}
        </button>
      </>
    );
  }

  return (
    <span className={className} data-test-name="ClientValue">
      {contents}
    </span>
  );
}
