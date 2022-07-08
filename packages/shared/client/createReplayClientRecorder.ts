import { findMatch } from "shared/utils/client";
import { encode } from "./encoder";
import { ReplayClientInterface, LogEntry } from "./types";

const FAKE_ACCESS_TOKEN = "<fake-access-token>";

export default function createReplayClientRecorder(
  replayClient: ReplayClientInterface
): ReplayClientInterface {
  const logEntries: LogEntry[] = [];

  let hasAccessToken = false;
  let recordingId: string | null = null;

  // Playwright test runner might listen to the data logged by printInstructions() to update test fixtures.
  // In that case, it's important that it waits until all pending async requests have been resolved.
  // See playwright/tests/utils/testSetup.ts
  const flagPendingClientRequest = () => {
    if (typeof window !== "undefined") {
      const global = window as any;
      if (global.REPLAY_CLIENT_RECORDER_PENDING_REQUEST_COUNT == null) {
        global.REPLAY_CLIENT_RECORDER_PENDING_REQUEST_COUNT = 1;
      } else {
        global.REPLAY_CLIENT_RECORDER_PENDING_REQUEST_COUNT++;
      }
    }
  };

  // Playwright test runner might listen to the data logged by printInstructions() to update test fixtures.
  // In that case, it's important that it waits until all pending async requests have been resolved.
  // See playwright/tests/utils/testSetup.ts
  const resolvePendingClientRequest = () => {
    if (typeof window !== "undefined") {
      const global = window as any;
      global.REPLAY_CLIENT_RECORDER_PENDING_REQUEST_COUNT--;
    }
  };

  const printInstructions = () => {
    console.log(`
      const ACCESS_TOKEN = ${hasAccessToken ? `"${FAKE_ACCESS_TOKEN}"` : null};
      const RECORDING_ID = getFlag("recordingId") || "${recordingId}";
      const replayClient = createReplayClientForPlaywrightTesting(
        \`${encode(logEntries)}\`
      );
    `);
  };

  const proxyReplayClient = new Proxy(replayClient, {
    get(target: any, prop: string) {
      return (...args: any[]) => {
        const result = target[prop](...args);

        if (prop === "initialize") {
          // client.initialize() receives the recording ID and (optionally) access token.
          // This access token is sensitive and shouldn't be recorded.
          recordingId = args[0];
          if (typeof args[1] === "string") {
            args[1] = FAKE_ACCESS_TOKEN;
            hasAccessToken = true;
          }
        }

        const entry: LogEntry = { args: args, isAsync: false, method: prop, result: result };

        if (findMatch(logEntries, prop, args) === null) {
          logEntries.push(entry);
        }

        // Unwrap Promise values
        if (result != null && typeof result.then === "function") {
          entry.isAsync = true;

          flagPendingClientRequest();

          result.then((resolved: any) => {
            entry.result = resolved;

            printInstructions();

            resolvePendingClientRequest();
          });
        } else {
          printInstructions();
        }

        return result;
      };
    },
  });

  return proxyReplayClient;
}
