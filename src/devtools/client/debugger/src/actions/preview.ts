/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { SourceLocation } from "@replayio/protocol";
import { ValueItem } from "devtools/packages/devtools-reps";
import { createPrimitiveValueFront } from "protocol/thread";
import { isCurrentTimeInLoadedRegion } from "ui/reducers/app";
import type { UIThunkAction } from "ui/actions";
import type { Context } from "devtools/client/debugger/src/reducers/pause";

import { getExpressionFromCoords } from "../utils/editor/get-expression";
import { isConsole } from "../utils/preview";
import { getPreview, isSelectedFrameVisible, getSelectedFrame } from "../selectors";
import { getSelectedSource } from "ui/reducers/sources";

type $FixTypeLater = any;

export function updatePreview(
  cx: Context,
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

export function setPreview(
  cx: Context,
  expression: string,
  location: { start: SourceLocation; end: SourceLocation },
  tokenPos: SourceLocation,
  cursorPos: DOMRect,
  target: HTMLElement
): UIThunkAction {
  return async (dispatch, getState, { client }) => {
    dispatch({
      type: "START_PREVIEW",
      value: {
        cursorPos,
        expression,
        location,
        target,
        tokenPos,
      },
    });

    const { previewId } = getPreview(getState())!;

    const source = getSelectedSource(getState());
    if (!source) {
      clearPreview(cx, previewId);
      return;
    }

    const selectedFrame = getSelectedFrame(getState());
    if (!selectedFrame) {
      clearPreview(cx, previewId);
      return;
    }

    let { result } = await client.evaluate(expression, {
      asyncIndex: selectedFrame.asyncIndex,
      frameId: selectedFrame.protocolId,
    });

    if (result === undefined) {
      result = createPrimitiveValueFront(undefined);
    }

    let root = new ValueItem({
      name: expression,
      path: expression,
      contents: result,
    });
    await root.loadChildren();
    // recreate the ValueItem to update its loading state
    root = root.recreate();

    // The first time a popup is rendered, the mouse should be hovered
    // on the token. If it happens to be hovered on whitespace, it should
    // not render anything
    if (!window.elementIsHovered(target)) {
      dispatch(clearPreview(cx, previewId));
      return;
    }

    dispatch({
      type: "COMPLETE_PREVIEW",
      cx,
      previewId,
      value: {
        resultGrip: result,
        root,
      },
    });
  };
}

export function clearPreview(cx: Context, previewId: string) {
  return {
    type: "CLEAR_PREVIEW",
    cx,
    previewId,
  };
}
