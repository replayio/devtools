import {
  RequestBodyData,
  RequestEventInfo,
  RequestInfo,
  ResponseBodyData,
} from "@recordreplay/protocol";

import { UIState } from "ui/state";
import { NetworkAction } from "ui/actions/network";
import { WiredFrame } from "protocol/thread/pause";
import { createSelector } from "reselect";
import { getSources } from "devtools/client/debugger/src/reducers/sources";
import { formatCallStackFrames } from "devtools/client/debugger/src/selectors/getCallStackFrames";
import sortBy from "lodash/sortBy";
import sortedUniqBy from "lodash/sortedUniqBy";

export type NetworkState = {
  events: RequestEventInfo[];
  frames: Record<string, WiredFrame[]>;
  responseBodies: Record<string, ResponseBodyData[]>;
  requestBodies: Record<string, RequestBodyData[]>;
  requests: RequestInfo[];
};

const initialState = (): NetworkState => ({
  events: [],
  frames: {},
  requests: [],
  responseBodies: {},
  requestBodies: {},
});

const update = (state: NetworkState = initialState(), action: NetworkAction): NetworkState => {
  switch (action.type) {
    case "NEW_NETWORK_REQUESTS":
      return {
        ...state,
        events: [...action.payload.events, ...state.events],
        requests: [...action.payload.requests, ...state.requests],
      };
    case "NEW_RESPONSE_BODY_PARTS":
      return {
        ...state,
        responseBodies: {
          ...state.responseBodies,
          [action.payload.responseBodyParts.id]: sortedUniqBy(
            sortBy([
              ...(state.responseBodies[action.payload.responseBodyParts.id] || []),
              ...action.payload.responseBodyParts.parts,
            ]),
            (x: ResponseBodyData) => x.offset
          ),
        },
      };
    case "NEW_REQUEST_BODY_PARTS":
      return {
        ...state,
        requestBodies: {
          ...state.requestBodies,
          [action.payload.requestBodyParts.id]: sortedUniqBy(
            sortBy([
              ...(state.requestBodies[action.payload.requestBodyParts.id] || []),
              ...action.payload.requestBodyParts.parts,
            ]),
            (x: RequestBodyData) => x.offset
          ),
        },
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

export const getResponseBodies = (state: UIState) => state.network.responseBodies;
export const getRequestBodies = (state: UIState) => state.network.requestBodies;

export default update;
