/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { getSources, getSelectedSource, getSourceInSources } from "../reducers/sources";
import { getFrames } from "../reducers/pause";
import { annotateFrames } from "../utils/pause/frames";
import get from "lodash/get";
import { createSelector } from "reselect";

function getLocation(frame) {
  return frame.location;
}

function getSourceForFrame(sources, frame) {
  const sourceId = getLocation(frame).sourceId;
  return getSourceInSources(sources, sourceId);
}

function appendSource(sources, frame, selectedSource) {
  return {
    ...frame,
    location: getLocation(frame),
    source: getSourceForFrame(sources, frame),
  };
}

export function formatCallStackFrames(frames, sources, selectedSource) {
  if (!frames) {
    return null;
  }

  const formattedFrames = frames
    .filter(frame => getSourceForFrame(sources, frame))
    .map(frame => appendSource(sources, frame, selectedSource))
    .filter(frame => !get(frame, "source.isBlackBoxed"));

  return annotateFrames(formattedFrames);
}

// eslint-disable-next-line
export const getCallStackFrames = createSelector(
  getFrames,
  getSources,
  getSelectedSource,
  formatCallStackFrames
);
