/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import { setBreakpointPositions } from "./breakpointPositions";
import { setSymbols } from "../sources/symbols";
import {
  assertPendingBreakpoint,
  findFunctionByName,
  findPosition,
  makeBreakpointLocation,
} from "../../utils/breakpoint";

import { comparePosition, createLocation } from "../../utils/location";

import { getSource } from "../../selectors";
import { addBreakpoint } from ".";

import type { ThunkArgs } from "../types";
import type { LoadedSymbols } from "../../reducers/types";

import type {
  SourceLocation,
  ASTLocation,
  PendingBreakpoint,
  SourceId,
  BreakpointPositions,
  Context,
} from "../../types";

async function findNewLocation(
  cx: Context,
  { name, offset, index }: ASTLocation,
  location: SourceLocation,
  source,
  thunkArgs
) {
  const symbols: LoadedSymbols = await thunkArgs.dispatch(
    setSymbols({ cx, source })
  );
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
  sourceId: SourceId,
  pendingBreakpoint: PendingBreakpoint
) {
  return async (thunkArgs: ThunkArgs) => {
    const { getState, client, dispatch } = thunkArgs;
    assertPendingBreakpoint(pendingBreakpoint);

    const source = getSource(getState(), sourceId);

    if (!source) {
      return;
    }

    const { location, astLocation } = pendingBreakpoint;
    const sourceLocation = createLocation({
      ...location,
      sourceId,
    });

    const previousLocation = { ...location, sourceId };

    const newLocation = await findNewLocation(
      cx,
      astLocation,
      previousLocation,
      source,
      thunkArgs
    );

    return dispatch(
      addBreakpoint(
        cx,
        newLocation,
        pendingBreakpoint.options,
        pendingBreakpoint.disabled
      )
    );
  };
}
