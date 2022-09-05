/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
// This module converts Firefox specific types to the generic types

import { WiredFrame } from "protocol/thread/pause";
import { getPreferredLocation, getAlternateLocation } from "ui/reducers/sources";

export async function createFrame(getState: any, frame: WiredFrame, index = 0, asyncIndex = 0) {
  if (!frame) {
    return null;
  }

  const { ThreadFront } = await import("protocol/thread");
  await ThreadFront.ensureAllSources();
  const state = getState();

  const { sourceId, line, column } = getPreferredLocation(
    state,
    frame.location,
    ThreadFront.preferredGeneratedSources
  );
  const location = {
    sourceId,
    line,
    column,
  };

  let alternateLocation;
  const alternate = await getAlternateLocation(
    state,
    frame.location,
    ThreadFront.preferredGeneratedSources
  );
  if (alternate) {
    alternateLocation = {
      sourceId: alternate.sourceId,
      line: alternate.line,
      column: alternate.column,
    };
  }

  const displayName = frame.originalFunctionName || frame.functionName || `(${frame.type})`;

  return {
    id: `${asyncIndex}:${index}`,
    protocolId: frame.frameId,
    asyncIndex,
    displayName,
    location,
    alternateLocation,
    this: frame.this,
    source: null,
    index,
    asyncCause: asyncIndex && index == 0 ? "async" : undefined,
    state: "on-stack",
  };
}
