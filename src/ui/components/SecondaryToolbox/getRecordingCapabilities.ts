import { ThreadFront } from "protocol/thread";
import { RecordingCapabilities } from "protocol/thread/thread";

let recordingCapabilitiesPromise: Promise<RecordingCapabilities> | null = null;
let recordingCapabilities: RecordingCapabilities | null = null;

export function getRecordingCapabilitiesSuspense(): RecordingCapabilities {
  if (recordingCapabilities !== null) {
    return recordingCapabilities;
  } else {
    if (recordingCapabilitiesPromise === null) {
      recordingCapabilitiesPromise = new Promise(async (resolve, reject) => {
        try {
          recordingCapabilities = await ThreadFront.getRecordingCapabilities();
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
