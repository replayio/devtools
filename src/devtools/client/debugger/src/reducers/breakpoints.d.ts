import { Location, SourceId } from "@recordreplay/protocol";
import { UIState } from "ui/state";

type Breakpoint = {
  location: any;
  options: {
    breakable?: boolean;
    logValue?: string;
    condition?: string;
  };
};

export function getBreakpointForLocation(state: UIState, location: Location);
export function getBreakpointsForSource(
  state: UIState,
  sourceId: SourceId,
  line?: number
): Breakpoint[];
export function getBreakpointsForSourceId(state: UIState, line?: number): Breakpoint[];
