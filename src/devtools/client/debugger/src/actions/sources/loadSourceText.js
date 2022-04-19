/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { parser } from "devtools/client/debugger/src/utils/bootstrap";
import { PROMISE } from "ui/setup/redux/middleware/promise";

import {
  getSource,
  getSourceFromId,
  getSourceWithContent,
  getSourcesEpoch,
  getSourceActorsForSource,
} from "../../selectors";
import { fulfilled } from "../../utils/async-value";
import { memoizeableAction } from "../../utils/memoizableAction";

export async function loadSource(state, source, thunkArgs) {
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

  parser.setSource(source.id, { contentType, type: "text", value: text });

  return { contentType, text };
}

async function loadSourceTextPromise(cx, source, thunkArgs) {
  const epoch = getSourcesEpoch(thunkArgs.getState());
  await thunkArgs.dispatch({
    [PROMISE]: loadSource(thunkArgs.getState(), source, thunkArgs),
    epoch,
    sourceId: source.id,
    type: "LOAD_SOURCE_TEXT",
  });
}

export function loadSourceById(cx, sourceId) {
  return (dispatch, getState) => {
    const source = getSourceFromId(getState(), sourceId);
    return dispatch(loadSourceText({ cx, source }));
  };
}

export const loadSourceText = memoizeableAction("loadSourceText", {
  action: ({ cx, source }, thunkArgs) => loadSourceTextPromise(cx, source, thunkArgs),
  createKey: ({ source }, thunkArgs) => {
    const epoch = getSourcesEpoch(thunkArgs.getState());
    return `${epoch}:${source.id}`;
  },
  getValue: ({ source }, thunkArgs) => {
    source = source ? getSource(thunkArgs.getState(), source.id) : null;
    if (!source) {
      return null;
    }

    const { content } = getSourceWithContent(thunkArgs.getState(), source.id);
    if (!content || content.state === "pending") {
      return content;
    }

    // This currently swallows source-load-failure since we return fulfilled
    // here when content.state === "rejected". In an ideal world we should
    // propagate that error upward.
    return fulfilled(source);
  },
});
