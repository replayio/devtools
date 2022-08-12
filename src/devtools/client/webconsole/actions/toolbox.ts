/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import type { ValueFront } from "protocol/thread/value";
import type { UIThunkAction } from "ui/actions";
import { setSelectedPanel } from "ui/actions/layout";
import { setHoveredItem, clearHoveredItem } from "ui/actions/timeline";
import { isRegionLoaded } from "ui/reducers/app";
import { selectSource } from "devtools/client/debugger/src/actions/sources";
import { showSource } from "devtools/client/debugger/src/actions/ui";
import { getContext } from "devtools/client/debugger/src/selectors";
import { getSourceDetails, getSourceToDisplayForUrl } from "ui/reducers/sources";
import { openSourceLink } from "devtools/client/debugger/src/actions/ui";

type $FixTypeLater = any;

export function highlightDomElement(grip: $FixTypeLater): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    if (grip.getPause() !== ThreadFront.currentPause) {
      return;
    }

    const { highlighter } = await import("highlighter/highlighter");
    const nodeFront = grip.getNodeFront();
    if (highlighter && nodeFront) {
      highlighter.highlight(nodeFront);
    }
  };
}

export function unHighlightDomElement(): UIThunkAction {
  return async () => {
    const { highlighter } = await import("highlighter/highlighter");

    if (highlighter) {
      highlighter.unhighlight();
    }
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

export function openNodeInInspector(
  valueFront: ValueFront,
  reason: "console" | "debugger" = "console"
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { ThreadFront }) => {
    const pause = valueFront.getPause()!;
    if (ThreadFront.currentPause !== pause && isRegionLoaded(getState(), pause.time)) {
      ThreadFront.timeWarpToPause(pause);
    }

    dispatch(setSelectedPanel("inspector"));

    // @ts-expect-error private field usage?
    const nodeFront = await pause.ensureDOMFrontAndParents(valueFront!._object!.objectId);

    const { selection } = await import("devtools/client/framework/selection");
    await selection.setNodeFront(nodeFront, {
      reason,
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
