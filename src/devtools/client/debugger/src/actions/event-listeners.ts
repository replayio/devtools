/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { getAvailableEventBreakpoints } from "devtools/server/actors/utils/event-breakpoints";
import remove from "lodash/remove";
import uniq from "lodash/uniq";
import type { UIThunkAction } from "ui/actions";
import type { UIStore } from "ui/actions";
import type { AppDispatch } from "ui/setup/store";

import * as selectors from "../selectors";

const INITIAL_EVENT_BREAKPOINTS = [
  "event.keyboard.input",
  "event.keyboard.keydown",
  "event.keyboard.keyup",
  "event.keyboard.keypress",
  "event.mouse.click",
  "event.mouse.dblclick",
  "event.mouse.mousedown",
  "event.mouse.mouseup",
  "event.mouse.contextmenu",
  "event.websocket.open",
  "event.websocket.error",
  "event.websocket.close",
];

type $FixTypeLater = any;

export async function setupEventListeners(store: UIStore) {
  store.dispatch(getEventListenerBreakpointTypes());

  const eventListeners = selectors.getActiveEventListeners(store.getState());
  await store.dispatch(setEventListeners(eventListeners));
}

function updateEventListeners(newEvents: $FixTypeLater[]): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { client }) => {
    dispatch({ type: "UPDATE_EVENT_LISTENERS", active: newEvents });
    await client.setEventListenerBreakpoints(newEvents);
  };
}

function setEventListeners(newEvents: $FixTypeLater[]): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { client }) => {
    await client.setEventListenerBreakpoints(newEvents);
  };
}

async function updateExpanded(dispatch: AppDispatch, newExpanded: $FixTypeLater[]) {
  dispatch({
    type: "UPDATE_EVENT_LISTENER_EXPANDED",
    expanded: newExpanded,
  });
}

export function addEventListenerBreakpoints(
  eventsToAdd: $FixTypeLater[]
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    try {
      const activeListenerBreakpoints = selectors.getActiveEventListeners(getState());
      const newEvents = uniq([...eventsToAdd, ...activeListenerBreakpoints]);
      await dispatch(updateEventListeners(newEvents));
    } catch (e) {
      console.error(e);
    }
  };
}

export function removeEventListenerBreakpoints(
  eventsToRemove: $FixTypeLater[]
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const activeListenerBreakpoints = selectors.getActiveEventListeners(getState());

    const newEvents = remove(activeListenerBreakpoints, event => !eventsToRemove.includes(event));

    await dispatch(updateEventListeners(newEvents));
  };
}

export function addEventListenerExpanded(category: string): UIThunkAction {
  return (dispatch, getState) => {
    const expanded = selectors.getEventListenerExpanded(getState());

    const newExpanded = uniq([...expanded, category]);
    dispatch({
      type: "UPDATE_EVENT_LISTENER_EXPANDED",
      expanded: newExpanded,
    });
  };
}

export function removeEventListenerExpanded(category: string): UIThunkAction {
  return (dispatch, getState) => {
    const expanded = selectors.getEventListenerExpanded(getState());

    const newExpanded = expanded.filter(expand => expand != category);

    dispatch({
      type: "UPDATE_EVENT_LISTENER_EXPANDED",
      expanded: newExpanded,
    });
  };
}

export function getEventListenerBreakpointTypes(): UIThunkAction<Promise<void>> {
  return async (dispatch, _, { client }) => {
    const categories = getAvailableEventBreakpoints();
    dispatch({ type: "RECEIVE_EVENT_LISTENER_TYPES", categories });

    const eventTypePoints = await client.fetchEventTypePoints(INITIAL_EVENT_BREAKPOINTS);

    dispatch({ type: "RECEIVE_EVENT_LISTENER_POINTS", eventTypePoints });
  };
}

export function loadAdditionalCounts(): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { ThreadFront }) => {
    if (!selectors.isLoadingAdditionalCounts(getState())) {
      return;
    }

    dispatch({ type: "LOADING_ADDITIONAL_EVENT_LISTENER_COUNTS" });
    const eventBreakpoints = selectors.getEventListenerBreakpointTypes(getState());
    const eventIds = eventBreakpoints.reduce(
      (acc, e) => [...acc, ...e.events.map(event => event.id)],
      [] as $FixTypeLater[]
    );

    const eventTypeCounts = await ThreadFront.getEventHandlerCounts(eventIds);
    dispatch({ type: "RECEIVE_EVENT_LISTENER_COUNTS", eventTypeCounts });
  };
}
