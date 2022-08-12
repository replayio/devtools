/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIState } from "ui/state";
import type { Dictionary } from "@reduxjs/toolkit";
import type { PauseFrame } from "../reducers/pause";

import { getSourceDetailsEntities, SourceDetails } from "ui/reducers/sources";
import { getFrames } from "../reducers/pause";
import { annotateFrames } from "../utils/pause/frames";
import { createSelector } from "reselect";

function getLocation(frame: PauseFrame) {
  return frame.location;
}

function getSourceForFrame(sources: Dictionary<SourceDetails>, frame: PauseFrame) {
  const sourceId = getLocation(frame).sourceId;
  return sources[sourceId]!;
}

function appendSource(sources: Dictionary<SourceDetails>, frame: PauseFrame) {
  return {
    ...frame,
    location: getLocation(frame),
    source: getSourceForFrame(sources, frame),
  };
}

// But re-exported because it's used elsewhere
export const formatCallStackFrames = (
  frames: PauseFrame[] | null,
  sources: Dictionary<SourceDetails>
) => {
  if (!frames) {
    return null;
  }

  const formattedFrames = frames
    .filter(frame => getSourceForFrame(sources, frame))
    .map(frame => appendSource(sources, frame));

  return annotateFrames(formattedFrames);
};

export const getCallStackFrames = createSelector(
  getFrames,
  getSourceDetailsEntities,
  formatCallStackFrames
);
