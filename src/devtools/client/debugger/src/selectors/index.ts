/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import type { UIState } from "ui/state";
import type { UrlLocation } from "../reducers/pause";
export type { UrlLocation } from "../reducers/pause";

export * from "../reducers/sources";
export * from "../reducers/tabs";
export * from "../reducers/event-listeners";
export * from "../reducers/pause";
export * from "../reducers/threads";
export * from "../reducers/breakpoints";
export * from "../reducers/pending-breakpoints";
export * from "../reducers/ui";
export * from "../reducers/file-search";
export * from "../reducers/ast";
export * from "../reducers/source-tree";
export * from "../reducers/preview";

export {
  getSourceActor,
  hasSourceActor,
  getSourceActors,
  getSourceActorsForThread,
} from "../reducers/source-actors";

export * from "../reducers/quick-open";

export * from "./breakpoints";
export { getBreakpointAtLocation, getBreakpointsAtLine } from "./breakpointAtLocation";
export { getVisibleBreakpoints, getFirstVisibleBreakpoints } from "./visibleBreakpoints";
export { isSelectedFrameVisible } from "./isSelectedFrameVisible";
export { getCallStackFrames } from "./getCallStackFrames";
export { getBreakpointSources, getLogpointSources } from "./breakpointSources";
export * from "./visibleColumnBreakpoints";
export { getSelectedFrame, getVisibleSelectedFrame, getFramePositions } from "./pause";
export * from "./debugLine";

export declare function getThreadContext(state: UIState): any;

export declare function getActiveSearch(state: UIState): string;
export declare function getContext(state: UIState): any;
export declare function getCursorPosition(state: UIState): any;
export declare function getDebugLineLocation(state: UIState): UrlLocation | undefined;
export declare function getPaneCollapse(state: UIState): boolean;
export declare function getPausePreviewLocation(state: UIState): UrlLocation;
export declare function getSelectedPrimaryPaneTab(state: UIState): any;
export declare function getSelectedSourceWithContent(state: UIState): any;
export declare function getSourceActorsForSource(state: UIState, sourceId: string): any;
export declare function getSourceWithContent(state: UIState, sourceId: string): any;
export declare function getSourcesCollapsed(state: UIState): any;
export declare function getSymbols(state: UIState, source: any): any;
export declare function getThreadContext(state: UIState): any;
export declare function hasFrames(state: UIState): boolean;
