import { createSelector } from "reselect";
import { RequestEventInfo, RequestInfo } from "@recordreplay/protocol";
import { UIState } from "ui/state";
import { NetworkAction } from "ui/actions/network";

export type NetworkState = {
  events: RequestEventInfo[];
  requests: RequestInfo[];
};

const initialState = (): NetworkState => ({
  events: [],
  requests: [],
});

const update = (state: NetworkState = initialState(), action: NetworkAction): NetworkState => {
  switch (action.type) {
    case "NEW_NETWORK_REQUESTS":
      return {
        events: [...action.payload.events, ...state.events],
        requests: [...action.payload.requests, ...state.requests],
      };
    default:
      return state;
  }
};

const getEvents = (state: UIState) => state.network.events;
const getRequests = (state: UIState) => state.network.requests;

export const selectors = {
  getEvents,
  getRequests,
  getNetworkRequests: createSelector(getEvents, getRequests, (events, requests) => ({
    events,
    requests,
  })),
};

export default update;
