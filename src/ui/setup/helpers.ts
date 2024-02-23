// eslint-disable-next-line no-restricted-imports
import { client, sendMessage, triggerEvent } from "protocol/socket";
import { GraphQLService, userData } from "shared/user-data/GraphQL/UserData";
import { getRecordingId } from "shared/utils/recording";
import { UIStore } from "ui/actions";

import { ReplaySession, getReplaySession } from "./prefs";

declare global {
  interface Window {
    app: AppHelpers;
  }
  interface AppHelpers {
    store: UIStore;
    local: () => void;
    prod: () => void;
    clearIndexedDB: () => void;
    preferences: GraphQLService;
    replaySession: ReplaySession | undefined;
    triggerEvent: typeof triggerEvent;
    sendMessage: typeof sendMessage;
    releaseSession: () => void;
    client: typeof client;
  }
}

export async function setupAppHelper(store: UIStore) {
  const recordingId = getRecordingId();
  const replaySession = recordingId ? await getReplaySession(recordingId) : undefined;

  window.app = {
    store,
    preferences: userData,
    triggerEvent,
    replaySession,
    client,
    sendMessage: (cmd, args = {}, pauseId) =>
      sendMessage(cmd, args, window.sessionId, pauseId as any, true),
    releaseSession: () => client.Recording.releaseSession({ sessionId: window.sessionId }),
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
