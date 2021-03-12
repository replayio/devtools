import { UIThunkAction } from "ui/actions";

interface Context {
  isPaused: boolean;
  navigateCounter: number;
  pauseCounter: number;
}

export function runAnalysisOnLine(cx: Context, line: number): UIThunkAction;
export function updateHoveredLineNumber(line: number): UIThunkAction;
