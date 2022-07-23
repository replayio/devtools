/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
import type { Location, SameLineSourceLocations } from "@replayio/protocol";
import sortBy from "lodash/sortBy";

export function comparePosition(a: Location, b: Location) {
  return a && b && a.line == b.line && a.column == b.column;
}

export function createLocation({
  sourceId,
  // Line 0 represents no specific line chosen for action
  line = 0,
  column,
  sourceUrl = "",
}: {
  sourceId: string;
  line?: number;
  column?: number;
  sourceUrl?: string;
}) {
  return {
    sourceId,
    line,
    column,
    sourceUrl,
  };
}

export function sortSelectedLocations(locations: Location[]) {
  return sortBy(locations, [
    // Priority: line number, undefined column, column number
    location => location.line,
    location => {
      return location.column === undefined || location.column;
    },
  ]);
}
