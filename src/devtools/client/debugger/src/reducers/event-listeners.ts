/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { TimeStampedPoint } from "@recordreplay/protocol";
import type { AnyAction } from "@reduxjs/toolkit";
import type { UIState } from "ui/state";

import { prefs } from "../utils/prefs";

type ActiveEventListener = string;
type EventListenerEvent = { name: string; id: ActiveEventListener };
type EventListenerCategory = {
  name: string;
  events: EventListenerEvent[];
};

export type EventListenerPoint = TimeStampedPoint & { frame: any[] };
export type EventTypeCounts = Record<string, number>;
export type EventTypePoints = Record<string, EventListenerPoint[]>;

export interface EventListenersState {
  active: string[];
  categories: EventListenerCategory[];
  expanded: string[];
  eventTypeCounts: EventTypeCounts;
  eventTypePoints: EventTypePoints;
  logEventBreakpoints: boolean;
  loadingInitialPoints: boolean;
  loadingAdditionalCounts: boolean;
}

export function initialEventListenerState(): EventListenersState {
  return {
    active: [],
    categories: [],
    eventTypeCounts: {},
    eventTypePoints: {},
    expanded: [],
    loadingAdditionalCounts: true,
    loadingInitialPoints: true,
    logEventBreakpoints: prefs.logEventBreakpoints as boolean,
  };
}

function update(state = initialEventListenerState(), action: AnyAction) {
  switch (action.type) {
    case "LOADING_ADDITIONAL_EVENT_LISTENER_COUNTS":
      return { ...state, loadingAdditionalCounts: false };

    case "UPDATE_EVENT_LISTENERS":
      return { ...state, active: action.active };

    case "RECEIVE_EVENT_LISTENER_TYPES":
      return { ...state, categories: action.categories };

    case "RECEIVE_EVENT_LISTENER_POINTS":
      return {
        ...state,
        eventTypePoints: { ...state.eventTypePoints, ...action.eventTypePoints },
        loadingInitialPoints: false,
      };

    case "RECEIVE_EVENT_LISTENER_COUNTS":
      return {
        ...state,
        eventTypeCounts: { ...state.eventTypeCounts, ...action.eventTypeCounts },
        loadingAdditionalCounts: false,
      };

    case "UPDATE_EVENT_LISTENER_EXPANDED":
      return { ...state, expanded: action.expanded };

    default:
      return state;
  }
}

export function getActiveEventListeners(state: UIState) {
  return state.eventListenerBreakpoints.active;
}

export function getEventListenerBreakpointTypes(state: UIState) {
  return state.eventListenerBreakpoints.categories;
}

export function getEventListenerExpanded(state: UIState) {
  return state.eventListenerBreakpoints.expanded;
}

export function getEventListenerCounts(state: UIState) {
  return state.eventListenerBreakpoints.eventTypeCounts;
}

export function getEventListenerPoints(state: UIState) {
  return state.eventListenerBreakpoints.eventTypePoints;
}

export function isLoadingAdditionalCounts(state: UIState) {
  return state.eventListenerBreakpoints.loadingAdditionalCounts;
}

export function isLoadingInitialPoints(state: UIState) {
  return state.eventListenerBreakpoints.loadingInitialPoints;
}

export default update;
