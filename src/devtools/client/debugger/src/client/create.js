/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
// This module converts Firefox specific types to the generic types

import { clientCommands } from "./commands";

const { ThreadFront } = require("protocol/thread");

export function prepareSourcePayload(source) {
  clientCommands.registerSourceActor(source.actor, makeSourceId(source, false));
  return { source, thread: ThreadFront.actor };
}

export async function createFrame(frame, index = 0, asyncIndex = 0) {
  if (!frame) {
    return null;
  }

  const { sourceId, line, column } = await ThreadFront.getPreferredLocation(frame.location);
  const location = {
    column,
    line,
    sourceId: clientCommands.getSourceForActor(sourceId),
  };

  let alternateLocation;
  const alternate = await ThreadFront.getAlternateLocation(frame.location);
  if (alternate) {
    alternateLocation = {
      column: alternate.column,
      line: alternate.line,
      sourceId: clientCommands.getSourceForActor(alternate.sourceId),
    };
  }

  const displayName = frame.functionName || `(${frame.type})`;

  return {
    alternateLocation,
    asyncCause: asyncIndex && index == 0 ? "async" : undefined,
    asyncIndex,
    displayName,
    id: `${asyncIndex}:${index}`,
    index,
    location,
    protocolId: frame.frameId,
    source: null,
    state: "on-stack",
    this: frame.this,
  };
}

export function makeSourceId(source, isServiceWorker) {
  return source.actor;
}

export function createPause(packet) {
  return {
    ...packet,
    executionPoint: packet.executionPoint,
    frame: createFrame(packet.frame),
  };
}
