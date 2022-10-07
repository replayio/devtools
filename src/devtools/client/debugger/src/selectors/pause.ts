//
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
import type { UIState } from "ui/state";

import { createSelector } from "reselect";

import { getPauseId, getSelectedFrameId } from "../reducers/pause";
import { getAllCachedPauseFrames } from "../utils/frames";

export function getSelectedFrame(state: UIState) {
  const pauseId = getPauseId(state);
  const selectedFrameId = getSelectedFrameId(state);
  const frames = getAllCachedPauseFrames(pauseId, state.sources);
  if (!selectedFrameId || !frames) {
    return null;
  }

  return frames!.find(frame => frame.id == selectedFrameId) || null;
}

export const getVisibleSelectedFrame = createSelector(getSelectedFrame, selectedFrame => {
  if (!selectedFrame) {
    return null;
  }

  const { id, displayName } = selectedFrame;

  return {
    id,
    displayName,
    location: selectedFrame.location,
  };
});

export function getFramePositions(state: UIState) {
  return state.pause.replayFramePositions;
}
