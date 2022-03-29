/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { ThreadFront } from "protocol/thread";
import { setSelectedPanel } from "ui/actions/layout";
import { setHoveredItem, clearHoveredItem } from "ui/actions/timeline";
import { isRegionLoaded } from "ui/reducers/app";

export function highlightDomElement(grip) {
  return async () => {
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

export function unHighlightDomElement(grip) {
  return () => {
    const highlighter = window.gToolbox.getHighlighter();
    if (highlighter) {
      highlighter.unhighlight(grip);
    }
  };
}

export function openNodeInInspector(valueFront) {
  return async (dispatch, getState) => {
    const pause = valueFront.getPause();
    if (ThreadFront.currentPause !== pause && isRegionLoaded(getState(), pause.time)) {
      ThreadFront.timeWarpToPause(pause);
    }

    window.gToolbox.selectTool("inspector", "inspect_dom");
    dispatch(setSelectedPanel("inspector"));

    const nodeFront = await pause.ensureDOMFrontAndParents(valueFront._object.objectId);

    await window.gToolbox.selection.setNodeFront(nodeFront, {
      reason: "console",
    });
  };
}

export function onMessageHover(type, message) {
  return dispatch => {
    if (type == "mouseenter") {
      const hoveredItem = {
        target: "console",
        point: message.executionPoint,
        time: message.executionPointTime,
        location: message.frame,
      };
      dispatch(setHoveredItem(hoveredItem));
    }
    if (type == "mouseleave") {
      dispatch(clearHoveredItem);
    }
  };
}

export function onViewSourceInDebugger(frame, openSourcesTab) {
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
