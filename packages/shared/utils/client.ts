import { TimeStampedPoint } from "@replayio/protocol";
import { useContext, useLayoutEffect, useMemo } from "react";
import { Deferred, createDeferred } from "suspense";

import { ThreadFront } from "protocol/thread";
import {
  addCachedPointsForTimeListener,
  preCacheExecutionPointForTime,
} from "replay-next/src/suspense/ExecutionPointsCache";
import createReplayClientPlayer from "shared/client/createReplayClientPlayer";
import createReplayClientRecorder from "shared/client/createReplayClientRecorder";
import { decode } from "shared/client/encoder";
import { ReplayClient } from "shared/client/ReplayClient";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";

import { getFlag, hasFlag } from "./url";

type ReplayClientRecorderAdditionalData = {
  points: TimeStampedPoint[];
};

declare global {
  interface Window {
    // Share this data with the Playwright test runner via a global.
    REPLAY_CLIENT_RECORDER_ADDITIONAL_DATA?: ReplayClientRecorderAdditionalData;
  }
}

// By default, this context wires the app up to use real Replay backend APIs.
// We can leverage this when writing tests (or UI demos) by injecting a stub client.
let DISPATCH_URL =
  process.env.DISPATCH_ADDRESS ||
  process.env.NEXT_PUBLIC_DISPATCH_URL ||
  "wss://dispatch.replay.io";
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
let deferred: Deferred<string> | null = null;
function getEncodedSuspense(host: string, fixtureDataPath: string): string {
  if (encoded === null) {
    if (caughtError !== null) {
      throw caughtError;
    } else if (deferred === null) {
      deferred = createDeferred<string>(`getEncodedSuspense`);
      fetch(`http://${host}:3000/api/data?fixtureDataPath=${fixtureDataPath}`)
        .then(async response => {
          encoded = await response.text();

          deferred!.resolve(encoded);
          deferred = null;
        })
        .catch(error => {
          caughtError = error;

          deferred!.reject(error);
          deferred = null;
        });
    }

    throw deferred;
  }

  return encoded;
}

export function useReplayClientForTesting(): ReplayClientInterface {
  const replayClient = useContext(ReplayClientContext);

  const debug = hasFlag("debug");
  const fixtureDataPath = getFlag("fixtureDataPath");
  const host = getFlag("host");
  const record = hasFlag("record");

  // Proxy Replay API commands to the backend.
  // During test "recording" we write these to a fixtures file.
  // During CI test runs ("playback") we use the fixture data to mock out the backend.
  const memoizedReplayClient = useMemo<ReplayClientInterface>(() => {
    if (debug) {
      return replayClient;
    } else if (host && fixtureDataPath) {
      const encoded = getEncodedSuspense(host, fixtureDataPath);
      const decoded = decode(encoded);

      const { additionalData, entries } = decoded;

      if (additionalData) {
        additionalData.points.forEach((timeStampedPoint: TimeStampedPoint) => {
          preCacheExecutionPointForTime(timeStampedPoint);
        });
      }

      return createReplayClientPlayer(entries);
    } else {
      if (record) {
        return createReplayClientRecorder(replayClient);
      } else {
        return replayClient;
      }
    }
  }, [debug, fixtureDataPath, host, record, replayClient]);

  // Some data doesn't get handled by the proxy approach above.
  // Specifically, data that deals with events.
  // In most cases this does not matter, but for Suspense caches like PointsCache it is important.
  // So we separately cache this data during unmount as well.
  useLayoutEffect(() => {
    if (record) {
      // Share this data with the Playwright test runner via a global.
      window.REPLAY_CLIENT_RECORDER_ADDITIONAL_DATA = {
        points: [],
      };
      return addCachedPointsForTimeListener((timeStampedPoint: TimeStampedPoint) => {
        window.REPLAY_CLIENT_RECORDER_ADDITIONAL_DATA!.points.push(timeStampedPoint);
      });
    }
  }, [record, replayClient]);

  return memoizedReplayClient;
}
