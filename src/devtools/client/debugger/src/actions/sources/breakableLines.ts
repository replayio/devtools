/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import type { UIThunkAction } from "ui/actions";
import type { Context } from "devtools/client/debugger/src/reducers/pause";

import { getSourceActorsForSource } from "../../selectors";
import {
  loadSourceActorBreakableLines,
  loadSourceActorBreakpointHitCounts,
} from "../source-actors";

export function setBreakableLines(cx: Context, sourceId: string): UIThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const actors = getSourceActorsForSource(getState(), sourceId);

    await Promise.all(
      actors.map(actor => dispatch(loadSourceActorBreakableLines({ id: actor.id, cx })))
    );
  };
}

export function setBreakpointHitCounts(sourceId: string, lineNumber: number): UIThunkAction {
  return async (dispatch, getState) => {
    const actors = getSourceActorsForSource(getState(), sourceId);

    return Promise.all(
      actors.map(actor =>
        dispatch(loadSourceActorBreakpointHitCounts({ id: actor.id, lineNumber }))
      )
    );
  };
}
