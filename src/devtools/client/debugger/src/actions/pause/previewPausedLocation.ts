/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIThunkAction } from "ui/actions";
import { Location } from "@replayio/protocol";
import { previewLocationUpdated } from "../../reducers/pause";

import { selectLocation } from "../sources";
import { getContext } from "../../selectors";

//sets pause preview location for frame timeline scrubber
export function setPreviewPausedLocation(location: Location): UIThunkAction {
  return (dispatch, getState) => {
    const cx = getContext(getState());

    dispatch(selectLocation(cx, location));

    dispatch(previewLocationUpdated(location));
  };
}
