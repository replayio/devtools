/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
//

import type { Location } from "@recordreplay/protocol";
import groupBy from "lodash/groupBy";
import uniqBy from "lodash/uniqBy";
import { createSelector } from "reselect";
import type { UIState } from "ui/state";
import { features } from "ui/utils/prefs";

import {
  getSource,
  getSelectedSource,
  getSelectedSourceWithContent,
  getBreakpointPositions,
  getBreakpointPositionsForSource,
} from "../reducers/sources";
import type { Source } from "../reducers/sources";
import type { Breakpoint, Range, SourceLocation } from "../reducers/types";
import { getViewport } from "../reducers/ui";
import type { AsyncValue } from "../utils/async-value";
import { sortSelectedLocations } from "../utils/location";
import { getLineText } from "../utils/source";

import { getVisibleBreakpoints, getVisibleRequestedBreakpoints } from "./visibleBreakpoints";

type BreakpointMap = Record<string, Record<string, Breakpoint[]>>;

function contains(location: Location, range: Range) {
  return (
    location.line >= range.start.line &&
    location.line <= range.end.line &&
    (!location.column ||
      (location.column >= range.start.column && location.column <= range.end.column))
  );
}

function groupBreakpoints(breakpoints: Breakpoint[]) {
  if (!breakpoints) {
    return {};
  }

  const map = groupBy(breakpoints, breakpoint => breakpoint.location.line);
  const result: BreakpointMap = {};

  for (const line in map) {
    result[line] = groupBy(map[line], breakpoint => breakpoint.location.column);
  }

  return result;
}

function findBreakpoint(location: Location, breakpointMap: BreakpointMap) {
  const { line, column } = location;
  const breakpoints = breakpointMap[line] && breakpointMap[line][column];

  if (breakpoints) {
    return breakpoints[0];
  }
}

function filterByLineCount(positions: Location[], selectedSource: Source) {
  const lineCount: Record<number, number> = {};

  for (const { line } of positions) {
    if (!lineCount[line]) {
      lineCount[line] = 0;
    }

    lineCount[line] = lineCount[line] + 1;
  }

  return positions.filter(({ line }) => lineCount[line] > 1);
}

// filter out positions that are not being shown
function filterVisible(positions: Location[], viewport: Range) {
  return positions.filter(location => {
    return viewport && contains(location, viewport);
  });
}

// filter out positions that are not in the map
function filterByBreakpoints(positions: Location[], breakpointMap: BreakpointMap) {
  return positions.filter(position => {
    return breakpointMap[position.line];
  });
}

// Filters out breakpoints to the right of the line. (bug 1552039)
function filterInLine(
  positions: Location[],
  selectedContent:
    | AsyncValue<{
        contentType: string;
        type: string;
        value: string;
      }>
    | {
        contentType: string;
        type: string;
        value: string;
      }
) {
  return positions.filter(position => {
    const lineText = getLineText(selectedContent, position.line);

    return lineText.length >= (position.column || 0);
  });
}

function formatPositions(positions: Location[], breakpointMap: BreakpointMap) {
  return positions.map(location => {
    return {
      location,
      breakpoint: findBreakpoint(location, breakpointMap),
    };
  });
}

function convertToList<T>(breakpointPositions: Record<string, T>) {
  return ([] as T[]).concat(...Object.values(breakpointPositions));
}

const getVisibleBreakpointPositions = createSelector(
  getSelectedSource,
  getBreakpointPositions,
  (source, positions) => {
    if (!source) {
      return [];
    }

    const sourcePositions = positions[source.id];
    if (!sourcePositions) {
      return [];
    }

    return convertToList(sourcePositions);
  }
);

export const visibleColumnBreakpoints = createSelector(
  getVisibleBreakpoints,
  getVisibleRequestedBreakpoints,
  getViewport,
  getSelectedSourceWithContent,
  getVisibleBreakpointPositions,
  (breakpoints, requestedBreakpoints, viewport, selectedSource, breakpointPositions) => {
    if (!selectedSource) {
      return [];
    }

    // We only want to show a column breakpoint if several conditions are matched
    // - it is the first breakpoint to appear at an the original location
    // - the position is in the current viewport
    // - there is atleast one other breakpoint on that line
    // - there is a breakpoint on that line
    // @ts-ignore nested field mismatch
    const allBreakpoints: Breakpoint[] = [...(breakpoints ?? []), ...(requestedBreakpoints ?? [])];

    // NOTE: column breakpoints are disabled by default because
    // we should first verify if the results make sense
    let positions;
    if (features.columnBreakpoints) {
      positions = breakpointPositions;
    } else {
      // collect all breakpoint positions but make sure that we don't have 2 positions
      // for the same line in the same source
      positions = uniqBy(
        allBreakpoints.map(bp => bp.location),
        ({ sourceId, line }) => `${sourceId}:${line}`
      );
    }
    const breakpointMap = groupBreakpoints(allBreakpoints);
    // @ts-ignore columns undefined
    positions = filterVisible(positions, viewport);
    // @ts-ignore weird asyncvalue mismatch
    positions = filterInLine(positions, selectedSource.content);
    positions = filterByBreakpoints(positions, breakpointMap);

    return formatPositions(positions, breakpointMap);
  }
);

export function getFirstBreakpointPosition(state: UIState, { line, sourceId }: SourceLocation) {
  const positions = getBreakpointPositionsForSource(state, sourceId);
  const source = getSource(state, sourceId);

  if (!source || !positions) {
    return;
  }

  return sortSelectedLocations(convertToList(positions), source).find(
    location => location.line == line
  );
}
