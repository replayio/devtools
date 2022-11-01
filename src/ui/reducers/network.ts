import {
  RequestBodyData,
  RequestEventInfo,
  RequestInfo,
  ResponseBodyData,
} from "@replayio/protocol";
import sortBy from "lodash/sortBy";
import sortedUniqBy from "lodash/sortedUniqBy";
import { createSelector } from "reselect";
import { isPointInRegions } from "shared/utils/time";
import { NetworkAction } from "ui/actions/network";
import { partialRequestsToCompleteSummaries } from "ui/components/NetworkMonitor/utils";
import { UIState } from "ui/state";
import {
  displayedBeginForFocusRegion,
  displayedEndForFocusRegion,
  filterToFocusRegion,
} from "ui/utils/timeline";

import { getLoadedRegions } from "./app";
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
  const beginTime = displayedBeginForFocusRegion(focusRegion);
  const endTime = displayedEndForFocusRegion(focusRegion);
  return events.filter(e => e.time > beginTime && e.time <= endTime);
});

type GetFocusedRequestsReturn = [
  requests: RequestInfo[],
  filterBeforeCount: number,
  filterAfterCount: number,
  filterTotalCount: number
];

export const getFocusedRequests = createSelector(
  getLoadedRegions,
  getRequests,
  getFocusRegion,
  (regions, requests, focusRegion): GetFocusedRequestsReturn => {
    const loadedRegions = regions?.loaded;
    if (loadedRegions == null || loadedRegions.length === 0) {
      return [[], 0, 0, requests.length];
    }

    let filteredBeforeCount = 0;
    let filteredAfterCount = 0;
    let filterTotalCount = 0;

    // TODO [FE-865] Can we skip this if there are no loading/unloaded regions?

    // TODO [FE-865] If loaded and focused regions are both present, but don't overlap, return only the total count.

    let earliestLoadedPoint: BigInt | null = null;
    let latestLoadedPoint: BigInt | null = null;
    loadedRegions.forEach(region => {
      const beginPoint = BigInt(region.begin.point);
      if (earliestLoadedPoint == null || beginPoint < earliestLoadedPoint) {
        earliestLoadedPoint = beginPoint;
      }
      const endPoint = BigInt(region.end.point);
      if (latestLoadedPoint == null || endPoint > latestLoadedPoint) {
        latestLoadedPoint = endPoint;
      }
    });

    let filteredRequests = requests.filter(request => {
      const isInLoadedRegion = isPointInRegions(request.point, loadedRegions);

      if (!isInLoadedRegion) {
        filterTotalCount++;

        const point = BigInt(request.point);
        if (point < earliestLoadedPoint!) {
          filteredBeforeCount++;
        } else if (point > earliestLoadedPoint!) {
          filteredAfterCount++;
        }
      }

      return isInLoadedRegion;
    });

    if (focusRegion) {
      const result = filterToFocusRegion(filteredRequests, focusRegion);
      filteredRequests = result[0];
      filteredBeforeCount += result[1];
      filteredAfterCount += result[2];
      filterTotalCount += result[1] + result[2];
    }

    return [filteredRequests, filteredBeforeCount, filteredAfterCount, filterTotalCount];
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
export const getSelectedRequestBody = (state: UIState) => {
  const requestId = getSelectedRequestId(state);
  return requestId ? getRequestBodies(state)[requestId] : null;
};

export default update;
