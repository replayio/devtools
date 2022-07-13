/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIThunkAction } from "ui/actions";
import { PROMISE } from "ui/setup/redux/middleware/promise";

import {
  getSourceActor,
  getSourceActorBreakableLines,
  getSourceActorBreakpointColumns,
  SourceActor,
} from "../reducers/source-actors";
import { memoizeableAction } from "../utils/memoizableAction";

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
