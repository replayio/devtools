import { UIState } from "ui/state";
import { Location } from "@recordreplay/protocol";

export interface UrlLocation extends Location {
  sourceUrl: string;
}

export interface SelectedFrame {
  id: string;
  displayName: string;
  location: UrlLocation;
}

export function getActiveSearch(state: UIState): any;
export function getContext(state: UIState): any;
export function getDebugLineLocation(state: UIState): UrlLocation | undefined;
export function getPaneCollapse(state: UIState): boolean;
export function getPausePreviewLocation(state: UIState): UrlLocation;
export function getSelectedPrimaryPaneTab(state: UIState): any;
export function getSourceWithContent(state: UIState, sourceId: string): any;
export function getSourcesCollapsed(state: UIState): any;
export function getThreadContext(state: UIState): any;
export function getVisibleSelectedFrame(state: UIState): SelectedFrame | null;
export function hasFrames(state: UIState): boolean;
export function getSelectedSourceWithContent(state: UIState): any;
export function getSymbols(state: UIState, source: any): any;
export function getCursorPosition(state: UIState): any;
