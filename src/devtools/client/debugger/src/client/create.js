/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
// This module converts Firefox specific types to the generic types

export async function createFrame(frame, index = 0, asyncIndex = 0) {
  if (!frame) {
    return null;
  }

  const { clientCommands } = await import("./commands");
  const { ThreadFront } = await import("protocol/thread");

  const { sourceId, line, column } = await ThreadFront.getPreferredLocation(frame.location);
  const location = {
    sourceId: clientCommands.getSourceForActor(sourceId),
    line,
    column,
  };

  let alternateLocation;
  const alternate = await ThreadFront.getAlternateLocation(frame.location);
  if (alternate) {
    alternateLocation = {
      sourceId: clientCommands.getSourceForActor(alternate.sourceId),
      line: alternate.line,
      column: alternate.column,
    };
  }

  let originalFunctionName;
  const scopes = await ThreadFront.getScopes(asyncIndex, frame.frameId);
  if (!scopes.originalScopesUnavailable) {
    originalFunctionName = scopes.scopes.find(scope => scope.functionName)?.functionName;
  }
  const displayName = originalFunctionName || frame.functionName || `(${frame.type})`;

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

export function makeSourceId(source, isServiceWorker) {
  return source.actor;
}

export function createPause(packet) {
  return {
    ...packet,
    frame: createFrame(packet.frame),
    executionPoint: packet.executionPoint,
  };
}
