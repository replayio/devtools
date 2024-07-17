import { Location, TimeStampedPoint } from "@replayio/protocol";

import { selectLocation } from "devtools/client/debugger/src/actions/sources";
import { frameSelected, getThreadContext } from "devtools/client/debugger/src/selectors";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { UIThunkAction } from "ui/actions";

export function selectDependencyGraphNode(
  location: Location,
  timeStampedPoint: TimeStampedPoint
): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    const pauseId = await pauseIdCache.readAsync(
      replayClient,
      timeStampedPoint.point,
      timeStampedPoint.time
    );

    const context = getThreadContext(getState());

    dispatch(frameSelected({ cx: context, pauseId, frameId: "0" }));
    dispatch(selectLocation(context, location));
  };
}
