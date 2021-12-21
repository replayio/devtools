import { SourceId } from "@recordreplay/protocol";
import { UIState } from "ui/state";
import { getBreakpointsList } from "../../selectors/breakpoints";
import { isBreakable } from "../../utils/breakpoint";

export function getBreakableBreakpointsForSource(state: UIState, sourceId: SourceId, line: number) {
  if (!sourceId) {
    return [];
  }

  const breakpoints = getBreakpointsList(state);
  return breakpoints.filter(bp => {
    const location = bp.location;
    return location.sourceId === sourceId && (!line || line == location.line) && isBreakable(bp);
  });
}
