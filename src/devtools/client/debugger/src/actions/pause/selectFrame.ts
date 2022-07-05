/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIThunkAction } from "ui/actions";
import type { Context } from "devtools/client/debugger/src/reducers/pause";

import { selectLocation } from "../sources";
import { fetchScopes } from "./fetchScopes";
import { setFramePositions } from "./setFramePositions";
import { SourceLocation } from "../../reducers/types";

interface TempFrame {
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
  return async (dispatch, getState, { client }) => {
    // Frames that aren't on-stack do not support evalling and may not
    // have live inspectable scopes, so we do not allow selecting them.
    if (frame.state !== "on-stack") {
      // @ts-expect-error sourcelocation mismatch
      return dispatch(selectLocation(cx, frame.location));
    }

    dispatch({
      type: "SELECT_FRAME",
      cx,
      frame,
    });

    client.fetchAncestorFramePositions(frame.asyncIndex, frame.protocolId);

    // @ts-expect-error sourcelocation mismatch
    dispatch(selectLocation(cx, frame.location));
    dispatch(setFramePositions());

    dispatch(fetchScopes(cx));
  };
}
