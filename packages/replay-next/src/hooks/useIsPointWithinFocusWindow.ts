import { ExecutionPoint } from "@replayio/protocol";

import { useCurrentFocusWindow } from "replay-next/src/hooks/useCurrentFocusWindow";
import { isPointInRegion } from "shared/utils/time";

export function useIsPointWithinFocusWindow(executionPoint: ExecutionPoint | null): boolean {
  const focusWindow = useCurrentFocusWindow();

  return (
    executionPoint !== null && focusWindow !== null && isPointInRegion(executionPoint, focusWindow)
  );
}
