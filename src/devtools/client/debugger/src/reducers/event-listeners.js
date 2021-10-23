/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { prefs } from "../utils/prefs";

export function initialEventListenerState() {
  return {
    active: [],
    categories: [],
    expanded: [],
    logEventBreakpoints: prefs.logEventBreakpoints,
    eventTypePoints: {},
    loadingAdditionalPoints: true,
  };
}

function update(state = initialEventListenerState(), action) {
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
        eventTypePoints: { ...state.eventTypePoints, ...action.eventTypePoints },
      };

    case "UPDATE_EVENT_LISTENER_EXPANDED":
      return { ...state, expanded: action.expanded };

    default:
      return state;
  }
}

export function getActiveEventListeners(state) {
  return state.eventListenerBreakpoints.active;
}

export function getEventListenerBreakpointTypes(state) {
  return state.eventListenerBreakpoints.categories;
}

export function getEventListenerExpanded(state) {
  return state.eventListenerBreakpoints.expanded;
}

export function getEventListenerPoints(state) {
  return state.eventListenerBreakpoints.eventTypePoints;
}

export function isLoadingAdditionalPoints(state) {
  return state.eventListenerBreakpoints.loadingAdditionalPoints;
}

export default update;
