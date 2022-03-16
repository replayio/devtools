/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Redux actions for the sources state
 * @module actions/sources
 */

import { recordEvent } from "../../utils/telemetry";
import { features } from "../../utils/prefs";
import { getSourceActorsForSource } from "../../selectors";

import { PROMISE } from "ui/setup/redux/middleware/promise";

async function blackboxActors(state, client, sourceId, isBlackBoxed, range) {
  for (const actor of getSourceActorsForSource(state, sourceId)) {
    await client.blackBox(actor, isBlackBoxed, range);
  }
  return { isBlackBoxed: !isBlackBoxed };
}

export function toggleBlackBox(cx, source) {
  return async ({ dispatch, getState, client }) => {
    const { isBlackBoxed } = source;

    if (!isBlackBoxed) {
      recordEvent("blackbox");
    }

    return dispatch({
      type: "BLACKBOX",
      cx,
      source,
      [PROMISE]: blackboxActors(getState(), client, source.id, isBlackBoxed),
    });
  };
}
