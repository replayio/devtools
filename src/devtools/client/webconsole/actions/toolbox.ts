/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { selectSource } from "devtools/client/debugger/src/actions/sources";
import { showSource } from "devtools/client/debugger/src/actions/ui";
import { openSourceLink } from "devtools/client/debugger/src/actions/ui";
import { getContext } from "devtools/client/debugger/src/selectors";
import { nodeSelected } from "devtools/client/inspector/markup/reducers/markup";
import type { UIThunkAction } from "ui/actions";
import { setSelectedPanel } from "ui/actions/layout";
import { clearHoveredItem, setHoveredItem } from "ui/actions/timeline";
import { isRegionLoaded } from "ui/reducers/app";
import { getSourceDetails, getSourceToDisplayForUrl } from "ui/reducers/sources";

type $FixTypeLater = any;

export function highlightDomElement(grip: $FixTypeLater): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    if (grip.getPause() !== ThreadFront.currentPause) {
      return;
    }

    const { highlightNode } = await import("devtools/client/inspector/markup/actions/markup");

    const nodeFront = grip.getNodeFront();
    if (nodeFront) {
      dispatch(highlightNode(nodeFront.id));
    }
  };
}

export function unHighlightDomElement(): UIThunkAction {
  return async dispatch => {
    const { unhighlightNode } = await import("devtools/client/inspector/markup/actions/markup");

    dispatch(unhighlightNode());
  };
}

export function openLink(url: string): UIThunkAction {
  return (dispatch, getState) => {
    const source = getSourceToDisplayForUrl(getState(), url);
    if (source?.id) {
      dispatch(openSourceLink(source.id));
    } else {
      window.open(url, "_blank");
    }
  };
}

// TODO This function is called by `InspectorContextReduxAdapter`, but disabled
export function openNodeInInspector(
  nodeId: string,
  reason: "console" | "debugger" = "console"
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { ThreadFront, replayClient, protocolClient }) => {
    /*
    const pause = valueFront.getPause()!;

    if (ThreadFront.currentPause !== pause && isRegionLoaded(getState(), pause.time)) {
      ThreadFront.timeWarpToPause(pause);
    }

    dispatch(setSelectedPanel("inspector"));

    // TODO Replace this with `getNodeDataAsync` and load parents

    // @ts-expect-error private field usage?
    const nodeFront = await pause.ensureDOMFrontAndParents(valueFront!._object!.objectId);

    // TODO Replace this
    dispatch(nodeSelected(nodeFront.objectId()));
    */
  };
}

export function onMessageHover(
  type: "mouseenter" | "mouseleave",
  message: $FixTypeLater
): UIThunkAction {
  return dispatch => {
    if (type == "mouseenter") {
      const hoveredItem = {
        target: "console",
        point: message.executionPoint,
        time: message.executionPointTime,
        location: message.frame,
      };
      // @ts-expect-error HoveredItem mismatch
      dispatch(setHoveredItem(hoveredItem));
    }
    if (type == "mouseleave") {
      dispatch(clearHoveredItem);
    }
  };
}

export function onViewSourceInDebugger(
  frame: { sourceId?: string; url: string; line?: number; column: number },
  openSourcesTab?: boolean
): UIThunkAction {
  return async (dispatch, getState) => {
    const cx = getContext(getState());
    const source = frame.sourceId
      ? getSourceDetails(getState(), frame.sourceId)
      : getSourceToDisplayForUrl(getState(), frame.url!);
    if (source) {
      dispatch(showSource(cx, source.id, openSourcesTab));
      await dispatch(
        selectSource(
          cx,
          source.id,
          { sourceId: source.id, line: frame.line, column: frame.column },
          openSourcesTab
        )
      );
    }
  };
}
