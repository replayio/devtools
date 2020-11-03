/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { getBreakpoint, getSource, getSourceActorsForSource } from "../../selectors";
import assert from "../assert";
import { features } from "../prefs";
import { sortBy } from "lodash";

export * from "./astBreakpointLocation";
export * from "./breakpointPositions";

// Return the first argument that is a string, or null if nothing is a
// string.
export function firstString(...args) {
  for (const arg of args) {
    if (typeof arg === "string") {
      return arg;
    }
  }
  return null;
}

// The ID for a Breakpoint is derived from its location in its Source.
export function makeBreakpointId(location) {
  const { sourceId, line, column } = location;
  const columnString = column || "";
  return `${sourceId || location.scriptId}:${line}:${columnString}`;
}

export function getLocationWithoutColumn(location) {
  const { sourceId, line } = location;
  return `${sourceId}:${line}`;
}

export function makePendingLocationId(location) {
  assertPendingLocation(location);
  const { sourceUrl, line, column } = location;
  const sourceUrlString = sourceUrl || "";
  const columnString = column || "";

  return `${sourceUrlString}:${line}:${columnString}`;
}

export function makeBreakpointLocation(state, location) {
  const source = getSource(state, location.sourceId);
  if (!source) {
    throw new Error("no source");
  }
  const breakpointLocation = {
    line: location.line,
    column: location.column,
  };
  if (source.url) {
    breakpointLocation.sourceUrl = source.url;
  } else {
    breakpointLocation.sourceId = getSourceActorsForSource(state, source.id)[0].id;
  }
  return breakpointLocation;
}

export function makeSourceActorLocation(sourceActor, location) {
  return {
    sourceActor,
    line: location.line,
    column: location.column,
  };
}

// The ID for a BreakpointActor is derived from its location in its SourceActor.
export function makeBreakpointActorId(location) {
  const { sourceActor, line, column } = location;
  const columnString = column || "";
  return `${sourceActor}:${line}:${columnString}`;
}

export function assertBreakpoint(breakpoint) {
  assertLocation(breakpoint.location);
}

export function assertPendingBreakpoint(pendingBreakpoint) {
  assertPendingLocation(pendingBreakpoint.location);
}

export function assertLocation(location) {
  assertPendingLocation(location);
  const { sourceId } = location;
  assert(!!sourceId, "location must have a source id");
}

export function assertPendingLocation(location) {
  assert(!!location, "location must exist");

  const { sourceUrl } = location;

  // sourceUrl is null when the source does not have a url
  assert(sourceUrl !== undefined, "location must have a source url");
  assert(location.hasOwnProperty("line"), "location must have a line");
  assert(location.hasOwnProperty("column") != null, "location must have a column");
}

// syncing
export function breakpointAtLocation(breakpoints, { line, column }) {
  return breakpoints.find(breakpoint => {
    const sameLine = breakpoint.location.line === line;
    if (!sameLine) {
      return false;
    }

    // NOTE: when column breakpoints are disabled we want to find
    // the first breakpoint
    if (!features.columnBreakpoints) {
      return true;
    }

    return breakpoint.location.column === column;
  });
}

export function breakpointExists(state, location) {
  const currentBp = getBreakpoint(state, location);
  return currentBp && !currentBp.disabled;
}

export function createXHRBreakpoint(path, method, overrides = {}) {
  const properties = {
    path,
    method,
    disabled: false,
    loading: false,
    text: L10N.getFormatStr("xhrBreakpoints.item.label", path),
  };

  return { ...properties, ...overrides };
}

function createPendingLocation(location) {
  const { sourceUrl, line, column } = location;
  return { sourceUrl, line, column };
}

export function createPendingBreakpoint(bp) {
  const pendingLocation = createPendingLocation(bp.location);

  assertPendingLocation(pendingLocation);

  return {
    options: bp.options,
    disabled: bp.disabled,
    location: pendingLocation,
    astLocation: bp.astLocation,
  };
}

export function getSelectedText(breakpoint, selectedSource) {
  return breakpoint.text;
}

export function sortSelectedBreakpoints(breakpoints, selectedSource) {
  return sortBy(breakpoints, [
    // Priority: line number, undefined column, column number
    breakpoint => breakpoint.location.line,
    breakpoint => {
      return breakpoint.location.column === undefined || breakpoint.location.column;
    },
  ]);
}
