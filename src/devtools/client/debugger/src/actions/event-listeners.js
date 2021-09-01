/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import uniq from "lodash/uniq";
import remove from "lodash/remove";

const { getAvailableEventBreakpoints } = require("devtools/server/actors/utils/event-breakpoints");
import { getActiveEventListeners, getEventListenerExpanded } from "../selectors";
import { ThreadFront } from "protocol/thread";
import analysisManager, { AnalysisHandler, AnalysisParams } from "protocol/analysisManager";

import { features } from "ui/utils/prefs";

export async function setupEventListeners(store) {
  store.dispatch(getEventListenerBreakpointTypes());

  const eventListeners = getActiveEventListeners(store.getState());
  await store.dispatch(setEventListeners(eventListeners));
}

async function fetchEventTypePoints(categories) {
  const eventTypes = categories
    .map(cat => cat.events)
    .flat()
    .map(e => e.id);

  const sessionId = await ThreadFront.waitForSession();

  const eventTypePoints = await Promise.all(
    eventTypes.map(
      eventType =>
        new Promise(async resolve => {
          analysisManager.runAnalysis(
            {
              sessionId,
              mapper: `return [{ key: input.point, value: input }];`,
              effectful: false,
              eventHandlerEntryPoints: [{ eventType }],
            },
            {
              onAnalysisPoints: points => resolve([eventType, points]),
            }
          );
        })
    )
  );

  return Object.fromEntries(eventTypePoints);
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
      const activeListenerBreakpoints = getActiveEventListeners(getState());
      const newEvents = uniq([...eventsToAdd, ...activeListenerBreakpoints]);
      await dispatch(updateEventListeners(newEvents));
    } catch (e) {
      console.error(e);
    }
  };
}

export function removeEventListenerBreakpoints(eventsToRemove) {
  return async ({ dispatch, client, getState }) => {
    const activeListenerBreakpoints = getActiveEventListeners(getState());

    const newEvents = remove(activeListenerBreakpoints, event => !eventsToRemove.includes(event));

    await dispatch(updateEventListeners(newEvents));
  };
}

export function addEventListenerExpanded(category) {
  return async ({ dispatch, getState }) => {
    const expanded = await getEventListenerExpanded(getState());

    const newExpanded = uniq([...expanded, category]);

    await updateExpanded(dispatch, newExpanded);
  };
}

export function removeEventListenerExpanded(category) {
  return async ({ dispatch, getState }) => {
    const expanded = await getEventListenerExpanded(getState());

    const newExpanded = expanded.filter(expand => expand != category);

    updateExpanded(dispatch, newExpanded);
  };
}

export function getEventListenerBreakpointTypes() {
  return async ({ dispatch }) => {
    const categories = await getAvailableEventBreakpoints();
    dispatch({ type: "RECEIVE_EVENT_LISTENER_TYPES", categories });

    if (features.eventCount) {
      const eventTypePoints = await fetchEventTypePoints(categories);
      dispatch({ type: "RECEIVE_EVENT_LISTENER_POINTS", eventTypePoints });
    }
  };
}
