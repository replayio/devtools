import { RecordingCapabilities } from "protocol/thread/thread";
import { ReplayClientInterface } from "shared/client/types";

let recordingCapabilitiesPromise: Promise<RecordingCapabilities> | null = null;
let recordingCapabilities: RecordingCapabilities | null = null;

export function getRecordingCapabilitiesSuspense(
  replayClient: ReplayClientInterface
): RecordingCapabilities {
  if (recordingCapabilities !== null) {
    return recordingCapabilities;
  } else {
    if (recordingCapabilitiesPromise === null) {
      recordingCapabilitiesPromise = new Promise(async (resolve, reject) => {
        try {
          recordingCapabilities = await replayClient.getRecordingCapabilities();
          recordingCapabilitiesPromise = null;

          resolve(recordingCapabilities!);
        } catch (error) {
          reject(error);
        }
      });
    }

    throw recordingCapabilitiesPromise;
  }
}
