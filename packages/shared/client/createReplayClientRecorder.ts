import { encode } from "./encoder";
import { ReplayClientInterface, LogEntry } from "./types";

const FAKE_ACCESS_TOKEN = "<fake-access-token>";
const FAKE_RECORDING_ID = "<fake-recording-id>";

export default function createReplayClientRecorder(
  replayClient: ReplayClientInterface
): ReplayClientInterface {
  const logEntries: LogEntry[] = [];
  let hasAccessToken = false;

  const printInstructions = () => {
    console.log(`
      const ACCESS_TOKEN = ${hasAccessToken ? `"${FAKE_ACCESS_TOKEN}"` : null};
      const RECORDING_ID = "${FAKE_RECORDING_ID}";
      const replayClientPlayer = createReplayClientPlayer(
        decode(\`${encode(logEntries)}\`)
      );
    `);
  };

  const proxyReplayClient = new Proxy(replayClient, {
    get(target: any, prop: string) {
      return (...args: any[]) => {
        const result = target[prop](...args);

        if (prop === "initialize") {
          // client.initialize() receives the recording ID and (optionally) access token.
          // This info is sensitive and so it shouldn't be recorded.
          args[0] = FAKE_RECORDING_ID;
          if (typeof args[1] === "string") {
            args[1] = FAKE_ACCESS_TOKEN;
            hasAccessToken = true;
          }
        }

        const entry: LogEntry = { args: args, isAsync: false, method: prop, result: result };

        logEntries.push(entry);

        // Unwrap Promise values
        if (result != null && typeof result.then === "function") {
          entry.isAsync = true;

          result.then((resolved: any) => {
            entry.result = resolved;

            printInstructions();
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
