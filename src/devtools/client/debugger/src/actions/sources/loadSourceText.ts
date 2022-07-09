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

export const loadSourceText = (sourceId: string) => {
  return { type: "sources/sourceLoading", payload: sourceId };
};
