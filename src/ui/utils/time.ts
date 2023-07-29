import padStart from "lodash/padStart";
import prettyMilliseconds from "pretty-ms";

export function formatDuration(ms: number, digits = 1) {
  return prettyMilliseconds(ms, { millisecondsDecimalDigits: digits });
}

export function formatTimestamp(ms: number) {
  const seconds = Math.round(ms / 1000.0);
  return `${Math.floor(seconds / 60)}:${padStart(String(seconds % 60), 2, "0")}`;
}
