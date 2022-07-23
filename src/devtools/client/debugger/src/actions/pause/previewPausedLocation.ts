/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIThunkAction } from "ui/actions";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import { SourceLocation } from "../../reducers/types";

import { selectLocation } from "../sources";
import { getContext } from "../../selectors";

//sets pause preview location for frame timeline scrubber
export function setPreviewPausedLocation(location: SourceLocation): UIThunkAction {
  return (dispatch, getState) => {
    const cx = getContext(getState());

    dispatch(selectLocation(cx, location));

    dispatch({
      type: "SET_PREVIEW_PAUSED_LOCATION",
      location,
    });
  };
}

//clears pause location that is set by the frame timeline scrubber
export function clearPreviewPausedLocation() {
  return {
    type: "CLEAR_PREVIEW_PAUSED_LOCATION",
  };
}
