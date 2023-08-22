import { ExecutionPoint } from "@replayio/protocol";
import { useContext } from "react";

import { isPointInRegion } from "shared/utils/time";

import { FocusContext } from "../contexts/FocusContext";

export function useIsPointWithinFocusWindow(executionPoint: ExecutionPoint | null): boolean {
  const focusContext = useContext(FocusContext);
  const focusWindow = focusContext?.activeRange ?? null;

  return (
    executionPoint !== null && focusWindow !== null && isPointInRegion(executionPoint, focusWindow)
  );
}
