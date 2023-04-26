import { PointRange } from "@replayio/protocol";
import { useContext, useMemo } from "react";

import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";

export function useCurrentFocusPointRange(): PointRange {
  const { range: focusRange } = useContext(FocusContext);
  const { endpoint } = useContext(SessionContext);

  return useMemo<PointRange>(
    () => ({
      begin: focusRange?.begin.point ?? "0",
      end: focusRange?.end.point ?? endpoint,
    }),
    [endpoint, focusRange]
  );
}
