/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import {
  getSources,
  getSelectedSource,
  getSourceInSources,
} from "../reducers/sources";
import { getCurrentThreadFrames } from "../reducers/pause";
import { annotateFrames } from "../utils/pause/frames";
import { get } from "lodash";
import type { State, SourceResourceState } from "../reducers/types";
import type { Frame, Source } from "../types";
import { createSelector } from "reselect";

function getLocation(frame) {
  return frame.location;
}

function getSourceForFrame(
  sources: SourceResourceState,
  frame: Frame
) {
  const sourceId = getLocation(frame).sourceId;
  return getSourceInSources(sources, sourceId);
}

function appendSource(
  sources: SourceResourceState,
  frame: Frame,
  selectedSource: ?Source
): Frame {
  return {
    ...frame,
    location: getLocation(frame),
    source: getSourceForFrame(sources, frame),
  };
}

export function formatCallStackFrames(
  frames: Frame[],
  sources: SourceResourceState,
  selectedSource: Source
) {
  if (!frames) {
    return null;
  }

  const formattedFrames: Frame[] = frames
    .filter(frame => getSourceForFrame(sources, frame))
    .map(frame => appendSource(sources, frame, selectedSource))
    .filter(frame => !get(frame, "source.isBlackBoxed"));

  return annotateFrames(formattedFrames);
}

// eslint-disable-next-line
export const getCallStackFrames: State => Frame[] = (createSelector: any)(
  getCurrentThreadFrames,
  getSources,
  getSelectedSource,
  formatCallStackFrames
);
