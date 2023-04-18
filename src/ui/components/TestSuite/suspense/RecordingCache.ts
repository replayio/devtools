import assert from "assert";
import { RecordingId } from "@replayio/protocol";
import { createSingleEntryCache } from "suspense";

import { Recording } from "shared/graphql/types";
import { getRecording } from "ui/hooks/recordings";

export const RecordingCache = createSingleEntryCache<[recordingId: RecordingId], Recording>({
  debugLabel: "TestCache",
  load: async ([recordingId]) => {
    const recording = await getRecording(recordingId);

    assert(recording != null);

    return recording;
  },
});
