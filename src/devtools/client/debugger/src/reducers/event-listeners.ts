/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import type { AnyAction } from "@reduxjs/toolkit";
import { TimeStampedPoint } from "@recordreplay/protocol";

import type { UIState } from "ui/state";

import { prefs } from "../utils/prefs";

type ActiveEventListener = string;
type EventListenerEvent = { name: string; id: ActiveEventListener };
type EventListenerCategory = {
  name: string;
  events: EventListenerEvent[];
};

export type EventListenerPoint = TimeStampedPoint & { frame: any[] };
export type EventTypePoints = Record<string, EventListenerPoint[]>;

export interface EventListenersState {
  active: string[];
  categories: EventListenerCategory[];
  expanded: string[];
  eventTypePoints: EventTypePoints;
  logEventBreakpoints: boolean;
  loadingInitialPoints: boolean;
  loadingAdditionalPoints: boolean;
}

export function initialEventListenerState(): EventListenersState {
  return {
    active: [],
    categories: [],
    expanded: [],
    logEventBreakpoints: prefs.logEventBreakpoints as boolean,
    eventTypePoints: {},
    loadingInitialPoints: true,
    loadingAdditionalPoints: true,
  };
}

function update(state = initialEventListenerState(), action: AnyAction) {
  switch (action.type) {
    case "LOADING_ADDITIONAL_EVENT_LISTENER_POINTS":
      return { ...state, loadingAdditionalPoints: false };

    case "UPDATE_EVENT_LISTENERS":
      return { ...state, active: action.active };

    case "RECEIVE_EVENT_LISTENER_TYPES":
      return { ...state, categories: action.categories };

    case "RECEIVE_EVENT_LISTENER_POINTS":
      return {
        ...state,
        loadingInitialPoints: false,
        eventTypePoints: { ...state.eventTypePoints, ...action.eventTypePoints },
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

export function getEventListenerPoints(state: UIState) {
  return state.eventListenerBreakpoints.eventTypePoints;
}

export function isLoadingAdditionalPoints(state: UIState) {
  return state.eventListenerBreakpoints.loadingAdditionalPoints;
}

export function isLoadingInitialPoints(state: UIState) {
  return state.eventListenerBreakpoints.loadingInitialPoints;
}

export default update;
