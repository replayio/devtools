/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { Frame } from "@replayio/protocol";

import { getSourcesHelper } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import type { ThreadFront as TF } from "protocol/thread";
import { ReplayClientInterface } from "shared/client/types";
import type { UIStore } from "ui/actions";
import { allSourcesReceived } from "ui/reducers/sources";

import { paused, resumed } from "../actions/pause";
import { verifyPrefSchema } from "../utils/prefs";

let store: UIStore;

async function setupDebugger(ThreadFront: typeof TF, replayClient: ReplayClientInterface) {
  const sources = await getSourcesHelper(replayClient);

  store.dispatch(allSourcesReceived(sources));
}

export function bootstrap(
  _store: UIStore,
  ThreadFront: typeof TF,
  replayClient: ReplayClientInterface
) {
  store = _store;

  setupDebugger(ThreadFront, replayClient);

  verifyPrefSchema();

  ThreadFront.on(
    "paused",
    ({
      point,
      time,
      frame,
      hasFrames,
    }: {
      point: string;
      hasFrames: boolean;
      time: number;
      frame: Frame;
    }) => {
      store.dispatch(paused({ executionPoint: point, time, frame, hasFrames }));
    }
  );
  ThreadFront.on("resumed", () => store.dispatch(resumed()));
}
