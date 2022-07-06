import { findMatch } from "shared/utils/client";
import { encode } from "./encoder";
import { ReplayClientInterface, LogEntry } from "./types";

const FAKE_ACCESS_TOKEN = "<fake-access-token>";

if (typeof window !== "undefined") {
  // TODO Document this dependency.
  // @ts-ignore
  window.pendingClientRequests = 0;
}

export default function createReplayClientRecorder(
  replayClient: ReplayClientInterface
): ReplayClientInterface {
  const logEntries: LogEntry[] = [];

  let hasAccessToken = false;
  let recordingId: string | null = null;

  const printInstructions = () => {
    console.log(`
      const ACCESS_TOKEN = ${hasAccessToken ? `"${FAKE_ACCESS_TOKEN}"` : null};
      const RECORDING_ID = "${recordingId}";
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

          if (typeof window !== "undefined") {
            // @ts-ignore
            window.pendingClientRequests++;
          }

          result.then((resolved: any) => {
            entry.result = resolved;

            printInstructions();

            if (typeof window !== "undefined") {
              // @ts-ignore
              window.pendingClientRequests--;
            }
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
