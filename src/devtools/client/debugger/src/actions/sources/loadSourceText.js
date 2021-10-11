/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { PROMISE } from "../utils/middleware/promise";
import {
  getSource,
  getSourceFromId,
  getSourceWithContent,
  getSourcesEpoch,
  getSourceActorsForSource,
} from "../../selectors";

import { fulfilled } from "../../utils/async-value";

import { memoizeableAction } from "../../utils/memoizableAction";

export async function loadSource(state, source, { parser, client }) {
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
      response = await client.sourceContents(actor);
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

async function loadSourceTextPromise(cx, source, { dispatch, getState, client, parser }) {
  const epoch = getSourcesEpoch(getState());
  await dispatch({
    type: "LOAD_SOURCE_TEXT",
    sourceId: source.id,
    epoch,
    [PROMISE]: loadSource(getState(), source, { parser, client, getState }),
  });
}

export function loadSourceById(cx, sourceId) {
  return ({ getState, dispatch }) => {
    const source = getSourceFromId(getState(), sourceId);
    return dispatch(loadSourceText({ cx, source }));
  };
}

export const loadSourceText = memoizeableAction("loadSourceText", {
  getValue: ({ source }, { getState }) => {
    source = source ? getSource(getState(), source.id) : null;
    if (!source) {
      return null;
    }

    const { content } = getSourceWithContent(getState(), source.id);
    if (!content || content.state === "pending") {
      return content;
    }

    // This currently swallows source-load-failure since we return fulfilled
    // here when content.state === "rejected". In an ideal world we should
    // propagate that error upward.
    return fulfilled(source);
  },
  createKey: ({ source }, { getState }) => {
    const epoch = getSourcesEpoch(getState());
    return `${epoch}:${source.id}`;
  },
  action: ({ cx, source }, thunkArgs) => loadSourceTextPromise(cx, source, thunkArgs),
});
