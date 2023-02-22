import { AnalysisEntry, PointDescription } from "@replayio/protocol";

import { AnalysisParams } from "protocol/analysisManager";
import createPlayer from "shared/proxy/createPlayer";
import { Entry } from "shared/proxy/types";

import { ReplayClientInterface } from "./types";

export default function createReplayClientPlayer(entries: Entry[]): ReplayClientInterface {
  return createPlayer<ReplayClientInterface>(entries, {
    overrides: {
      streamAnalysis(
        logEntry: Entry,
        params: AnalysisParams,
        handlers: {
          onPoints?: (points: PointDescription[]) => void;
          onResults?: (results: AnalysisEntry[]) => void;
          onError?: (error: any) => void;
        }
      ) {
        const { paramCalls } = logEntry;

        if (paramCalls) {
          const { onPoints, onResults, onError } = handlers;
          paramCalls.forEach(call => {
            const callback = [onPoints, onResults, onError][call[0]];
            callback?.(call[1][0]);
          });
        }

        return {
          pointsFinished: Promise.resolve(),
          resultsFinished: Promise.resolve(),
        };
      },
    },
  });
}
