/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { isConsole } from "../utils/preview";
import { getExpressionFromCoords } from "../utils/editor/get-expression";
import { createPrimitiveValueFront } from "protocol/thread";

import {
  getPreview,
  isSelectedFrameVisible,
  getSelectedSource,
  getSelectedFrame,
} from "../selectors";
import { uniqueId } from "lodash";

export function updatePreview(cx, target, tokenPos, codeMirror) {
  return ({ dispatch, getState }) => {
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
  return async ({ dispatch, getState, client, sourceMaps }) => {
    const previewId = uniqueId();

    dispatch({
      type: "START_PREVIEW",
      value: {
        previewId,
        expression,
        target,
      },
    });

    const source = getSelectedSource(getState());
    if (!source) {
      return;
    }

    const selectedFrame = getSelectedFrame(getState());

    if (!selectedFrame) {
      return;
    }

    let { result } = await client.evaluate(expression, {
      asyncIndex: selectedFrame.asyncIndex,
      frameId: selectedFrame.protocolId,
    });

    if (result === undefined) {
      result = createPrimitiveValueFront(undefined);
    }

    const root = {
      name: expression,
      path: expression,
      contents: result,
    };
    const properties = await client.loadObjectProperties(root);

    const currentTarget = getPreview(getState())?.target;
    // Don't finish dispatching if another setPreview was started
    if (currentTarget !== target) {
      return;
    }

    // The first time a popup is rendered, the mouse should be hovered
    // on the token. If it happens to be hovered on whitespace, it should
    // not render anything
    if (!window.elementIsHovered(target)) {
      dispatch(clearPreview(cx, previewId));
      return;
    }

    dispatch({
      type: "SET_PREVIEW",
      cx,
      value: {
        previewId,
        expression,
        resultGrip: result,
        properties,
        root,
        location,
        tokenPos,
        cursorPos,
        target,
      },
    });
  };
}

export function clearPreview(cx, previewId) {
  return ({ dispatch, getState }) => {
    const currentSelection = getPreview(getState());
    if (!currentSelection || currentSelection.previewId !== previewId) {
      return;
    }

    return dispatch({
      type: "CLEAR_PREVIEW",
      cx,
    });
  };
}
