import { RequestInfo, RequestEventInfo, TimeStampedPoint } from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";
import { AppDispatch } from "ui/setup";
import { createFrame } from "devtools/client/debugger/src/client/create";

export const NEW_NETWORK_REQUESTS = "NEW_NETWORK_REQUESTS";

type NewNetworkRequestsAction = {
  type: "NEW_NETWORK_REQUESTS";
  payload: { requests: RequestInfo[]; events: RequestEventInfo[] };
};

type SetFramesAction = {
  type: "SET_FRAMES";
  payload: { frames: any[]; point: string };
};

export type NetworkAction = NewNetworkRequestsAction | SetFramesAction;

export const newNetworkRequests = ({
  requests,
  events,
}: {
  requests: RequestInfo[];
  events: RequestEventInfo[];
}): NewNetworkRequestsAction => ({
  type: "NEW_NETWORK_REQUESTS",
  payload: { requests, events },
});

export function fetchFrames(tsPoint: TimeStampedPoint) {
  return async ({ dispatch }: { dispatch: AppDispatch }) => {
    const pause = ThreadFront.ensurePause(tsPoint.point, tsPoint.time);
    const frames = (await pause.getFrames())?.filter(Boolean) || [];
    const formattedFrames = await Promise.all(frames?.map((frame, i) => createFrame(frame, i)));
    dispatch({
      type: "SET_FRAMES",
      payload: { frames: formattedFrames, point: tsPoint.point },
    });
  };
}
