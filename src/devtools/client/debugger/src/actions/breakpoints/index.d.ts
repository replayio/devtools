import { UIThunkAction } from "ui/actions";
import { Breakpoint } from "../../reducers/breakpoints";

interface Context {
  isPaused: boolean;
  navigateCounter: number;
  pauseCounter: number;
}

export function runAnalysisOnLine(cx: Context, line: number): UIThunkAction;
export function updateHoveredLineNumber(line: number): UIThunkAction;
export function addBreakpointAtLine(
  cx: Context,
  line: number,
  shouldLog: boolean,
  disabled: boolean,
  breakable: boolean
): UIThunkAction;
export function addBreakableBreakpointAtLine(cx: Context, line: number): UIThunkAction;
export function togglePrintStatement(
  cx: Context,
  breakpoint: Breakpoint,
  line: number
): UIThunkAction;
