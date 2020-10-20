/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { prepareSourcePayload } from "./create";
import sourceQueue from "../utils/source-queue";

const { ThreadFront } = require("protocol/thread");
const { log } = require("protocol/socket");

let actions;

function setupEvents(dependencies) {
  actions = dependencies.actions;
  sourceQueue.initialize(actions);

  Object.keys(clientEvents).forEach(eventName => {
    ThreadFront.on(eventName, clientEvents[eventName].bind(null, ThreadFront));
  });
}

async function paused(_, { point }) {
  log("ThreadFront.paused");
  actions.paused({ thread: ThreadFront.actor, executionPoint: point });
}

function resumed() {
  actions.resumed();
}

function newSource(_, { source }) {
  sourceQueue.queue({
    type: "generated",
    data: prepareSourcePayload(source),
  });
}

const clientEvents = {
  paused,
  resumed,
  newSource,
};

export { setupEvents, clientEvents };
