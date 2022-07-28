/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIThunkAction } from "ui/actions";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import type { PendingBreakpoint } from "../../reducers/types";

import { fetchSymbolsForSource, getSymbolEntryForSource } from "../../reducers/ast";
import { assertPendingBreakpoint, findFunctionByName } from "../../utils/breakpoint";

import { removePendingBreakpoint } from "../../reducers/pending-breakpoints";
import { getSourceDetails } from "ui/reducers/sources";
import { addBreakpoint } from "./modify";
import { LoadingStatus } from "ui/utils/LoadingStatus";
import { listenForCondition } from "ui/setup/listenerMiddleware";

export function syncBreakpoint(
  cx: Context,
  sourceId: string,
  pendingBreakpoint: PendingBreakpoint
): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    assertPendingBreakpoint(pendingBreakpoint);

    const source = getSourceDetails(getState(), sourceId);

    if (!source) {
      return;
    }

    const { location, astLocation } = pendingBreakpoint;
    const previousLocation = { ...location, sourceId };

    await dispatch(fetchSymbolsForSource(source.id));
    let symbols = getSymbolEntryForSource(getState(), sourceId)!;
    // Small chance of a race condition if this was already in flight, so
    // safely make sure we wait until it's here.
    if (symbols?.status !== LoadingStatus.LOADED) {
      await dispatch(
        listenForCondition(
          (action, currState) =>
            getSymbolEntryForSource(getState(), sourceId)?.status === LoadingStatus.LOADED
        )
      );
      symbols = getSymbolEntryForSource(getState(), sourceId)!;
    }
    const func = symbols ? findFunctionByName(symbols, astLocation.name!) : null;

    // Fallback onto the location line, if we do not find a function.
    let line = previousLocation.line;
    if (func) {
      line = func.location.start.line + astLocation.offset.line;
    }

    const newLocation = {
      line,
      column: previousLocation.column,
      sourceUrl: source.url!,
      sourceId: source.id,
    };

    dispatch(removePendingBreakpoint(location, ThreadFront.recordingId!, cx));

    return dispatch(
      addBreakpoint(cx, newLocation, pendingBreakpoint.options, pendingBreakpoint.disabled)
    );
  };
}
