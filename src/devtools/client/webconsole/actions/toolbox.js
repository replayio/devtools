/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { ThreadFront, Pause } from "protocol/thread";

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

    const onSelectInspector = toolbox.selectTool("inspector", "inspect_dom");

    const onNodeFront = valueFront
      .getPause()
      .ensureDOMFrontAndParents(valueFront._object.objectId)
      .then(async nf => {
        await nf.ensureParentsLoaded();
        return nf;
      });

    const [nodeFront] = await Promise.all([onNodeFront, onSelectInspector]);

    await toolbox.selection.setNodeFront(nodeFront, {
      reason: "console",
    });
  };
}

export function onMessageHover(type, message) {
  return ({ toolbox }) => {
    toolbox.emit("message-hover", type, message);
  };
}

export function jumpToExecutionPoint(point, time, hasFrames, pauseId) {
  return ({ toolbox }) => {
    const pause = Pause.getById(pauseId);
    if (pause) {
      toolbox.threadFront.timeWarpToPause(pause);
    } else {
      toolbox.threadFront.timeWarp(point, time, hasFrames);
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
