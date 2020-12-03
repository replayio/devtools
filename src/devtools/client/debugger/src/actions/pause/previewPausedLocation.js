/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { selectLocation } from "../sources";
import { getContext } from "../../selectors";

export function previewPausedLocationBySourceId(location) {
  return ({ dispatch, getState }) => {
    const cx = getContext(getState());

    dispatch(selectLocation(cx, location));

    dispatch({
      type: "PREVIEW_PAUSED_LOCATION",
      location,
    });
  };
}

export function clearPreviewPausedLocation() {
  return {
    type: "CLEAR_PREVIEW_PAUSED_LOCATION",
  };
}
