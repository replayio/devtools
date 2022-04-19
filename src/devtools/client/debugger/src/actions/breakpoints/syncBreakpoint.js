/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { getSource } from "../../selectors";
import { assertPendingBreakpoint, findFunctionByName } from "../../utils/breakpoint";
import { setSymbols } from "../sources/symbols";

import { addBreakpoint } from ".";

async function findNewLocation(cx, { name, offset, index }, location, source, dispatch) {
  const symbols = await dispatch(setSymbols({ cx, source }));
  const func = symbols ? findFunctionByName(symbols, name, index) : null;

  // Fallback onto the location line, if we do not find a function.
  let line = location.line;
  if (func) {
    line = func.location.start.line + offset.line;
  }

  return {
    column: location.column,
    line,
    sourceId: source.id,
    sourceUrl: source.url,
  };
}

export function syncBreakpoint(cx, sourceId, pendingBreakpoint) {
  return async (dispatch, getState) => {
    assertPendingBreakpoint(pendingBreakpoint);

    const source = getSource(getState(), sourceId);

    if (!source) {
      return;
    }

    const { location, astLocation } = pendingBreakpoint;
    const previousLocation = { ...location, sourceId };
    const newLocation = await findNewLocation(cx, astLocation, previousLocation, source, dispatch);

    dispatch({ location, type: "REMOVE_PENDING_BREAKPOINT" });

    return dispatch(
      addBreakpoint(cx, newLocation, pendingBreakpoint.options, pendingBreakpoint.disabled)
    );
  };
}
