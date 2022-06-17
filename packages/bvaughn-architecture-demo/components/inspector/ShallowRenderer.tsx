import { CSSProperties } from "react";

import { Value as ClientValue } from "../../src/utils/protocol";

import styles from "./ShallowRenderer.module.css";

export type Type = "boolean" | "nan" | "null" | "number" | "string" | "symbol" | "undefined";

// Renders primitive types (e.g. numbers, strings, booleans).
// These types cannot be inspected.
export default function SimpleRenderer({
  isRootValue,
  value,
}: {
  isRootValue: boolean;
  value: ClientValue;
}) {
  let preview = value.preview;
  let className;
  switch (value.type) {
    case "boolean":
      className = styles.Boolean;
      break;
    case "nan":
      className = styles.NaN;
      break;
    case "null":
      className = styles.Null;
      break;
    case "number":
      className = styles.Number;
      break;
    case "string":
      className = styles.String;

      if (!isRootValue) {
        // Strings displayed at the top level of a console don't require explicit quotation mark wrappers.
        // In fact, this makes them harder to read for the most common case of console logging.
        // However, nested values (either inline previews or expanded key-value pairs) require explicit wrappers
        // to distinguish between string values and variables/pointers.
        preview = `"${value.preview}"`;
      }
      break;
    case "symbol":
      className = styles.Symbol;
      break;
    case "undefined":
      className = styles.Undefined;
      break;
  }

  return (
    <>
      {value.name !== null ? <div className={styles.Name}>{value.name}</div> : null}
      <div className={className}>{preview}</div>
    </>
  );
}
