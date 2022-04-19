/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import { trackEvent } from "ui/utils/telemetry";

import { getSelectedFrame, getThreadContext, getSelectedLocation } from "../../selectors";
import { selectLocation } from "../sources";

import { fetchScopes } from "./fetchScopes";
import { setFramePositions } from "./setFramePositions";

// How many times to fetch an async set of parent frames.
const MaxAsyncFrames = 5;

export function fetchFrames(cx) {
  return async function (dispatch, getState, { client }) {
    let frames;
    try {
      frames = await client.getFrames();
    } catch (e) {}
    dispatch({ cx, frames, type: "FETCHED_FRAMES" });
  };
}

function fetchAsyncFrames(cx) {
  return async (dispatch, getState, { client }) => {
    for (let i = 0; i < MaxAsyncFrames; i++) {
      let asyncFrames;
      try {
        asyncFrames = await client.loadAsyncParentFrames(i + 1);
      } catch (e) {
        break;
      }
      if (!asyncFrames.length) {
        break;
      }
      dispatch({ asyncFrames, cx, type: "ADD_ASYNC_FRAMES" });
    }
  };
}

/**
 * Debugger has just paused
 *
 * @param {object} pauseInfo
 * @memberof actions/pause
 * @static
 */
export function paused({ executionPoint, time }) {
  return async function (dispatch, getState) {
    dispatch({ executionPoint, time, type: "PAUSED" });
    trackEvent("paused");

    // Get a context capturing the newly paused and selected thread.
    const cx = getThreadContext(getState());

    await dispatch(fetchFrames(cx));

    const frame = getSelectedFrame(getState());
    if (frame) {
      const currentLocation = getSelectedLocation(getState());
      if (
        !currentLocation ||
        currentLocation.sourceId !== frame.location.sourceId ||
        currentLocation.line !== frame.location.line ||
        currentLocation.column !== frame.location.column
      ) {
        dispatch(selectLocation(cx, frame.location, { remap: true }));
      }

      await Promise.all([
        dispatch(fetchAsyncFrames(cx)),
        dispatch(setFramePositions()),
        dispatch(fetchScopes(cx)),
      ]);
    }
  };
}
