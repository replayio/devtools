/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
// This module converts Firefox specific types to the generic types

import { Frame, PauseId } from "@replayio/protocol";

import { SourcesState, getAlternateLocation, getPreferredLocation } from "ui/reducers/sources";

import { PauseFrame } from "../reducers/pause";

export function createFrame(
  sources: SourcesState,
  frame: Frame,
  pauseId: PauseId,
  index = 0
): PauseFrame {
  const { sourceId, line, column } = getPreferredLocation(sources, frame.location);
  const location = {
    sourceId,
    line,
    column,
  };

  let alternateLocation;
  const alternate = getAlternateLocation(sources, frame.location);
  if (alternate) {
    alternateLocation = {
      sourceId: alternate.sourceId,
      line: alternate.line,
      column: alternate.column,
    };
  }

  const displayName = frame.originalFunctionName || frame.functionName || `(${frame.type})`;

  return {
    id: `${pauseId}:${frame.frameId}`,
    pauseId,
    protocolId: frame.frameId,
    index,
    displayName,
    location,
    alternateLocation,
    this: frame.this,
    source: null,
  };
}
