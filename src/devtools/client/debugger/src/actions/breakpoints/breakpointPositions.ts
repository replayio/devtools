/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import uniqBy from "lodash/uniqBy";

import {
  getSource,
  getSourceFromId,
  getBreakpointPositionsForSource,
  getSourceActorsForSource,
} from "../../selectors";

import { getLocationKey } from "../../utils/breakpoint";
import { memoizeableAction } from "../../utils/memoizableAction";
import { fulfilled } from "../../utils/async-value";
import { loadSourceActorBreakpointColumns } from "../source-actors";

function filterByUniqLocation(positions) {
  return uniqBy(positions, getLocationKey);
}

function convertToList(results, source) {
  const { id, url } = source;
  const positions = [];

  for (const line in results) {
    for (const column of results[line]) {
      positions.push({
        line: Number(line),
        column,
        sourceId: id,
        sourceUrl: url,
      });
    }
  }

  return positions;
}

function groupByLine(results, sourceId, line) {
  const positions = {};

  // Ensure that we have an entry for the line fetched
  if (typeof line === "number") {
    positions[line] = [];
  }

  for (const result of results) {
    if (!positions[result.line]) {
      positions[result.line] = [];
    }

    positions[result.line].push(result);
  }

  return positions;
}

async function _setBreakpointPositions(sourceId, line, thunkArgs) {
  let generatedSource = getSource(thunkArgs.getState(), sourceId);
  if (!generatedSource) {
    return;
  }

  if (typeof line !== "number") {
    throw new Error("Line is required for generated sources");
  }

  const actorColumns = await Promise.all(
    getSourceActorsForSource(thunkArgs.getState(), generatedSource.id).map(actor =>
      thunkArgs.dispatch(loadSourceActorBreakpointColumns({ id: actor.id, line }))
    )
  );

  const results = {};
  for (const columns of actorColumns) {
    results[line] = (results[line] || []).concat(columns);
  }

  let positions = convertToList(results, generatedSource);
  positions = filterByUniqLocation(positions);
  positions = groupByLine(positions, sourceId, line);

  const source = getSource(thunkArgs.getState(), sourceId);
  // NOTE: it's possible that the source was removed during a navigate
  if (!source) {
    return;
  }

  thunkArgs.dispatch({
    type: "ADD_BREAKPOINT_POSITIONS",
    source,
    positions,
  });
}

function generatedSourceActorKey(state, sourceId) {
  const source = getSource(state, sourceId);
  const actors = source ? getSourceActorsForSource(state, source.id).map(({ actor }) => actor) : [];
  return [sourceId, ...actors].join(":");
}

export const setBreakpointPositions = memoizeableAction("setBreakpointPositions", {
  getValue: ({ sourceId, line }, thunkArgs) => {
    const positions = getBreakpointPositionsForSource(thunkArgs.getState(), sourceId);
    if (!positions) {
      return null;
    }

    if (line && !positions[line]) {
      // We always return the full position dataset, but if a given line is
      // not available, we treat the whole set as loading.
      return null;
    }

    return fulfilled(positions);
  },
  createKey({ sourceId, line }, thunkArgs) {
    const key = generatedSourceActorKey(thunkArgs.getState(), sourceId);
    return line ? `${key}-${line}` : key;
  },
  action: async ({ sourceId, line }, thunkArgs) =>
    _setBreakpointPositions(sourceId, line, thunkArgs),
});
