import {
  AnalysisEntry,
  PointDescription,
  SearchSourceContentsMatch,
  SourceId,
  sourceContentsChunk,
  sourceContentsInfo,
} from "@replayio/protocol";

import { AnalysisParams } from "protocol/analysisManager";
import createRecorder, { RecorderAPI } from "shared/proxy/createRecorder";
import { Entry } from "shared/proxy/types";

import { encode } from "./encoder";
import { ReplayClientInterface } from "./types";

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

  async function searchSources(
    options: { limit: number; query: string; sourceIds: SourceId[] },
    onMatches: (matches: SearchSourceContentsMatch[], didOverflow: boolean) => void
  ) {
    const recorderAPI = arguments[arguments.length - 1] as RecorderAPI;
    const flushRecord = recorderAPI.holdUntil();

    const onMatchesWrapper = (matches: SearchSourceContentsMatch[], didOverflow: boolean) => {
      recorderAPI.callParamWithArgs(1, matches, didOverflow);
      onMatches(matches, didOverflow);
    };

    await replayClient.searchSources(options, onMatchesWrapper);

    // Let the Proxy know that all events are complete and it's safe to write the entry.
    flushRecord();
  }

  async function streamSourceContents(
    sourceId: SourceId,
    onSourceContentsInfo: (params: sourceContentsInfo) => void,
    onSourceContentsChunk: (params: sourceContentsChunk) => void
  ) {
    const recorderAPI = arguments[arguments.length - 1] as RecorderAPI;
    const flushRecord = recorderAPI.holdUntil();

    const onSourceContentsChunkWrapper = (params: sourceContentsChunk) => {
      recorderAPI.callParamWithArgs(2, params);
      onSourceContentsChunk(params);
    };

    const onSourceContentsInfoWrapper = (params: sourceContentsInfo) => {
      recorderAPI.callParamWithArgs(1, params);
      onSourceContentsInfo(params);
    };

    await replayClient.streamSourceContents(
      sourceId,
      onSourceContentsInfoWrapper,
      onSourceContentsChunkWrapper
    );

    // This call is necessary to let the Proxy know that it's safe to write the entry.
    flushRecord();
  }

  function streamAnalysis(
    params: AnalysisParams,
    handlers: {
      onPoints?: (points: PointDescription[]) => void;
      onResults?: (results: AnalysisEntry[]) => void;
      onError?: (error: any) => void;
    }
  ) {
    const recorderAPI = arguments[arguments.length - 1] as RecorderAPI;
    const flushRecord = recorderAPI.holdUntil();
    const { onPoints, onResults, onError } = handlers;

    const onPointsWrapper = onPoints
      ? (points: PointDescription[]) => {
          recorderAPI.callParamWithArgs(0, points);
          onPoints?.(points);
        }
      : undefined;

    const onResultsWrapper = onResults
      ? (results: AnalysisEntry[]) => {
          recorderAPI.callParamWithArgs(1, results);
          onResults?.(results);
        }
      : undefined;

    const onErrorWrapper = onError
      ? (error: any) => {
          recorderAPI.callParamWithArgs(2, error);
          onError?.(error);
        }
      : undefined;

    const { pointsFinished, resultsFinished } = replayClient.streamAnalysis(params, {
      onPoints: onPointsWrapper,
      onResults: onResultsWrapper,
      onError: onErrorWrapper,
    });

    onAsyncRequestPending();

    resultsFinished.then(() => {
      onAsyncRequestResolved();
      flushRecord();
    });

    return {
      pointsFinished,
      resultsFinished,
    };
  }

  const [proxyReplayClient] = createRecorder<ReplayClientInterface>(replayClient, {
    onAsyncRequestPending,
    onAsyncRequestResolved,
    onEntriesChanged,
    sanitizeArgs,
    overrides: { searchSources, streamAnalysis, streamSourceContents },
  });

  return proxyReplayClient;
}
