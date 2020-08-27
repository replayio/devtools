/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import { uniq, remove } from "lodash";

const { getAvailableEventBreakpoints } = require("devtools/server/actors/utils/event-breakpoints");
import { getActiveEventListeners, getEventListenerExpanded } from "../selectors";

import type { ThunkArgs } from "./types";

export async function setupEventListeners(_, store) {
  store.dispatch(getEventListenerBreakpointTypes());

  const eventListeners = getActiveEventListeners(store.getState());
  await store.dispatch(setEventListeners(eventListeners));
}

function updateEventListeners(newEvents: string[]) {
  return async ({ dispatch, client }) => {
    dispatch({ type: "UPDATE_EVENT_LISTENERS", active: newEvents });
    await client.setEventListenerBreakpoints(newEvents);
  };
}

function setEventListeners(newEvents: string[]) {
  return async ({ client }) => {
    await client.setEventListenerBreakpoints(newEvents);
  };
}

async function updateExpanded(dispatch, newExpanded: string[]) {
  dispatch({
    type: "UPDATE_EVENT_LISTENER_EXPANDED",
    expanded: newExpanded,
  });
}

export function addEventListenerBreakpoints(eventsToAdd: string[]) {
  return async ({ dispatch, getState }: ThunkArgs) => {
    try {
      const activeListenerBreakpoints = getActiveEventListeners(getState());
      const newEvents = uniq([...eventsToAdd, ...activeListenerBreakpoints]);
      await dispatch(updateEventListeners(newEvents));
    } catch (e) {
      console.error(e);
    }
  };
}

export function removeEventListenerBreakpoints(eventsToRemove: string[]) {
  return async ({ dispatch, client, getState }: ThunkArgs) => {
    const activeListenerBreakpoints = getActiveEventListeners(getState());

    const newEvents = remove(activeListenerBreakpoints, event => !eventsToRemove.includes(event));

    await dispatch(updateEventListeners(newEvents));
  };
}

export function addEventListenerExpanded(category: string) {
  return async ({ dispatch, getState }: ThunkArgs) => {
    const expanded = await getEventListenerExpanded(getState());

    const newExpanded = uniq([...expanded, category]);

    await updateExpanded(dispatch, newExpanded);
  };
}

export function removeEventListenerExpanded(category: string) {
  return async ({ dispatch, getState }: ThunkArgs) => {
    const expanded = await getEventListenerExpanded(getState());

    const newExpanded = expanded.filter(expand => expand != category);

    updateExpanded(dispatch, newExpanded);
  };
}

export function getEventListenerBreakpointTypes() {
  return async ({ dispatch, client }: ThunkArgs) => {
    const categories = await getAvailableEventBreakpoints();
    dispatch({ type: "RECEIVE_EVENT_LISTENER_TYPES", categories });
  };
}
