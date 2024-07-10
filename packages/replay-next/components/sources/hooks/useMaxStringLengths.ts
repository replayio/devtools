import { useEffect, useRef } from "react";

import { formatHitCount } from "replay-next/components/sources/utils/formatHitCount";

// Reserve some minimum amount of space for the fast-forward and rewind hover buttons
const MIN_LINE_LENGTH = 3;

export function useMaxStringLengths({
  lineCount,
  maxHitCount,
  maxHitCountDefault,
}: {
  lineCount: number;
  maxHitCount: number | undefined;
  maxHitCountDefault: number;
}) {
  // By default, if we haven't loaded any hit counts yet for this source,
  // assume some default value (e.g. probably 1)
  const prevMaxHitCountRef = useRef<number>(maxHitCountDefault);

  // Once we've loaded actual hit counts, remember the max–
  // so we can fall back to that value if we reload due to focus window changes
  // This reduces the amount of visual "jumping" the hit counts gutter does
  useEffect(() => {
    if (maxHitCount != null) {
      prevMaxHitCountRef.current = maxHitCount;
    }
  }, [maxHitCount]);

  maxHitCount = maxHitCount ?? prevMaxHitCountRef.current;

  return {
    maxLineIndexStringLength: Math.max(`${lineCount}`.length, MIN_LINE_LENGTH),
    maxHitCountStringLength: `${formatHitCount(maxHitCount)}`.length,
  };
}
