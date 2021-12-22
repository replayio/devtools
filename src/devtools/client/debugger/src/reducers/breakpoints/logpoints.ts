import { SourceId } from "@recordreplay/protocol";
import { UIState } from "ui/state";
import { getBreakpointsList } from "../../selectors/breakpoints";
import { isLogpoint } from "../../utils/breakpoint";
import { Breakpoint } from "../breakpoints";

export function getLogpointsForSource(state: UIState, sourceId: SourceId): Breakpoint[] {
  if (!sourceId) {
    return [];
  }

  const breakpoints = getBreakpointsList(state);
  return breakpoints.filter(bp => bp.location.sourceId === sourceId).filter(bp => isLogpoint(bp));
}
