/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import type { UIState } from "ui/state";
export type { UrlLocation } from "../reducers/pause";
import type { Context } from "devtools/client/debugger/src/reducers/pause";

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

// TODO These declarations are still masking some usages
export declare function getContext(state: UIState): Context;
