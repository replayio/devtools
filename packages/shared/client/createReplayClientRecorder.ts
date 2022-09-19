import { ReplayClientEvents, ReplayClientInterface } from "shared/client/types";
import createRecorder from "shared/proxy/createRecorder";
import { Entry } from "shared/proxy/types";
import { encode } from "./encoder";

const FAKE_ACCESS_TOKEN = "<fake-access-token>";

export default function createReplayClientRecorder(
  replayClient: ReplayClientInterface
): ReplayClientInterface {
  let hasAccessToken = false;
  let recordingId: string | null = null;

  // Playwright test runner might listen to the data logged by printInstructions() to update test fixtures.
  // In that case, it's important that it waits until all pending async requests have been resolved.
  // See playwright/tests/utils/testSetup.ts
  function onAsyncRequestPending() {
    if (typeof window !== "undefined") {
      const global = window as any;
      if (global.REPLAY_CLIENT_RECORDER_PENDING_REQUEST_COUNT == null) {
        global.REPLAY_CLIENT_RECORDER_PENDING_REQUEST_COUNT = 1;
      } else {
        global.REPLAY_CLIENT_RECORDER_PENDING_REQUEST_COUNT++;
      }
    }
  }

  // Playwright test runner might listen to the data logged by printInstructions() to update test fixtures.
  // In that case, it's important that it waits until all pending async requests have been resolved.
  // See playwright/tests/utils/testSetup.ts
  function onAsyncRequestResolved() {
    if (typeof window !== "undefined") {
      const global = window as any;
      global.REPLAY_CLIENT_RECORDER_PENDING_REQUEST_COUNT--;
    }
  }

  function onEntriesChanged(newEntry: Entry) {
    console.log(encode(newEntry));
  }

  function sanitizeArgs(prop: string, args: any[] | null): any[] | null {
    if (prop === "initialize") {
      // client.initialize() receives the recording ID and (optionally) access token.
      // This access token is sensitive and shouldn't be recorded.
      recordingId = args![0];
      if (typeof args![1] === "string") {
        args![1] = FAKE_ACCESS_TOKEN;
        hasAccessToken = true;
      }
    }

    return args;
  }

  const dispatchEvent = replayClient.dispatchEvent.bind(replayClient);
  replayClient.dispatchEvent = (type: ReplayClientEvents, ...args: any[]) => {
    dispatchEvent(type, ...args);

    recordEntry("dispatchEvent", [type, ...args], undefined);
  };

  const [proxyReplayClient, _, recordEntry] = createRecorder<ReplayClientInterface>(
    replayClient,
    {
      onAsyncRequestPending,
      onAsyncRequestResolved,
      onEntriesChanged,
      sanitizeArgs,
    },
    {
      addEventListener: (type: ReplayClientEvents, handler: Function) => {
        return replayClient.addEventListener(type, handler);
      },
      removeEventListener: (type: ReplayClientEvents, handler: Function) => {
        return replayClient.removeEventListener(type, handler);
      },
    }
  );

  return proxyReplayClient;
}
