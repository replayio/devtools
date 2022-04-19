//
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
import { createSelector } from "reselect";
import type { UIState } from "ui/state";

export function getSelectedFrame(state: UIState) {
  const { selectedFrameId, frames } = state.pause;
  if (!selectedFrameId || !frames) {
    return null;
  }

  return frames.find(frame => frame.id == selectedFrameId) || null;
}

export const getVisibleSelectedFrame = createSelector(getSelectedFrame, selectedFrame => {
  if (!selectedFrame) {
    return null;
  }

  const { id, displayName } = selectedFrame;

  return {
    displayName,
    id,
    location: selectedFrame.location,
  };
});

export function getFramePositions(state: UIState) {
  return state.pause.replayFramePositions;
}
