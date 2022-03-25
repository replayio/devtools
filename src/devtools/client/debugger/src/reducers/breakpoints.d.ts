import { Location, SourceId } from "@recordreplay/protocol";
import { UIState } from "ui/state";

export type Breakpoint = {
  location: any;
  options: {
    shouldPause?: boolean;
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
export function getLogpointsForSource(
  state: UIState,
  sourceId: SourceId,
  line?: number
): Breakpoint[];
export function getBreakpointsForSourceId(state: UIState, line?: number): Breakpoint[];
