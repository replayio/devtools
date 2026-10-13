import { SourceId, getSourceOutlineResult } from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";

import { createCache } from "suspense";

export const sourceOutlineCache = createCache<
  [replayClient: ReplayClientInterface, sourceId: SourceId | undefined],
  getSourceOutlineResult
>({
  config: { immutable: true },
  debugLabel: "sourceOutlineCache",
  getKey: ([replayClient, sourceId]) => sourceId ?? "",
  load: ([replayClient, sourceId]) =>
    sourceId ? replayClient.getSourceOutline(sourceId) : { functions: [], classes: [] },
});
