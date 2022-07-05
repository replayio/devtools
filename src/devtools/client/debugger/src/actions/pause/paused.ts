/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import { getSelectedFrame, getThreadContext, getSelectedLocation } from "../../selectors";

import { fetchScopes } from "./fetchScopes";
import { setFramePositions } from "./setFramePositions";
import { trackEvent } from "ui/utils/telemetry";
import { isPointInLoadedRegion } from "ui/reducers/app";

// How many times to fetch an async set of parent frames.
const MaxAsyncFrames = 5;

function failedToFetchFrames(cx, pauseId) {
  return { type: "FAILED_TO_FETCH_FRAMES", pauseId, cx };
}

function failedToCreatePause(executionPoint, pauseId) {
  return { type: "FAILED_TO_CREATE_PAUSE", executionPoint, pauseId };
}

export function fetchFrames(cx, pause) {
  return async function (dispatch, getState, { client }) {
    let frames;
    try {
      frames = await client.getFrames();
      dispatch({ type: "FETCHED_FRAMES", frames, pauseId: pause.id });
    } catch (e) {
      console.error(e);
      dispatch(failedToFetchFrames(cx, pause.id));
    }
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

function pauseRequestedAt(executionPoint) {
  return { type: "PAUSE_REQUESTED_AT", executionPoint };
}

/**
 * Debugger has just paused
 *
 * @param {object} pauseInfo
 * @memberof actions/pause
 * @static
 */
export function paused({ executionPoint, frame, time }) {
  return async function (dispatch, getState, { ThreadFront }) {
    dispatch(pauseRequestedAt(executionPoint));

    if (!isPointInLoadedRegion(getState(), executionPoint)) {
      return;
    }

    trackEvent("paused");

    const pause = ThreadFront.ensurePause(executionPoint, time);

    dispatch({ type: "PAUSED", executionPoint, time, id: pause.id, frame });

    const cx = getThreadContext(getState());

    try {
      await pause.createWaiter;
    } catch (e) {
      console.error(e);
      dispatch(failedToCreatePause(pause.id));
      dispatch(failedToFetchFrames(pause.id));
      return;
    }

    await dispatch(fetchFrames(cx, pause));

    const selectedFrame = frame || getSelectedFrame(getState());
    if (selectedFrame) {
      const currentLocation = getSelectedLocation(getState());
      if (
        !currentLocation ||
        currentLocation.sourceId !== selectedFrame.location.sourceId ||
        currentLocation.line !== selectedFrame.location.line ||
        currentLocation.column !== selectedFrame.location.column
      ) {
        const { selectLocation } = await import("../sources");
        dispatch(selectLocation(cx, selectedFrame.location, { remap: true }));
      }

      await Promise.all([
        dispatch(fetchAsyncFrames(cx)),
        dispatch(setFramePositions()),
        dispatch(fetchScopes(cx)),
      ]);
    }
  };
}
