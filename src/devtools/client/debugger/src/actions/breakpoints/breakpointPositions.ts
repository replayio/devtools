/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import uniqBy from "lodash/uniqBy";

import type { UIState } from "ui/state";
import type { ThunkExtraArgs } from "ui/utils/thunk";
import type { Source } from "../../reducers/sources";
import type { AppDispatch } from "ui/setup/store";
import type { SourceLocation } from "../../reducers/types";

import {
  getSource,
  getBreakpointPositionsForSource,
  getSourceActorsForSource,
} from "../../selectors";

import { getLocationKey } from "../../utils/breakpoint";
import { memoizeableAction } from "../../utils/memoizableAction";
import { fulfilled } from "../../utils/async-value";
import { loadSourceActorBreakpointColumns } from "../source-actors";

type ThunkArgs = { dispatch: AppDispatch; getState: () => UIState } & ThunkExtraArgs;

function filterByUniqLocation(positions: SourceLocation[]) {
  return uniqBy(positions, getLocationKey);
}

function convertToList(results: Record<number, number[]>, source: Source) {
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

function groupByLine(results: SourceLocation[], sourceId: string, line: number) {
  const positions: Record<number, SourceLocation[]> = {};

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

async function _setBreakpointPositions(sourceId: string, line: number, thunkArgs: ThunkArgs) {
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

  const results: Record<number, number[]> = {};
  for (const columns of actorColumns) {
    results[line] = (results[line] || []).concat(columns!);
  }

  let positions = convertToList(results, generatedSource);
  const filteredPositions = filterByUniqLocation(positions);
  const groupedPositions = groupByLine(filteredPositions, sourceId, line);

  const source = getSource(thunkArgs.getState(), sourceId);
  // NOTE: it's possible that the source was removed during a navigate
  if (!source) {
    return;
  }

  thunkArgs.dispatch({
    type: "ADD_BREAKPOINT_POSITIONS",
    source,
    groupedPositions,
  });
}

function generatedSourceActorKey(state: UIState, sourceId: string) {
  const source = getSource(state, sourceId);
  const actors = source ? getSourceActorsForSource(state, source.id).map(({ actor }) => actor) : [];
  return [sourceId, ...actors].join(":");
}

export const setBreakpointPositions = memoizeableAction("setBreakpointPositions", {
  getValue: ({ sourceId, line }: { sourceId: string; line: number }, thunkArgs) => {
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
