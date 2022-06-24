import { ReplayClientInterface, LogEntry } from "./types";

export default function createReplayClientRecorder(
  replayClient: ReplayClientInterface
): ReplayClientInterface {
  const logEntries: LogEntry[] = [];

  const printInstructions = () => {
    console.log(`
      const replayClientPlayer = createReplayClientPlayer(
        JSON.parse(\`${JSON.stringify(logEntries)}\`)
      );
    `);
  };

  const proxyReplayClient = new Proxy(replayClient, {
    get(target: any, prop: string) {
      return (...args: any[]) => {
        const result = target[prop](...args);
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
