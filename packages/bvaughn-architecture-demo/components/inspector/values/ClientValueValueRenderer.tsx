import { useMemo, useState } from "react";

import Expandable from "bvaughn-architecture-demo/components/Expandable";
import { Value as ClientValue } from "bvaughn-architecture-demo/src/utils/protocol";

import styles from "./shared.module.css";

type ValueType = ClientValue["type"];

const previewTypeToClassname: Partial<Record<ValueType, string>> = {
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
const MAX_EXPANDED_STRING_LENGTH = 250;

// Copied from utils/string and made global
export const NEW_LINE_REGEX = /\r\n?|\n|\u2028|\u2029/g;

// Modified from https://stackoverflow.com/a/5723274/62937
function innerTruncate(fullStr: string, strLen: number, separator = " ...*truncated*... ") {
  if (fullStr.length <= strLen) {
    return fullStr;
  }

  const sepLen = separator.length;
  const charsToShow = strLen - sepLen;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);

  return `${fullStr.slice(0, frontChars)}${separator}${fullStr.slice(fullStr.length - backChars)}`;
}

// Default renderer for primitive values (like numbers, strings, etc).
export default function ClientValueValueRenderer({
  clientValue,
  context,
}: {
  clientValue: ClientValue;
  context: "console" | "default" | "nested";
}) {
  //We'll let the child `<Expandable>` tell us when it's expanded
  const [isStringExpanded, setIsStringExpanded] = useState(false);
  const className = previewTypeToClassname[clientValue.type];

  const [formattedValue, needsExpandStringToggle] = useMemo(() => {
    let preview = clientValue.preview;
    let needsExpandStringToggle = false;

    if (clientValue.type == "string" && preview != undefined) {
      if (context === "nested") {
        // Replace actual newlines with literal "\n" text to keep the
        // preview text on a single line
        preview = preview.replace(NEW_LINE_REGEX, "\\n");

        preview = innerTruncate(preview, MAX_NESTED_STRING_LENGTH);
      } else {
        // We want to show the string as-is including actual newlines.
        // However, we'll still potentially truncate it to save vertical space.
        // We need to determine if it _can_ be truncated, and if we're _displaying_ it truncated.
        needsExpandStringToggle = preview.length > MAX_EXPANDED_STRING_LENGTH;
        if (needsExpandStringToggle && !isStringExpanded) {
          preview = innerTruncate(preview, MAX_EXPANDED_STRING_LENGTH);
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

  if (needsExpandStringToggle) {
    // Abuse Expandable a bit - we always want to show the string, it's just a question
    // of whether we're showing the truncated version or the full version,
    // so put the text as the `header` prop.
    contents = (
      <Expandable header={finalFormattedValue} onChange={setIsStringExpanded}>
        {null}
      </Expandable>
    );
  }

  return (
    <span className={className} data-test-name="ClientValue">
      {contents}
    </span>
  );
}
