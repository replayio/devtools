import { RequestEventInfo, RequestInfo } from "@recordreplay/protocol";
import { UIState } from "ui/state";
import { NetworkAction } from "ui/actions/network";
import { WiredFrame } from "protocol/thread/pause";
import { createSelector } from "reselect";
import { getSources } from "devtools/client/debugger/src/reducers/sources";
import { formatCallStackFrames } from "devtools/client/debugger/src/selectors/getCallStackFrames";

export type NetworkState = {
  events: RequestEventInfo[];
  frames: Record<string, WiredFrame[]>;
  requests: RequestInfo[];
};

const initialState = (): NetworkState => ({
  events: [],
  frames: {},
  requests: [],
});

const update = (state: NetworkState = initialState(), action: NetworkAction): NetworkState => {
  switch (action.type) {
    case "NEW_NETWORK_REQUESTS":
      return {
        ...state,
        events: [...action.payload.events, ...state.events],
        requests: [...action.payload.requests, ...state.requests],
      };
    case "SET_FRAMES":
      return {
        ...state,
        frames: {
          ...state.frames,
          [action.payload.point]: action.payload.frames,
        },
      };
    default:
      return state;
  }
};

export const getEvents = (state: UIState) => state.network.events;
export const getRequests = (state: UIState) => state.network.requests;
export const getFrames = (state: UIState) => state.network.frames;

export const getFormattedFrames = createSelector(getFrames, getSources, (frames, sources) => {
  return Object.keys(frames).reduce((acc: Record<string, WiredFrame[]>, frame) => {
    return { ...acc, [frame]: formatCallStackFrames(frames[frame], sources) };
  }, {});
});

export default update;
