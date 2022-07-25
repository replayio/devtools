/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIState } from "ui/state";
import type { UIThunkAction } from "ui/actions";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import type { AppDispatch } from "ui/setup/store";
import type { ASTLocation, PendingBreakpoint, SourceLocation } from "../../reducers/types";

import { setSymbols } from "../sources/symbols";
import { assertPendingBreakpoint, findFunctionByName } from "../../utils/breakpoint";

import { removePendingBreakpoint } from "../../reducers/pending-breakpoints";
import { getSourceDetails, SourceDetails } from "ui/reducers/sources";
import { addBreakpoint } from "./modify";

async function findNewLocation(
  cx: Context,
  { name, offset, index }: ASTLocation,
  location: SourceLocation,
  source: SourceDetails,
  dispatch: AppDispatch
): Promise<SourceLocation> {
  const symbols = await dispatch(setSymbols({ source }));
  const func = symbols ? findFunctionByName(symbols, name, index) : null;

  // Fallback onto the location line, if we do not find a function.
  let line = location.line;
  if (func) {
    line = func.location.start.line + offset.line;
  }

  return {
    line,
    column: location.column,
    sourceUrl: source.url,
    sourceId: source.id,
  };
}

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
    const newLocation = await findNewLocation(cx, astLocation, previousLocation, source, dispatch);

    dispatch(removePendingBreakpoint(location, ThreadFront.recordingId!, cx));

    return dispatch(
      // @ts-expect-error location/pendingLocation mismatch
      addBreakpoint(cx, newLocation, pendingBreakpoint.options, pendingBreakpoint.disabled)
    );
  };
}
