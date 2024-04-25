import prettyMilliseconds from "pretty-ms";

const MS_IN_MINUTE = 60_000;

export function formatEstimatedProcessingDuration(ms: number) {
  const minutes = Math.ceil(ms / MS_IN_MINUTE) || 1;
  return prettyMilliseconds(minutes * MS_IN_MINUTE, { verbose: true });
}
