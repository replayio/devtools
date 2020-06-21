/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import { setupCommands, clientCommands } from "./firefox/commands";
import { setupEvents, clientEvents } from "./firefox/events";
import { features, prefs } from "../utils/prefs";

const { ThreadFront } = require("protocol/thread");

let actions;

export async function onConnect(connection: any, _actions: Object, panel) {
  const { devToolsClient, targetList } = connection;
  actions = _actions;

  setupCommands({ devToolsClient });
  setupEvents({ actions, devToolsClient, panel });

  actions.connect("", ThreadFront.actor, {}, false);
  actions.getEventListenerBreakpointTypes().catch(e => console.error(e));

  ThreadFront.findScripts(({ scriptId, url, sourceMapURL }) => {
    const source = {
      actor: scriptId,
      url,
      sourceMapURL,
    };
    clientEvents.newSource(ThreadFront, { source });
  });
}

export { clientCommands, clientEvents };
