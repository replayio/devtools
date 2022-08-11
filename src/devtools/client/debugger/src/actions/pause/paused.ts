/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIThunkAction } from "ui/actions";

import { getSelectedFrame, getThreadContext } from "../../selectors";
import { getSelectedLocation } from "ui/reducers/sources";

import {
  fetchScopes,
  pauseRequestedAt,
  paused as pausedAction,
  fetchFrames,
  fetchAsyncFrames,
  pauseCreationFailed,
} from "../../reducers/pause";
import { setFramePositions } from "./setFramePositions";
import { trackEvent } from "ui/utils/telemetry";
import { isPointInLoadingRegion } from "ui/reducers/app";

type $FixTypeLater = any;

/**
 * Debugger has just paused
 *
 * @param {object} pauseInfo
 * @memberof actions/pause
 * @static
 */
export function paused({
  executionPoint,
  frame,
  time,
}: {
  executionPoint: string;
  frame?: $FixTypeLater;
  time?: number;
}): UIThunkAction {
  return async function (dispatch, getState, { ThreadFront }) {
    dispatch(pauseRequestedAt());

    if (!isPointInLoadingRegion(getState(), executionPoint)) {
      dispatch(pauseCreationFailed(executionPoint));
    }

    trackEvent("paused");

    // @ts-expect-error optional time mismatch
    const pause = ThreadFront.ensurePause(executionPoint, time);

    dispatch(pausedAction({ executionPoint, time, id: pause.pauseId!, frame }));

    const cx = getThreadContext(getState());

    try {
      await pause.createWaiter;
    } catch (e) {
      console.error(e);
      dispatch(pauseCreationFailed(executionPoint));
      dispatch(fetchFrames.rejected(null, "", { cx, pauseId: pause.pauseId! }));
      return;
    }

    await dispatch(fetchFrames({ cx, pauseId: pause.pauseId! }));

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
        dispatch(selectLocation(cx, selectedFrame.location, true));
      }

      if (pause !== ThreadFront.currentPause) {
        return;
      }

      await Promise.all([
        dispatch(fetchAsyncFrames({ cx })),
        dispatch(setFramePositions()),
        dispatch(fetchScopes({ cx })),
      ]);
    }
  };
}
