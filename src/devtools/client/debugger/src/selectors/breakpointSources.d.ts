import { UIState } from "ui/state";
import { Breakpoint } from "../reducers/breakpoints";
import { Source } from "../reducers/sources";

interface PrintStatementSource {
  source: Source;
  breakpoints: Breakpoint[];
}
// Do this properly. -jvv
type BreakpointSource = PrintStatementSource;

export function getPrintStatementSources(state: UIState): PrintStatementSource[];
export function getBreakpointSources(state: UIState): PrintStatementSource[];
