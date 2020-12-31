/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { ThreadFront } from "protocol/thread";
import { setTimelineState } from "ui/actions/timeline";
import { paintGraphicsAtTime } from "protocol/graphics";

export function highlightDomElement(grip) {
  return ({ toolbox }) => {
    const highlighter = toolbox.getHighlighter();
    if (highlighter) {
      highlighter.highlight(grip);
    }
  };
}

export function unHighlightDomElement(grip) {
  return ({ toolbox }) => {
    const highlighter = toolbox.getHighlighter();
    if (highlighter) {
      highlighter.unhighlight(grip);
    }
  };
}

export function openNodeInInspector(valueFront) {
  return async ({ toolbox }) => {
    const pause = valueFront.getPause();
    if (ThreadFront.currentPause !== pause) {
      ThreadFront.timeWarpToPause(pause);
    }

    toolbox.selectTool("inspector", "inspect_dom");

    const nodeFront = await pause.ensureDOMFrontAndParents(valueFront._object.objectId);
    await nodeFront.ensureLoaded();

    await toolbox.selection.setNodeFront(nodeFront, {
      reason: "console",
    });
  };
}

export function onMessageHover(type, message) {
  return ({ dispatch }) => {
    if (type == "mouseenter") {
      dispatch(setTimelineState({ hoveredMessageId: message.id }));
      paintGraphicsAtTime(message.executionPointTime);
    }
    if (type == "mouseleave") {
      dispatch(setTimelineState({ hoveredMessageId: null }));
      paintGraphicsAtTime(message.executionPointTime);
    }
  };
}

export function onViewSourceInDebugger(frame) {
  return ({ toolbox }) => {
    toolbox.viewSourceInDebugger(frame.url, frame.line, frame.column, frame.sourceId);
  };
}

export function closeSplitConsole() {
  return ({ toolbox }) => {
    toolbox.toggleSplitConsole(false);
  };
}
