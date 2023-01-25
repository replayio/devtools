/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { Frame } from "@replayio/protocol";

import type { ThreadFront as TF } from "protocol/thread";
import { getSourcesAsync } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";
import type { UIStore } from "ui/actions";
import { allSourcesReceived } from "ui/reducers/sources";

import { paused, resumed } from "../actions/pause";

let store: UIStore;

async function setupDebugger(ThreadFront: typeof TF, replayClient: ReplayClientInterface) {
  const sources = await getSourcesAsync(replayClient);

  store.dispatch(allSourcesReceived(sources));
}

export function bootstrap(
  _store: UIStore,
  ThreadFront: typeof TF,
  replayClient: ReplayClientInterface
) {
  store = _store;

  setupDebugger(ThreadFront, replayClient);

  ThreadFront.on(
    "paused",
    ({
      point,
      time,
      frame,
      openSource,
    }: {
      point: string;
      openSource: boolean;
      time: number;
      frame: Frame;
    }) => {
      store.dispatch(paused({ executionPoint: point, time, openSource, frame }));
    }
  );
  ThreadFront.on("resumed", () => store.dispatch(resumed()));
}
