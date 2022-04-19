import { string } from "prop-types";
import { UIState } from "ui/state";

import { Frame } from "../reducers/sources";

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
export function getFrames(state: UIState): Frame[];
export function getSelectedFrameId(state: UIState): string;
export function getContext(state: UIState): Context;
