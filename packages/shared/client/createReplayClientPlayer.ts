import { findMatch } from "shared/utils/client";

import { ReplayClientInterface, LogEntry } from "./types";

export default function createReplayClientPlayer(logEntries: LogEntry[]): ReplayClientInterface {
  const proxyReplayClient = new Proxy(
    {},
    {
      get(_: any, prop: string) {
        return (...args: any[]) => {
          const logEntry = findMatch(logEntries, prop, args);
          if (logEntry != null) {
            const { isAsync, result } = logEntry;
            return isAsync ? Promise.resolve(result) : result;
          } else {
            if (
              typeof prop === "symbol" &&
              (prop as Symbol).toString().includes("Symbol.iterator")
            ) {
              return undefined;
            }

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
