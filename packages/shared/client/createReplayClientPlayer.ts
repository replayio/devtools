import difference from "lodash/difference";
import isEqual from "lodash/isEqual";

import { ReplayClientInterface, LogEntry } from "./types";

export default function createReplayClientPlayer(logEntries: LogEntry[]): ReplayClientInterface {
  const proxyReplayClient = new Proxy(
    {},
    {
      get(_: any, prop: string) {
        return (...args: any[]) => {
          const index = logEntries.findIndex(logEntry => {
            if (logEntry.method !== prop) {
              return false;
            } else if (logEntry.args.length !== args.length) {
              return false;
            } else {
              for (let index = 0; index < args.length; index++) {
                if (!isEqual(args[index], logEntry.args[index])) {
                  return false;
                }
              }
            }

            return true;
          });

          if (index >= 0) {
            const { isAsync, result } = logEntries[index];
            return isAsync ? Promise.resolve(result) : result;
          } else {
            throw Error(
              `Could not find matching log entry for method "${prop}" with args ${JSON.stringify(
                args
              )}`
            );
          }
        };
      },
    }
  );

  return proxyReplayClient;
}
