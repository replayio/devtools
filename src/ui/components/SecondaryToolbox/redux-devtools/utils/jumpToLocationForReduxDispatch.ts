import { ExecutionPoint } from "@replayio/protocol";

import { UIThunkAction } from "ui/actions";
import { seek } from "ui/actions/timeline";
import { reduxDispatchJumpLocationCache } from "ui/suspense/jumpToLocationCache";

export function jumpToLocationForReduxDispatch(point: ExecutionPoint, time: number): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    const jumpLocation = await reduxDispatchJumpLocationCache.readAsync(replayClient, point, time);

    if (jumpLocation) {
      dispatch(
        seek({ executionPoint: jumpLocation.point, openSource: true, time: jumpLocation.time })
      );
    }
  };
}
