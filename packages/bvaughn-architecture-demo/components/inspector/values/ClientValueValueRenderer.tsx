import { Value as ClientValue } from "@bvaughn/src/utils/protocol";

import styles from "./shared.module.css";

// Default renderer for primitive values (like numbers, strings, etc).
export default function ClientValueValueRenderer({
  clientValue,
  context,
}: {
  clientValue: ClientValue;
  context: "console" | "default" | "nested";
}) {
  let preview = clientValue.preview;

  let className;
  switch (clientValue.type) {
    case "bigint":
      className = styles.BigInt;
      break;
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

      // Strings displayed at the top level of a console don't require explicit quotation mark wrappers.
      // In fact, this makes them harder to read for the most common case of console logging.
      // However, nested values (either inline previews or expanded key-value pairs) require explicit wrappers
      // to distinguish between string values and variables/pointers.
      if (context !== "console") {
        preview = `"${preview}"`;
      }
      break;
    case "symbol":
      className = styles.Symbol;
      break;
    case "undefined":
      className = styles.Undefined;
      break;
  }

  return <span className={className}>{preview}</span>;
}
