/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

const { log } = require("protocol/socket");
const { ThreadFront } = require("protocol/thread");

let actions;

function setupEvents(dependencies) {
  actions = dependencies.actions;

  Object.keys(clientEvents).forEach(eventName => {
    ThreadFront.on(eventName, clientEvents[eventName].bind(null, ThreadFront));
  });
}

async function paused(_, { point, time }) {
  log("ThreadFront.paused");
  actions.paused({ executionPoint: point, thread: ThreadFront.actor, time });
}

function resumed() {
  actions.resumed();
}

const clientEvents = {
  paused,
  resumed,
};

export { setupEvents, clientEvents };
