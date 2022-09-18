import { Wakeable } from "bvaughn-architecture-demo/src/suspense/types";
import { createWakeable } from "bvaughn-architecture-demo/src/utils/suspense";
import { ThreadFront } from "protocol/thread";
import { useContext, useMemo } from "react";
import createReplayClientPlayer from "shared/client/createReplayClientPlayer";
import createReplayClientRecorder from "shared/client/createReplayClientRecorder";
import { decode } from "shared/client/encoder";
import { ReplayClient } from "shared/client/ReplayClient";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";

import { getFlag, hasFlag } from "./url";

// By default, this context wires the app up to use real Replay backend APIs.
// We can leverage this when writing tests (or UI demos) by injecting a stub client.
let DISPATCH_URL = process.env.DISPATCH_ADDRESS || "wss://dispatch.replay.io";
if (typeof window !== "undefined") {
  const url = new URL(window.location.href);
  if (url.searchParams.has("dispatch")) {
    DISPATCH_URL = url.searchParams.get("dispatch") as string;
  }
}

export function createReplayClientForProduction(): ReplayClientInterface {
  return new ReplayClient(DISPATCH_URL, ThreadFront);
}

let caughtError: Error | null = null;
let encoded: string | null = null;
let wakeable: Wakeable<string> | null = null;
function getEncoded(host: string, fixtureDataPath: string): string {
  if (encoded === null) {
    if (caughtError !== null) {
      throw caughtError;
    } else if (wakeable === null) {
      wakeable = createWakeable<string>();
      fetch(`http://${host}:3000/api/data?fixtureDataPath=${fixtureDataPath}`)
        .then(async response => {
          encoded = await response.text();

          wakeable!.resolve(encoded);
          wakeable = null;
        })
        .catch(error => {
          caughtError = error;

          wakeable!.reject(error);
          wakeable = null;
        });
    }

    throw wakeable;
  }

  return encoded;
}

export function useReplayClientForTesting(): ReplayClientInterface {
  const replayClient = useContext(ReplayClientContext);

  const fixtureDataPath = getFlag("fixtureDataPath");
  const host = getFlag("host");
  const record = hasFlag("record");

  const memoizedReplayClient = useMemo<ReplayClientInterface>(() => {
    if (host && fixtureDataPath) {
      const encoded = getEncoded(host, fixtureDataPath);
      const decoded = decode(encoded);
      return createReplayClientPlayer(decoded);
    } else {
      if (record) {
        return createReplayClientRecorder(replayClient);
      } else {
        return replayClient;
      }
    }
  }, [fixtureDataPath, host, record, replayClient]);

  return memoizedReplayClient;
}
