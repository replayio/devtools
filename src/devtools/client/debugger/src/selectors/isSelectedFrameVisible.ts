/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIState } from "ui/state";

import { getSelectedLocation } from "ui/reducers/sources";

import { getSelectedFrameAsync } from "../selectors/pause";

/*
 * Checks to if the selected frame's source is currently
 * selected.
 */
export async function isSelectedFrameVisible(state: UIState) {
  const selectedLocation = getSelectedLocation(state);
  const selectedFrame = await getSelectedFrameAsync(state);

  if (!selectedFrame || !selectedLocation) {
    return false;
  }

  return selectedLocation.sourceId === selectedFrame.location.sourceId;
}
