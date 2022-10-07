/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { SourceLocation } from "@replayio/protocol";
import { nanoid } from "@reduxjs/toolkit";
import { isCurrentTimeInLoadedRegion } from "ui/reducers/app";
import type { UIThunkAction } from "ui/actions";
import type { ThreadContext } from "devtools/client/debugger/src/reducers/pause";

import { getExpressionFromCoords } from "../utils/editor/get-expression";
import { isSelectedFrameVisible, getSelectedFrame } from "../selectors";
import { getSelectedSource } from "ui/reducers/sources";
import { getPreview, previewCleared, previewStarted, previewLoaded } from "../reducers/preview";

export function isConsole(expression: string) {
  return /^console/.test(expression);
}

type $FixTypeLater = any;

export function updatePreview(
  cx: ThreadContext,
  target: HTMLElement,
  tokenPos: SourceLocation,
  codeMirror: $FixTypeLater
): UIThunkAction {
  return (dispatch, getState) => {
    const cursorPos = target.getBoundingClientRect();

    const state = getState();
    if (!isCurrentTimeInLoadedRegion(state) || !isSelectedFrameVisible(state)) {
      return;
    }

    const match = getExpressionFromCoords(codeMirror, tokenPos);
    if (!match) {
      return;
    }

    const { expression, location } = match;

    if (isConsole(expression)) {
      return;
    }

    dispatch(setPreview(cx, expression, location, tokenPos, cursorPos, target));
  };
}

export interface EvaluateOptions {
  asyncIndex?: number;
  frameId?: string;
}

export function setPreview(
  cx: ThreadContext,
  expression: string,
  location: { start: SourceLocation; end: SourceLocation },
  tokenPos: SourceLocation,
  cursorPos: DOMRect,
  target: HTMLElement
): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    dispatch(
      previewStarted({
        // TODO DOMRects shouldn't be in Redux
        cursorPos,
        expression,
        location,
        tokenPos,
        previewId: nanoid(),
      })
    );

    const { previewId } = getPreview(getState())!;

    const source = getSelectedSource(getState());
    if (!source) {
      dispatch(previewCleared({ cx, previewId }));
      return;
    }

    const selectedFrame = getSelectedFrame(getState());
    if (!selectedFrame) {
      dispatch(previewCleared({ cx, previewId }));
      return;
    }

    const { returned } = await ThreadFront.evaluateNew({
      pauseId: selectedFrame.pauseId,
      frameId: selectedFrame.protocolId,
      text: expression,
    });

    let protocolValue = returned;

    if (returned === undefined) {
      // Per `protocol.ts`, the backend seems to represent undefined as an empty object or similar
      protocolValue = {};
    } else if (typeof returned !== "object") {
      // must be a primitive - wrap this in an object so it can be parsed later
      // don't _think_ this will happen, but just in case
      protocolValue = {
        value: returned,
      };
    }

    // The first time a popup is rendered, the mouse should be hovered
    // on the token. If it happens to be hovered on whitespace, it should
    // not render anything
    if (!window.elementIsHovered(target)) {
      dispatch(previewCleared({ cx, previewId }));
      return;
    }

    dispatch(previewLoaded({ cx, previewId, value: protocolValue }));
  };
}
