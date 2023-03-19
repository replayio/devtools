import {
  RequestBodyData,
  RequestEventInfo,
  RequestInfo,
  ResponseBodyData,
} from "@replayio/protocol";
import sortBy from "lodash/sortBy";
import sortedUniqBy from "lodash/sortedUniqBy";
import { createSelector } from "reselect";

import { NetworkAction } from "ui/actions/network";
import { partialRequestsToCompleteSummaries } from "ui/components/NetworkMonitor/utils";
import { UIState } from "ui/state";
import { filterToFocusRegion } from "ui/utils/timeline";

import { getFocusRegion } from "./timeline";

export type NetworkState = {
  events: RequestEventInfo[];
  loading: boolean;
  responseBodies: Record<string, ResponseBodyData[]>;
  requestBodies: Record<string, RequestBodyData[]>;
  requests: RequestInfo[];
  selectedRequestId: string | null;
};

const initialState = (): NetworkState => ({
  events: [],
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
        requests: sortBy(state.requests, request => BigInt(request.point)),
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

export const getFocusedEvents = createSelector(getEvents, getFocusRegion, (events, focusRegion) => {
  if (!focusRegion) {
    return events;
  }
  return events.filter(e => e.time > focusRegion.begin.time && e.time <= focusRegion.end.time);
});

type GetFocusedRequestsReturn = [
  requests: RequestInfo[],
  filterBeforeCount: number,
  filterAfterCount: number
];

export const getFocusedRequests = createSelector(
  getRequests,
  getFocusRegion,
  (requests, focusRegion): GetFocusedRequestsReturn => {
    let filteredRequests = requests;
    let filteredBeforeCount = 0;
    let filteredAfterCount = 0;

    if (focusRegion != null) {
      [filteredRequests, filteredBeforeCount, filteredAfterCount] = filterToFocusRegion(
        filteredRequests,
        focusRegion
      );
    }

    return [filteredRequests, filteredBeforeCount, filteredAfterCount];
  }
);

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
export const getSelectedRequestBodyForId = (state: UIState, id: string) => {
  return id ? getRequestBodies(state)[id] : null;
};
export const getSelectedRequestBody = (state: UIState) => {
  const requestId = getSelectedRequestId(state);
  return requestId ? getRequestBodies(state)[requestId] : null;
};

export default update;
