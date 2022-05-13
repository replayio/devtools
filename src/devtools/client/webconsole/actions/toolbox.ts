/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import type { UIThunkAction } from "ui/actions";
import type { ValueFront } from "protocol/thread/value";
import { setSelectedPanel } from "ui/actions/layout";
import { setHoveredItem, clearHoveredItem } from "ui/actions/timeline";
import { isRegionLoaded } from "ui/reducers/app";

type $FixTypeLater = any;

export function highlightDomElement(grip: $FixTypeLater): UIThunkAction {
  return (dispatch, getState, { ThreadFront }) => {
    if (grip.getPause() !== ThreadFront.currentPause) {
      return;
    }

    const highlighter = window.gToolbox.getHighlighter();
    const nodeFront = grip.getNodeFront();
    if (highlighter && nodeFront) {
      highlighter.highlight(nodeFront);
    }
  };
}

export function unHighlightDomElement(): UIThunkAction {
  return () => {
    const highlighter = window.gToolbox.getHighlighter();
    if (highlighter) {
      highlighter.unhighlight();
    }
  };
}

export function openNodeInInspector(valueFront: ValueFront): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { ThreadFront }) => {
    const pause = valueFront.getPause()!;
    if (ThreadFront.currentPause !== pause && isRegionLoaded(getState(), pause.time)) {
      ThreadFront.timeWarpToPause(pause);
    }

    window.gToolbox.selectTool("inspector");
    dispatch(setSelectedPanel("inspector"));

    // @ts-expect-error private field usage?
    const nodeFront = await pause.ensureDOMFrontAndParents(valueFront!._object!.objectId);

    await window.gToolbox.selection.setNodeFront(nodeFront, {
      reason: "console",
    });
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
  frame: $FixTypeLater,
  openSourcesTab: $FixTypeLater
): UIThunkAction {
  return () => {
    window.gToolbox.viewSourceInDebugger(
      frame.url,
      frame.line,
      frame.column,
      frame.sourceId,
      openSourcesTab
    );
  };
}
