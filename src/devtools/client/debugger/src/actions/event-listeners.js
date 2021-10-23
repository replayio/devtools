/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import uniq from "lodash/uniq";
import remove from "lodash/remove";
import difference from "lodash/difference";

const { getAvailableEventBreakpoints } = require("devtools/server/actors/utils/event-breakpoints");
import * as selectors from "../selectors";

import { features } from "ui/utils/prefs";

const INITIAL_EVENT_BREAKPOINTS = [
  "​event.keyboard.input",
  "​event.keyboard.keydown",
  "​event.keyboard.keyup",
  "​event.keyboard.keypress",
  "​event.mouse.click",
  "​event.mouse.dblclick",
  "​event.mouse.mousedown",
  "​event.mouse.mouseup",
  "​event.mouse.contextmenu",
  "​event.websocket.open",
  "​event.websocket.error",
  "​event.websocket.close",
];

export async function setupEventListeners(store) {
  store.dispatch(getEventListenerBreakpointTypes());

  const eventListeners = selectors.getActiveEventListeners(store.getState());
  await store.dispatch(setEventListeners(eventListeners));
}

function updateEventListeners(newEvents) {
  return async ({ dispatch, client }) => {
    dispatch({ type: "UPDATE_EVENT_LISTENERS", active: newEvents });
    await client.setEventListenerBreakpoints(newEvents);
  };
}

function setEventListeners(newEvents) {
  return async ({ client }) => {
    await client.setEventListenerBreakpoints(newEvents);
  };
}

async function updateExpanded(dispatch, newExpanded) {
  dispatch({
    type: "UPDATE_EVENT_LISTENER_EXPANDED",
    expanded: newExpanded,
  });
}

export function addEventListenerBreakpoints(eventsToAdd) {
  return async ({ dispatch, getState }) => {
    try {
      const activeListenerBreakpoints = selectors.getActiveEventListeners(getState());
      const newEvents = uniq([...eventsToAdd, ...activeListenerBreakpoints]);
      await dispatch(updateEventListeners(newEvents));
    } catch (e) {
      console.error(e);
    }
  };
}

export function removeEventListenerBreakpoints(eventsToRemove) {
  return async ({ dispatch, getState }) => {
    const activeListenerBreakpoints = selectors.getActiveEventListeners(getState());

    const newEvents = remove(activeListenerBreakpoints, event => !eventsToRemove.includes(event));

    await dispatch(updateEventListeners(newEvents));
  };
}

export function addEventListenerExpanded(category) {
  return async ({ dispatch, getState }) => {
    const expanded = await selectors.getEventListenerExpanded(getState());

    const newExpanded = uniq([...expanded, category]);

    await updateExpanded(dispatch, newExpanded);
  };
}

export function removeEventListenerExpanded(category) {
  return async ({ dispatch, getState }) => {
    const expanded = await selectors.getEventListenerExpanded(getState());

    const newExpanded = expanded.filter(expand => expand != category);

    updateExpanded(dispatch, newExpanded);
  };
}

export function getEventListenerBreakpointTypes() {
  return async ({ dispatch, client }) => {
    const categories = await getAvailableEventBreakpoints();
    dispatch({ type: "RECEIVE_EVENT_LISTENER_TYPES", categories });

    if (features.eventCount) {
      const eventTypePoints = await client.fetchEventTypePoints(INITIAL_EVENT_BREAKPOINTS);
      dispatch({ type: "RECEIVE_EVENT_LISTENER_POINTS", eventTypePoints });
    }
  };
}

export function loadAdditionalPoints() {
  return async ({ dispatch, getState, client }) => {
    if (!selectors.isLoadingAdditionalPoints(getState())) {
      return;
    }

    dispatch({ type: "LOADING_ADDITIONAL_EVENT_LISTENER_POINTS" });
    const eventBreakpoints = selectors.getEventListenerBreakpointTypes(getState());
    const otherEventBreakpoints = difference(eventBreakpoints, INITIAL_EVENT_BREAKPOINTS);
    const eventTypePoints = await client.fetchEventTypePoints(otherEventBreakpoints);
    dispatch({ type: "RECEIVE_EVENT_LISTENER_POINTS", eventTypePoints });
  };
}
