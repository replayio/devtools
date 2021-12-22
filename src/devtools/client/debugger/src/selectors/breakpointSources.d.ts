import { UIState } from "ui/state";
import { Breakpoint } from "../reducers/breakpoints";
import { Source } from "../reducers/sources";

interface LogpointSource {
  source: Source;
  breakpoints: Breakpoint[];
}
// Do this properly. -jvv
type BreakpointSource = LogpointSource;

export function getLogpointSources(state: UIState): LogpointSource[];
export function getBreakpointSources(state: UIState): LogpointSource[];
