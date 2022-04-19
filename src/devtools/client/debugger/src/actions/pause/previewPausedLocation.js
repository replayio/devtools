/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { getContext } from "../../selectors";
import { selectLocation } from "../sources";

//sets pause preview location for frame timeline scrubber
export function setPreviewPausedLocation(location) {
  return (dispatch, getState) => {
    const cx = getContext(getState());

    dispatch(selectLocation(cx, location));

    dispatch({
      location,
      type: "SET_PREVIEW_PAUSED_LOCATION",
    });
  };
}

//clears pause location that is set by the frame timeline scrubber
export function clearPreviewPausedLocation() {
  return {
    type: "CLEAR_PREVIEW_PAUSED_LOCATION",
  };
}
