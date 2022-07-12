/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import sortBy from "lodash/sortBy";

import type {
  Breakpoint,
  PendingBreakpoint,
  PendingLocation,
  StableLocation,
} from "../../reducers/types";
import { stableIdForSource } from "ui/utils/sources";

import assert from "../assert";
import { features } from "../prefs";

export * from "./astBreakpointLocation";

// Return the first argument that is a string, or null if nothing is a
// string.
export function firstString(...args: any[]) {
  for (const arg of args) {
    if (typeof arg === "string") {
      return arg;
    }
  }
  return null;
}

// This is just an alias to allow legacy calls to still work.
export function getLocationKey(location: StableLocation) {
  return stableIdForLocation(location);
}

export function stableIdForLocation(location: StableLocation) {
  return [stableIdForSource(location), location.line, location.column].filter(Boolean).join(":");
}

export function getLocationAndConditionKey(location: StableLocation, condition: string) {
  return `${stableIdForLocation(location)}:${condition}`;
}

export function isMatchingLocation(location1?: StableLocation, location2?: StableLocation) {
  return (
    location1 && location2 && stableIdForLocation(location1) === stableIdForLocation(location2)
  );
}

export function getLocationWithoutColumn(location: StableLocation) {
  const { sourceId, line } = location;
  return `${sourceId}:${line}`;
}

export function makePendingLocationId(location: StableLocation, recordingId: string) {
  assertPendingLocation(location);
  const { sourceUrl, line, column } = location;
  const sourceUrlString = sourceUrl || "";
  const columnString = column || "";

  return `${recordingId}:${sourceUrlString}:${line}:${columnString}`;
}

export function assertBreakpoint(breakpoint: Breakpoint) {
  assertLocation(breakpoint.location);
}

export function assertPendingBreakpoint(pendingBreakpoint: PendingBreakpoint) {
  assertPendingLocation(pendingBreakpoint.location);
}

export function assertLocation(location: StableLocation) {
  assertPendingLocation(location);
  const { sourceId } = location;
  assert(!!sourceId, "location must have a source id");
}

export function assertPendingLocation(location: PendingLocation) {
  assert(!!location, "location must exist");

  // TODO @jcmorrow... confirm if we actually don't need URL here.
  // sourceUrl is null when the source does not have a url
  // assert(sourceUrl !== undefined, "location must have a source url");
  assert(location.hasOwnProperty("line"), "location must have a line");
  assert(
    location.hasOwnProperty("column") && location.column != null,
    "location must have a column"
  );
}

// syncing
export function breakpointAtLocation(breakpoints: Breakpoint[], { line, column }: StableLocation) {
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

function createPendingLocation(location: StableLocation) {
  const { sourceUrl, line, column } = location;
  return { sourceUrl, line, column };
}

export function createPendingBreakpoint(bp: Breakpoint): PendingBreakpoint {
  const pendingLocation = createPendingLocation(bp.location);

  assertPendingLocation(pendingLocation);

  return {
    options: bp.options,
    disabled: bp.disabled,
    location: pendingLocation,
    astLocation: bp.astLocation!,
  };
}

export function getSelectedText(breakpoint: Breakpoint) {
  return breakpoint.text;
}

export function sortSelectedBreakpoints(breakpoints: Breakpoint[]) {
  return sortBy(breakpoints, [
    // Priority: line number, undefined column, column number
    breakpoint => breakpoint.location.line,
    breakpoint => {
      return breakpoint.location.column === undefined || breakpoint.location.column;
    },
  ]);
}

export const isBreakable = (bp?: Breakpoint) => !!bp?.options.shouldPause;
export const isLogpoint = (bp?: Breakpoint) => !!bp?.options.logValue;
