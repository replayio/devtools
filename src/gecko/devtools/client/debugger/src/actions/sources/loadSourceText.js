/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import { PROMISE } from "../utils/middleware/promise";
import {
  getSource,
  getSourceFromId,
  getSourceWithContent,
  getSourceContent,
  getGeneratedSource,
  getSourcesEpoch,
  getBreakpointsForSource,
  getSourceActorsForSource,
} from "../../selectors";
import { addBreakpoint } from "../breakpoints";

import { isFulfilled, fulfilled } from "../../utils/async-value";

import { isPretty } from "../../utils/source";
import { memoizeableAction, type MemoizedAction } from "../../utils/memoizableAction";

import { Telemetry } from "devtools-modules";

import type { ThunkArgs } from "../types";
import type { Source, Context } from "../../types";

// Measures the time it takes for a source to load
const loadSourceHistogram = "DEVTOOLS_DEBUGGER_LOAD_SOURCE_MS";
const telemetry = new Telemetry();

async function loadSource(
  state,
  source: Source,
  { sourceMaps, client, getState }
): Promise<?{
  text: string,
  contentType: string,
}> {
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
      telemetry.start(loadSourceHistogram, source);
      response = await client.sourceContents(actor);
      telemetry.finish(loadSourceHistogram, source);
      break;
    } catch (e) {
      console.warn(`sourceContents failed: ${e}`);
    }
  }

  return {
    text: (response: any).source,
    contentType: (response: any).contentType || "text/javascript",
  };
}

async function loadSourceTextPromise(
  cx: Context,
  source: Source,
  { dispatch, getState, client, sourceMaps, parser }: ThunkArgs
): Promise<?Source> {
  const epoch = getSourcesEpoch(getState());
  await dispatch({
    type: "LOAD_SOURCE_TEXT",
    sourceId: source.id,
    epoch,
    [PROMISE]: loadSource(getState(), source, { sourceMaps, client, getState }),
  });

  const newSource = getSource(getState(), source.id);

  if (!newSource) {
    return;
  }
  const content = getSourceContent(getState(), newSource.id);

  if (!newSource.isWasm && content) {
    parser.setSource(
      newSource.id,
      isFulfilled(content) ? content.value : { type: "text", value: "", contentType: undefined }
    );

    client.eventMethods.sourceLoaded(newSource.id);

    // Update the text in any breakpoints for this source by re-adding them.
    const breakpoints = getBreakpointsForSource(getState(), source.id);
    for (const { location, options, disabled } of breakpoints) {
      await dispatch(addBreakpoint(cx, location, options, disabled));
    }
  }
}

export function loadSourceById(cx: Context, sourceId: string) {
  return ({ getState, dispatch }: ThunkArgs) => {
    const source = getSourceFromId(getState(), sourceId);
    return dispatch(loadSourceText({ cx, source }));
  };
}

export const loadSourceText: MemoizedAction<
  {| cx: Context, source: Source |},
  ?Source
> = memoizeableAction("loadSourceText", {
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
