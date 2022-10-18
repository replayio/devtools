/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIThunkAction } from "ui/actions";
import type { Context, PauseFrame } from "devtools/client/debugger/src/reducers/pause";

import { selectLocation } from "../sources";
import { frameSelected } from "../../reducers/pause";

/**
 * @memberof actions/pause
 * @static
 */
export function selectFrame(cx: Context, frame: PauseFrame): UIThunkAction {
  return async dispatch => {
    dispatch(frameSelected({ cx, pauseId: frame.pauseId, frameId: frame.protocolId }));
    dispatch(selectLocation(cx, frame.location));
  };
}
