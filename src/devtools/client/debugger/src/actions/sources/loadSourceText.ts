/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import type { UIState } from "ui/state";
import type { UIThunkAction } from "ui/actions";
import type { ThunkExtraArgs } from "ui/utils/thunk";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import type { Source } from "../../reducers/sources";
import type { AppDispatch } from "ui/setup/store";

import { PROMISE } from "ui/setup/redux/middleware/promise";
import { parser } from "devtools/client/debugger/src/utils/bootstrap";
import {
  getSource,
  getSourceFromId,
  getSourceWithContent,
  getSourcesEpoch,
  getSourceActorsForSource,
} from "../../selectors";

import { AsyncValue, fulfilled } from "../../utils/async-value";

import { memoizeableAction } from "../../utils/memoizableAction";

type ThunkArgs = { dispatch: AppDispatch; getState: () => UIState } & ThunkExtraArgs;

export async function loadSource(state: UIState, source: Source, thunkArgs: ThunkArgs) {
  // We only need the source text from one actor, but messages sent to retrieve
  // the source might fail if the actor has or is about to shut down. Keep
  // trying with different actors until one request succeeds.
  let response;
  const handledActors = new Set();
  while (true) {
    const actors = getSourceActorsForSource(state, source.id);
    const actor = actors.find(({ actor: a }) => !handledActors.has(a));
    if (!actor) {
      throw new Error("Unknown source");
    }
    handledActors.add(actor.actor);

    try {
      response = await thunkArgs.client.sourceContents(actor);
      break;
    } catch (e) {
      console.warn(`sourceContents failed: ${e}`);
    }
  }

  const contentType = response.contentType || "text/javascript";
  const text = response.source || "";

  parser.setSource(source.id, { type: "text", value: text, contentType });

  return { text, contentType };
}

async function loadSourceTextPromise(source: Source, thunkArgs: ThunkArgs) {
  const epoch = getSourcesEpoch(thunkArgs.getState());
  await thunkArgs.dispatch({
    type: "LOAD_SOURCE_TEXT",
    sourceId: source.id,
    epoch,
    [PROMISE]: loadSource(thunkArgs.getState(), source, thunkArgs),
  });
}

export function loadSourceById(cx: Context, sourceId: string): UIThunkAction {
  return (dispatch, getState) => {
    const source = getSourceFromId(getState(), sourceId)!;
    return dispatch(loadSourceText({ source }));
  };
}

export const loadSourceText = memoizeableAction("loadSourceText", {
  getValue: (
    { source }: { source: Source },
    thunkArgs
  ): AsyncValue<Source> | Source | null | undefined => {
    const actualSource: Source | null = source ? getSource(thunkArgs.getState(), source.id) : null;
    if (!actualSource) {
      return null;
    }

    const { content } = getSourceWithContent(thunkArgs.getState(), actualSource.id);
    // @ts-expect-error state doesn't exist?
    if (!content || content.state === "pending") {
      // @ts-expect-error more mismatches AGGGHH KILL THIS!
      return content;
    }

    // This currently swallows source-load-failure since we return fulfilled
    // here when content.state === "rejected". In an ideal world we should
    // propagate that error upward.
    return fulfilled(actualSource);
  },
  createKey: ({ source }, thunkArgs) => {
    const epoch = getSourcesEpoch(thunkArgs.getState());
    return `${epoch}:${source!.id}`;
  },
  action: ({ source }, thunkArgs) => loadSourceTextPromise(source!, thunkArgs),
});
