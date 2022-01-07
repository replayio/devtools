import { Location } from "@recordreplay/protocol";
import { UIState } from "ui/state";
import { Breakpoint } from "../reducers/breakpoints";

export function getRequestedBreakpointLocations(state: UIState): Record<string, Location>;
export function getBreakpointsList(state: UIState): Breakpoint[];
