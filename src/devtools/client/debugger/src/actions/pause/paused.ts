/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIThunkAction } from "ui/actions";

import { getSelectedFrame, getThreadContext } from "../../selectors";
import { getSelectedLocation } from "ui/reducers/sources";

import {
  pauseRequestedAt,
  paused as pausedAction,
  pauseCreationFailed,
  frameSelected,
} from "../../reducers/pause";
import { setFramePositions } from "./setFramePositions";
import { trackEvent } from "ui/utils/telemetry";
import { isPointInLoadingRegion } from "ui/reducers/app";
import { getFramesAsync } from "ui/suspense/frameCache";
import { createFrame } from "../../client/create";

type $FixTypeLater = any;

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

    const pause = ThreadFront.getCurrentPause();

    await pause.createWaiter;

    dispatch(pausedAction({ executionPoint, time, id: pause.pauseId!, frame }));

    const cx = getThreadContext(getState());

    try {
      await pause.createWaiter;
    } catch (e) {
      console.error(e);
      dispatch(pauseCreationFailed(executionPoint));
      return;
    }

    const frames = await getFramesAsync(pause.pauseId!);
    if (!frames?.length) {
      return;
    }
    const topFrame = createFrame(
      getState().sources,
      ThreadFront.preferredGeneratedSources,
      frames[0],
      pause.pauseId!,
      0
    );
    dispatch(frameSelected({ cx, frameId: topFrame.id }));
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

      await dispatch(setFramePositions());
    }
  };
}
