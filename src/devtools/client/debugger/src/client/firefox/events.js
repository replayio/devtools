/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import Actions from "../../actions";

import { createPause, prepareSourcePayload, createFrame } from "./create";
import { clientCommands } from "./commands";
import sourceQueue from "../../utils/source-queue";
import { prefs, features } from "../../utils/prefs";

const {
  WorkersListener,
  // $FlowIgnore
} = require("devtools/client/shared/workers-listener.js");

const { ThreadFront } = require("protocol/thread");
const { log } = require("protocol/socket");

let actions;
let isInterrupted;
let panel;

function addThreadEventListeners(thread) {
  const removeListeners = [];
  threadFrontListeners.set(thread, removeListeners);
  thread.replayFetchPreloadedData();
}

function setupEvents(dependencies) {
  const { devToolsClient } = dependencies;
  actions = dependencies.actions;
  panel = dependencies.panel;
  sourceQueue.initialize(actions);

  Object.keys(clientEvents).forEach(eventName => {
    ThreadFront.on(eventName, clientEvents[eventName].bind(null, ThreadFront));
  });
}

function removeEventsTopTarget(targetFront) {
  targetFront.off("workerListChanged", threadListChanged);
  removeThreadEventListeners(targetFront.threadFront);
  workersListener.removeListener();
}

async function paused(threadFront, { point }) {
  log("ThreadFront.paused");
  actions.paused({ thread: threadFront.actor, executionPoint: point });
}

function resumed(threadFront) {
  // NOTE: the client suppresses resumed events while interrupted
  // to prevent unintentional behavior.
  // see [client docs](../README.md#interrupted) for more information.
  if (isInterrupted) {
    isInterrupted = false;
    return;
  }

  actions.resumed(threadFront.actor);
}

function newSource(threadFront, { source }) {
  sourceQueue.queue({
    type: "generated",
    data: prepareSourcePayload(threadFront, source),
  });
}

function threadListChanged() {
  actions.updateThreads();
}

function replayFramePositions(threadFront, { positions, unexecutedLocations, frame, thread }) {
  actions.setFramePositions(positions, unexecutedLocations, frame, thread);
}

const clientEvents = {
  paused,
  resumed,
  newSource,
  replayFramePositions,
};

export { removeEventsTopTarget, setupEvents, clientEvents, addThreadEventListeners };
