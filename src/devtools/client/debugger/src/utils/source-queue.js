/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import throttle from "lodash/throttle";

let newSources;
let queuedSources;
let currentWork;

async function dispatchNewSources() {
  const sources = queuedSources;
  queuedSources = [];
  currentWork = await newSources(sources);
}

const queue = throttle(dispatchNewSources, 1000);

export default {
  initialize: actions => {
    newSources = actions.newSources;
    queuedSources = [];
  },
  queue: source => {
    queuedSources.push(source);
    queue();
  },
  queueSources: sources => {
    if (sources.length > 0) {
      queuedSources = queuedSources.concat(sources);
      queue();
    }
  },

  flush: () => Promise.all([queue.flush(), currentWork]),
  clear: () => {
    queuedSources = [];
    queue.cancel();
  },
};
