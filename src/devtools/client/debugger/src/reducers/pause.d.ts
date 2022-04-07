import { string } from "prop-types";
import { UIState } from "ui/state";
import { Source } from "./source";

export interface Context {
  isPaused: boolean;
  navigateCounter: number;
  pauseCounter: number;
}

declare function getExecutionPoint(state: UIState): string | null;
export function getAlternateSource(state: UIState): Source | null;
export function getShouldLogExceptions(state: UIState): boolean;
export function getFrameScope(state: UIState, frameId: string): any;
export function getContext(state: UIState): Context;
