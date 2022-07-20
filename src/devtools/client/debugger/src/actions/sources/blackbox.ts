/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Redux actions for the sources state
 * @module actions/sources
 */

import { recordEvent } from "../../utils/telemetry";
import type { UIState } from "ui/state";
import type { UIThunkAction } from "ui/actions";
import type { clientCommands } from "devtools/client/debugger/src/client/commands";
import type { SourceRange } from "devtools/client/debugger/src/client/commands";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import type { Source, SourceWithContent } from "../../reducers/sources";
import { getSourceActorsForSource } from "../../selectors";

import { PROMISE } from "ui/setup/redux/middleware/promise";

async function blackboxActors(
  state: UIState,
  client: typeof clientCommands,
  sourceId: string,
  isBlackBoxed: boolean,
  range?: Partial<SourceRange>
) {
  // TODO Rework blackboxing to actually do something again
  /*
  for (const actor of getSourceActorsForSource(state, sourceId)) {
    await client.blackBox(actor, isBlackBoxed, range);
  }
  */
  return { isBlackBoxed: !isBlackBoxed };
}

export function toggleBlackBox(cx: Context, source: SourceDetails): UIThunkAction {
  return async (dispatch, getState, { client }) => {
    // TODO Re-enable blackboxing
    /*
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
    */
  };
}
