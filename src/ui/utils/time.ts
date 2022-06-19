import { ExecutionPoint, PointDescription } from "@replayio/protocol";
import padStart from "lodash/padStart";
import prettyMilliseconds from "pretty-ms";
import analysisManager from "protocol/analysisManager";

export async function convertPointToTime(executionPoint: ExecutionPoint): Promise<number> {
  return new Promise(async resolve => {
    await analysisManager.runAnalysis(
      {
        effectful: false,
        mapper: "return [];",
        points: [executionPoint],
      },
      {
        onAnalysisPoints: (points: PointDescription[]) => {
          if (points.length > 0) {
            const point = points[0];
            resolve(point.time);
          } else {
            resolve(-1);
          }
        },
      }
    );
  });
}

export function formatDuration(ms: number) {
  return prettyMilliseconds(ms, { millisecondsDecimalDigits: 1 });
}

export function formatTimestamp(ms: number) {
  const seconds = Math.round(ms / 1000.0);
  return `${Math.floor(seconds / 60)}:${padStart(String(seconds % 60), 2, "0")}`;
}
