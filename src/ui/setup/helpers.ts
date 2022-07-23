import { UIStore } from "ui/actions";
import { getRecordingId } from "ui/utils/recording";
import { prefs, features, asyncStore } from "ui/utils/prefs";

// eslint-disable-next-line no-restricted-imports
import { triggerEvent, sendMessage, client } from "protocol/socket";
import { getReplaySession, ReplaySession } from "./prefs";

declare global {
  interface Window {
    app: AppHelpers;
  }
  interface AppHelpers {
    store: UIStore;
    prefs: typeof prefs;
    features: typeof features;
    asyncStore: typeof asyncStore;
    dumpPrefs: () => string;
    dumpBasicProcessing: () => void;
    local: () => void;
    prod: () => void;
    clearIndexedDB: () => void;
    replaySession: Promise<ReplaySession> | undefined;
    triggerEvent: typeof triggerEvent;
    sendMessage: typeof sendMessage;
    releaseSession: () => void;
    client: typeof client;
  }
}

function dumpBasicProcessing() {
  const processing = window.sessionMetrics?.filter(
    (data: any) => data.event === "RegionBasicProcessing"
  );

  if (!processing) {
    return;
  }

  const firstBeginTime = processing[0]?.params.timings.creationTimestamp;
  const stats = processing.map((region: any) => ({
    id: region.params.regionIdx,
    beginTime: region.params.timings.creationTimestamp - firstBeginTime,
    duration: region.params.timings.processingDuration,
  }));
  console.table(stats);
}

export async function setupAppHelper(store: UIStore) {
  const recordingId = getRecordingId();
  const replaySession = recordingId ? await getReplaySession(recordingId) : undefined;

  window.app = {
    store,
    prefs,
    features,
    asyncStore,
    triggerEvent,
    replaySession,
    client,
    sendMessage: (cmd, args = {}, pauseId) =>
      sendMessage(cmd, args, window.sessionId, pauseId as any),

    releaseSession: () => client.Recording.releaseSession({ sessionId: window.sessionId }),
    dumpBasicProcessing,
    dumpPrefs: () =>
      JSON.stringify({ features: features.toJSON(), prefs: prefs.toJSON() }, null, 2),
    local: () => {
      if (recordingId) {
        window.location.href = `http://localhost:8080/recording/${recordingId}`;
      } else {
        window.location.href = "http://localhost:8080/";
      }
    },
    prod: () => {
      if (recordingId) {
        window.location.href = `https://app.replay.io/recording/${recordingId}`;
      } else {
        window.location.href = "https://app.replay.io/";
      }
    },
    clearIndexedDB: async () => {
      const databases = await indexedDB.databases();
      databases.map(db => db.name && indexedDB.deleteDatabase(db.name));
    },
  };
}
