import { ExecutionPoint, PointDescription } from "@recordreplay/protocol";
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
