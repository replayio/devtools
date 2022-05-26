/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIThunkAction } from "ui/actions";

import {
  getSourceActor,
  getSourceActorBreakableLines,
  getSourceActorBreakpointColumns,
  getSourceActorBreakpointHitCounts,
  SourceActor,
} from "../reducers/source-actors";
import { memoizeableAction } from "../utils/memoizableAction";
import { PROMISE } from "ui/setup/redux/middleware/promise";

export function insertSourceActor(item: SourceActor) {
  return insertSourceActors([item]);
}
export function insertSourceActors(items: SourceActor[]): UIThunkAction {
  return function (dispatch) {
    dispatch({
      type: "INSERT_SOURCE_ACTORS",
      items,
    });
  };
}

export function removeSourceActor(item: SourceActor) {
  return removeSourceActors([item]);
}
export function removeSourceActors(items: SourceActor[]): UIThunkAction {
  return function (dispatch) {
    dispatch({ type: "REMOVE_SOURCE_ACTORS", items });
  };
}

export const loadSourceActorBreakpointColumns = memoizeableAction(
  "loadSourceActorBreakpointColumns",
  {
    createKey: ({ id, line }: { id: string; line: number }) => `${id}:${line}`,
    getValue: ({ id, line }, thunkArgs) =>
      getSourceActorBreakpointColumns(thunkArgs.getState(), id, line),
    action: async ({ id, line }, thunkArgs) => {
      await thunkArgs.dispatch({
        type: "SET_SOURCE_ACTOR_BREAKPOINT_COLUMNS",
        sourceId: id,
        line,
        [PROMISE]: (async () => {
          const positions = await thunkArgs.client.getSourceActorBreakpointPositions(
            getSourceActor(thunkArgs.getState(), id),
            {
              start: { line, column: 0 },
              end: { line: line + 1, column: 0 },
            }
          );

          return positions[line] || [];
        })(),
      });
    },
  }
);

export const loadSourceActorBreakableLines = memoizeableAction("loadSourceActorBreakableLines", {
  createKey: (args: { id: string }) => args.id,
  getValue: ({ id }, thunkArgs) => getSourceActorBreakableLines(thunkArgs.getState(), id),
  action: async ({ id }, thunkArgs) => {
    await thunkArgs.dispatch({
      type: "SET_SOURCE_ACTOR_BREAKABLE_LINES",
      sourceId: id,
      [PROMISE]: thunkArgs.client.getSourceActorBreakableLines(
        getSourceActor(thunkArgs.getState(), id)
      ),
    });
  },
});

export const MAX_LINE_HITS_TO_FETCH = 1000;
// This will fetch hitCounts in chunks of lines. So if line 4 is request, lines
// 1-500 will be fetched. If line 501 is request, lines 500-1000 will be
// fetched.
export const loadSourceActorBreakpointHitCounts = memoizeableAction(
  "loadSourceActorBreakpointHitCounts",
  {
    createKey: (
      { id, lineNumber }: { id: string; lineNumber: number; onFailure?: (e: any) => void },
      { getState }
    ) => {
      const state = getState();
      // We need to refetch if: we are beyond the maximum number of line hits fetchable
      // Or the focusRegion has changed
      const key = [
        id,
        Math.floor(lineNumber / MAX_LINE_HITS_TO_FETCH) * MAX_LINE_HITS_TO_FETCH,
        state.timeline.focusRegion?.startTime,
        state.timeline.focusRegion?.endTime,
      ].join("-");
      return key;
    },
    getValue: ({ id, lineNumber }, { getState }) =>
      getSourceActorBreakpointHitCounts(getState(), id, lineNumber),
    action: async ({ id, lineNumber, onFailure }, { dispatch, getState, client }) => {
      await dispatch({
        type: "SET_SOURCE_ACTOR_BREAKPOINT_HIT_COUNTS",
        id,
        [PROMISE]: client.getSourceActorBreakpointHitCounts(
          getSourceActor(getState(), id),
          lineNumber,
          onFailure
        ),
      });
    },
  }
);
