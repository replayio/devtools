/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import { getSelectedFrame, getThreadContext, getSelectedLocation } from "../../selectors";

import { selectLocation } from "../sources";
import { fetchScopes } from "./fetchScopes";
import { setFramePositions } from "./setFramePositions";
import { trackEvent } from "ui/utils/telemetry";

// How many times to fetch an async set of parent frames.
const MaxAsyncFrames = 5;

export function fetchFrames(cx) {
  return async function (dispatch, getState, { client }) {
    let frames;
    try {
      frames = await client.getFrames();
    } catch (e) {}
    dispatch({ type: "FETCHED_FRAMES", frames, cx });
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
      dispatch({ type: "ADD_ASYNC_FRAMES", asyncFrames, cx });
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
    dispatch({ type: "PAUSED", executionPoint, time });
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
