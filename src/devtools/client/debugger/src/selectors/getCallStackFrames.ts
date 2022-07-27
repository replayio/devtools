/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIState } from "ui/state";
import type { Dictionary } from "@reduxjs/toolkit";
import type { SelectedFrame } from "../reducers/pause";

import { getSourceDetailsEntities, SourceDetails } from "ui/reducers/sources";
import { getFrames } from "../reducers/pause";
import { annotateFrames } from "../utils/pause/frames";
import get from "lodash/get";
import { createSelector } from "reselect";

function getLocation(frame: SelectedFrame) {
  return frame.location;
}

function getSourceForFrame(sources: Dictionary<SourceDetails>, frame: SelectedFrame) {
  const sourceId = getLocation(frame).sourceId;
  return sources[sourceId]!;
}

function appendSource(sources: Dictionary<SourceDetails>, frame: SelectedFrame) {
  return {
    ...frame,
    location: getLocation(frame),
    source: getSourceForFrame(sources, frame),
  };
}

// eslint-disable-next-line
export const getCallStackFrames = createSelector(
  getFrames,
  getSourceDetailsEntities,
  (frames, sources) => {
    if (!frames) {
      return null;
    }

    // TODO re-enable blackboxing
    const formattedFrames = frames
      .filter(frame => getSourceForFrame(sources, frame))
      .map(frame => appendSource(sources, frame))
      .filter(frame => !get(frame, "source.isBlackBoxed"));

    return annotateFrames(formattedFrames);
  }
);

// But re-exported because it's used elsewhere
export const formatCallStackFrames = getCallStackFrames.resultFunc;
