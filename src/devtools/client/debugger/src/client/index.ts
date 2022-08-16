/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { newSource, Frame } from "@replayio/protocol";
import type { ThreadFront as TF } from "protocol/thread";
import type { UIStore } from "ui/actions";
import { allSourcesReceived } from "ui/reducers/sources";

import { initialBreakpointsState } from "../reducers/breakpoints";
import { asyncStore, verifyPrefSchema } from "../utils/prefs";

import { resumed, paused } from "../actions/pause";

export async function loadInitialState() {
  // @ts-expect-error missing `pendingBreakpoints` field
  const pendingBreakpoints = await asyncStore.pendingBreakpoints;
  const breakpoints = initialBreakpointsState();

  return {
    pendingBreakpoints,
    breakpoints,
  };
}
let store: UIStore;

async function setupDebugger(ThreadFront: typeof TF) {
  const sources: newSource[] = [];
  await ThreadFront.findSources(newSource => sources.push(newSource));

  store.dispatch(allSourcesReceived(sources));
}

export function bootstrap(_store: UIStore, ThreadFront: typeof TF) {
  store = _store;

  setupDebugger(ThreadFront);

  verifyPrefSchema();

  ThreadFront.on(
    "paused",
    ({ point, time, frame }: { point: string; hasFrames: boolean; time: number; frame: Frame }) => {
      store.dispatch(paused({ executionPoint: point, time, frame }));
    }
  );
  ThreadFront.on("resumed", () => store.dispatch(resumed()));
}
