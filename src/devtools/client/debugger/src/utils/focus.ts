import { TimeStampedPointRange } from "@replayio/protocol";

export function isFocusWindowApplied(
  focusWindow: TimeStampedPointRange | null,
  endpoint: string
): focusWindow is TimeStampedPointRange {
  return (
    focusWindow !== null && (focusWindow.begin.point !== "0" || focusWindow.end.point !== endpoint)
  );
}
