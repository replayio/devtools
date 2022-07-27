/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIState } from "ui/state";

import type { Breakpoint, Position } from "../reducers/types";

import { getSelectedSource, MiniSource } from "ui/reducers/sources";
import { getBreakpointsList } from "./breakpoints";

function getBreakpointsForSource(state: UIState, selectedSource: MiniSource) {
  const breakpoints = getBreakpointsList(state);

  return breakpoints.filter(bp => {
    const location = bp.location;
    return location.sourceId === selectedSource.id;
  });
}

function findBreakpointAtLocation(
  breakpoints: Breakpoint[],
  { line, column }: { line: number; column?: number }
) {
  return breakpoints.find(breakpoint => {
    const location = breakpoint.location;
    const sameLine = location.line === line;
    if (!sameLine) {
      return false;
    }

    if (column === undefined) {
      return true;
    }

    return location.column === column;
  });
}

/*
 * Finds a breakpoint at a location (line, column) of the
 * selected source.
 *
 * This is useful for finding a breakpoint when the
 * user clicks in the gutter or on a token.
 */
export function getBreakpointAtLocation(
  state: UIState,
  location: { line: number; column?: number }
) {
  const selectedSource = getSelectedSource(state);
  if (!selectedSource) {
    throw new Error("no selectedSource");
  }
  const breakpoints = getBreakpointsForSource(state, selectedSource);

  return findBreakpointAtLocation(breakpoints, location);
}

export function getBreakpointsAtLine(state: UIState, line: number) {
  const selectedSource = getSelectedSource(state);
  if (!selectedSource) {
    throw new Error("no selectedSource");
  }
  const breakpoints = getBreakpointsForSource(state, selectedSource);

  return breakpoints.filter(breakpoint => breakpoint.location.line === line);
}
