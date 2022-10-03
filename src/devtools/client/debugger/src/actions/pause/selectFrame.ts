/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIThunkAction } from "ui/actions";
import type { Context } from "devtools/client/debugger/src/reducers/pause";

import { selectLocation } from "../sources";
import { fetchScopes, frameSelected } from "../../reducers/pause";
import { setFramePositions } from "./setFramePositions";
import { SourceLocation } from "../../reducers/types";
import { isCommandError, ProtocolError } from "shared/utils/error";

interface TempFrame {
  id: string;
  asyncIndex: number;
  protocolId: string;
  state: string;
  location: SourceLocation;
}

/**
 * @memberof actions/pause
 * @static
 */
export function selectFrame(cx: Context, frame: TempFrame): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    // Frames that aren't on-stack do not support evalling and may not
    // have live inspectable scopes, so we do not allow selecting them.
    if (frame.state !== "on-stack") {
      return dispatch(selectLocation(cx, frame.location));
    }

    dispatch(frameSelected({ cx, frameId: frame.id }));

    try {
      await ThreadFront.getFrameSteps(frame.asyncIndex, frame.protocolId);
    } catch (e) {
      // TODO [FE-795]: Communicate this to the user
      if (isCommandError(e, ProtocolError.TooManyPoints)) {
        console.error(e);
        return;
      }
      throw e;
    }

    dispatch(selectLocation(cx, frame.location));
    dispatch(setFramePositions());

    dispatch(fetchScopes({ cx }));
  };
}
