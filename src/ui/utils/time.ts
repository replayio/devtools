import { ExecutionPoint, PointDescription } from "@recordreplay/protocol";
import { padStart } from "lodash";
import analysisManager from "protocol/analysisManager";
import { ThreadFront } from "protocol/thread";

export async function convertPointToTime(executionPoint: ExecutionPoint): Promise<number> {
  return new Promise(async resolve => {
    await analysisManager.runAnalysis(
      {
        effectful: false,
        mapper: "return [];",
        points: [executionPoint],
        sessionId: ThreadFront.sessionId!,
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

export function msToMinutes(ms: number) {
  const seconds = Math.round(ms / 1000.0);
  return `${Math.floor(seconds / 60)}:${padStart(String(seconds % 60), 2, "0")}`;
}

export function msToSeconds(ms: number) {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  } else {
    return `${(ms / 1000).toPrecision(2)}s`;
  }
}
