/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow
// This module converts Firefox specific types to the generic types

import type { Frame, ThreadId, GeneratedSourceData, Thread } from "../../types";
import type { PausedPacket, FrameFront, SourcePayload, Target } from "./types";

import { clientCommands } from "./commands";

const { ThreadFront } = require("protocol/thread");

export function prepareSourcePayload(threadFront, source: SourcePayload): GeneratedSourceData {
  // We populate the set of sources as soon as we hear about them. Note that
  // this means that we have seen an actor, but it might still be in the
  // debounced queue for creation, so the Redux store itself might not have
  // a source actor with this ID yet.
  clientCommands.registerSourceActor(source.actor, makeSourceId(source, false));

  return { thread: threadFront.actor, source };
}

export async function createFrame(thread: ThreadId, frame, index = 0, asyncIndex = 0): ?Frame {
  if (!frame) {
    return null;
  }

  const { scriptId, line, column } = await ThreadFront.getPreferredLocation(frame.location);
  const location = {
    sourceId: clientCommands.getSourceForActor(scriptId),
    line,
    column,
  };

  let alternateLocation;
  const alternate = await ThreadFront.getAlternateLocation(frame.location);
  if (alternate) {
    alternateLocation = {
      sourceId: clientCommands.getSourceForActor(alternate.scriptId),
      line: alternate.line,
      column: alternate.column,
    };
  }

  const displayName = frame.functionName || `(${frame.type})`;

  return {
    id: `${asyncIndex}:${index}`,
    protocolId: frame.frameId,
    asyncIndex,
    thread,
    displayName,
    location,
    alternateLocation,
    this: frame.this,
    source: null,
    index,
    asyncCause: (asyncIndex && index == 0) ? "async" : undefined,
    state: "on-stack",
  };
}

export function makeSourceId(source: SourcePayload, isServiceWorker: boolean) {
  return source.actor;
}

export function createPause(thread: string, packet: PausedPacket): any {
  return {
    ...packet,
    thread,
    frame: createFrame(thread, packet.frame),
    executionPoint: packet.executionPoint,
  };
}

function getTargetType(target: Target) {
  if (target.isWorkerTarget) {
    return "worker";
  }

  if (target.isContentProcess) {
    return "contentProcess";
  }

  return "mainThread";
}

export function createThread(actor: string, target: Target): Thread {
  return {
    actor,
    url: target.url,
    type: getTargetType(target),
    name: target.name,
    serviceWorkerStatus: target.debuggerServiceWorkerStatus,
  };
}
