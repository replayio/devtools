import { Location } from "@recordreplay/protocol";
import { UIState } from "ui/state";

type Breakpoint = {
  options: {
    breakable?: boolean;
    logValue?: string;
    condition?: string;
  };
};

export function getBreakpointForLocation(state: UIState, location: Location);
export function getBreakpointsForSource(state: UIState, location: Location);
export function getBreakpointsForSourceId(state: UIState, line?: number);
export function getBreakableBreakpointsForSource(state: UIState, location: Location, line?: number);
export function getPrintStatementsForSource(state: UIState, location: Location, line?: number);
