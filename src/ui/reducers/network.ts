import {
  RequestBodyData,
  RequestEventInfo,
  RequestInfo,
  ResponseBodyData,
} from "@replayio/protocol";

import { UIState } from "ui/state";
import { NetworkAction } from "ui/actions/network";
import { WiredFrame } from "protocol/thread/pause";
import { createSelector } from "reselect";
import { getSources } from "devtools/client/debugger/src/reducers/sources";
import { formatCallStackFrames } from "devtools/client/debugger/src/selectors/getCallStackFrames";
import sortBy from "lodash/sortBy";
import sortedUniqBy from "lodash/sortedUniqBy";
import { getFocusRegion } from "./timeline";
import { partialRequestsToCompleteSummaries } from "ui/components/NetworkMonitor/utils";
import {
  endTimeForFocusRegion,
  filterToFocusRegion,
  startTimeForFocusRegion,
} from "ui/utils/timeline";

export type NetworkState = {
  events: RequestEventInfo[];
  frames: Record<string, WiredFrame[]>;
  loading: boolean;
  responseBodies: Record<string, ResponseBodyData[]>;
  requestBodies: Record<string, RequestBodyData[]>;
  requests: RequestInfo[];
  selectedRequestId: string | null;
};

const initialState = (): NetworkState => ({
  events: [],
  frames: {},
  loading: true,
  requests: [],
  responseBodies: {},
  requestBodies: {},
  selectedRequestId: null,
});

const update = (state: NetworkState = initialState(), action: NetworkAction): NetworkState => {
  switch (action.type) {
    case "NETWORK_REQUESTS_LOADED":
      return {
        ...state,
        loading: false,
      };
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
    case "SHOW_REQUEST_DETAILS":
      return {
        ...state,
        selectedRequestId: action.requestId,
      };
    case "HIDE_REQUEST_DETAILS":
      return {
        ...state,
        selectedRequestId: null,
      };
    default:
      return state;
  }
};

export const getEvents = (state: UIState) => state.network.events;
export const getRequests = (state: UIState) => state.network.requests;
export const getFrames = (state: UIState) => state.network.frames;
export const getFocusedEvents = (state: UIState) => {
  const events = getEvents(state);
  const focusRegion = getFocusRegion(state);

  if (!focusRegion) {
    return events;
  }
  const startTime = startTimeForFocusRegion(focusRegion);
  const endTime = endTimeForFocusRegion(focusRegion);
  return events.filter(e => e.time > startTime && e.time <= endTime);
};
export const getFocusedRequests = (state: UIState) => {
  const requests = getRequests(state);
  const focusRegion = getFocusRegion(state);

  return filterToFocusRegion(requests, focusRegion);
};

export const getFormattedFrames = createSelector(getFrames, getSources, (frames, sources) => {
  return Object.keys(frames).reduce((acc: Record<string, WiredFrame[]>, frame) => {
    // @ts-ignore WiredFrame vs SelectedFrame mismatch
    return { ...acc, [frame]: formatCallStackFrames(frames[frame], sources) };
  }, {});
});

export const getResponseBodies = (state: UIState) => state.network.responseBodies;
export const getRequestBodies = (state: UIState) => state.network.requestBodies;
export const getSelectedRequestId = (state: UIState) => state.network.selectedRequestId;
export const getSummaryById = (state: UIState, id: string) => {
  const summaries = partialRequestsToCompleteSummaries(
    getRequests(state),
    getEvents(state),
    new Set()
  );
  return summaries.find(s => s.id === id);
};
export const getRequestById = (state: UIState, id: string) =>
  state.network.requests.find(request => request.id === id);

export const getSelectedResponseBody = (state: UIState) => {
  const requestId = getSelectedRequestId(state);
  return requestId ? getResponseBodies(state)[requestId] : null;
};
export const getSelectedRequestBody = (state: UIState) => {
  const requestId = getSelectedRequestId(state);
  return requestId ? getRequestBodies(state)[requestId] : null;
};

export default update;
