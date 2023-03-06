import { createSingleEntryCache } from "suspense";

import { RecordingCapabilities } from "protocol/thread/thread";
import { ReplayClientInterface } from "shared/client/types";

export const recordingCapabilitiesCache = createSingleEntryCache<
  [ReplayClientInterface],
  RecordingCapabilities
>({
  load: async (replayClient: ReplayClientInterface) => {
    return await replayClient.getRecordingCapabilities();
  },
});
