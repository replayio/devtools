import { PointDescription } from "@replayio/protocol";

import { getAnalysisCache } from "./NewAnalysisCache";

export type UncaughtException = PointDescription & {
  type: "UncaughtException";
};

type Callback = () => void;
export type Status = "failed-too-many-points" | "fetched" | "request-in-progress" | "uninitialized";

const tooManyPointsListeners: Set<Callback> = new Set();

export function getStatus(): Status {
  return "uninitialized"; //TODO
}

export function subscribeForStatus(callback: Callback): Callback {
  tooManyPointsListeners.add(callback);
  return function unsubscribeFromStatus() {
    tooManyPointsListeners.delete(callback);
  };
}

const EXCEPTIONS_MAPPER = `
  const finalData = { frames: [], scopes: [], objects: [] };

  function addPauseData({ frames, scopes, objects }) {
    finalData.frames.push(...(frames || []));
    finalData.scopes.push(...(scopes || []));
    finalData.objects.push(...(objects || []));
  }

  const { pauseId, point, time } = input;

  const {
    data: exceptionValueData,
    exception,
  } = sendCommand("Pause.getExceptionValue");
  addPauseData(exceptionValueData);

  const {
    data: allFramesData,
    frames,
  } = sendCommand("Pause.getAllFrames");
  addPauseData(allFramesData);

  const topFrame = finalData.frames.find(f => f.frameId === frames[0]);
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
        values: [exception],
      },
    },
  ];
`;

export const {
  getPointsSuspense: getExceptionPointsSuspense,
  getPointsAsync: getExceptionPointsAsync,
  getCachedPoints: getCachedExceptionPoints,
  getResultSuspense: getExceptionSuspense,
  getResultAsync: getExceptionAsync,
  getResultIfCached: getExceptionIfCached,
} = getAnalysisCache<UncaughtException>(
  {
    exceptions: true,
    mapper: EXCEPTIONS_MAPPER,
  },
  point => ({ ...point, type: "UncaughtException" })
);
