import { PauseData, PointDescription } from "@replayio/protocol";

import {
  AnalysisInput,
  AnalysisResultWrapper,
  SendCommand,
  getFunctionBody,
} from "protocol/evaluation-utils";

import { createInfallibleSuspenseCache } from "../utils/suspense";
import { AnalysisParams, RemoteAnalysisResult, createAnalysisCache } from "./AnalysisCache";

export type UncaughtException = PointDescription & {
  type: "UncaughtException";
};

// Variables in scope in an analysis
declare let sendCommand: SendCommand;
declare let input: AnalysisInput;

// This function will be evaluated on the server!
function exceptionsMapper(): AnalysisResultWrapper<RemoteAnalysisResult>[] {
  const finalData: Required<PauseData> = { frames: [], scopes: [], objects: [] };

  function addPauseData({ frames, scopes, objects }: PauseData) {
    finalData.frames.push(...(frames || []));
    finalData.scopes.push(...(scopes || []));
    finalData.objects.push(...(objects || []));
  }

  const { pauseId, point, time } = input;

  const { data: exceptionValueData, exception } = sendCommand("Pause.getExceptionValue", {});
  addPauseData(exceptionValueData);

  const { data: allFramesData, frame: frameId } = sendCommand("Pause.getTopFrame", {});
  addPauseData(allFramesData);

  const topFrame = finalData.frames.find(f => f.frameId === frameId)!;
  const location = topFrame.location;

  return [
    {
      key: time,
      value: {
        data: finalData,
        location,
        pauseId,
        point,
        time,
        values: [exception!],
      },
    },
  ];
}

export const exceptionsCache = createAnalysisCache<UncaughtException, []>(
  "ExceptionsCache",
  () => analysisParams,
  transformPoint
);

const analysisParams: AnalysisParams = {
  exceptions: true,
  mapper: getFunctionBody(exceptionsMapper),
};

function transformPoint(pointDescription: PointDescription): UncaughtException {
  return { type: "UncaughtException", ...pointDescription };
}

export const getInfallibleExceptionPointsSuspense = createInfallibleSuspenseCache(
  exceptionsCache.pointsIntervalCache.read
);
