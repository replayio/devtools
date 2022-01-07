import { UIThunkAction } from "ui/actions";
import { Breakpoint } from "../../reducers/breakpoints";

export interface Context {
  isPaused: boolean;
  navigateCounter: number;
  pauseCounter: number;
}

export function runAnalysisOnLine(cx: Context, line: number): UIThunkAction;
export function updateHoveredLineNumber(line: number): UIThunkAction;
export function _addBreakpointAtLine(
  cx: Context,
  line: number,
  shouldLog: boolean,
  disabled: boolean,
  breakable: boolean
): UIThunkAction;
