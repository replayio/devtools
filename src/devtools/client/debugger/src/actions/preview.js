/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { ValueItem } from "devtools/packages/devtools-reps";
import { createPrimitiveValueFront } from "protocol/thread";

import {
  getPreview,
  isSelectedFrameVisible,
  getSelectedSource,
  getSelectedFrame,
} from "../selectors";
import { getExpressionFromCoords } from "../utils/editor/get-expression";
import { isConsole } from "../utils/preview";

export function updatePreview(cx, target, tokenPos, codeMirror) {
  return (dispatch, getState) => {
    const cursorPos = target.getBoundingClientRect();

    if (!isSelectedFrameVisible(getState())) {
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

export function setPreview(cx, expression, location, tokenPos, cursorPos, target) {
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

    const { previewId } = getPreview(getState());

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

    const root = new ValueItem({
      contents: result,
      name: expression,
      path: expression,
    });
    await root.loadChildren();

    // The first time a popup is rendered, the mouse should be hovered
    // on the token. If it happens to be hovered on whitespace, it should
    // not render anything
    if (!window.elementIsHovered(target)) {
      dispatch(clearPreview(cx, previewId));
      return;
    }

    dispatch({
      cx,
      previewId,
      type: "COMPLETE_PREVIEW",
      value: {
        resultGrip: result,
        root,
      },
    });
  };
}

export function clearPreview(cx, previewId) {
  return (dispatch, getState) => {
    return dispatch({
      cx,
      previewId,
      type: "CLEAR_PREVIEW",
    });
  };
}
