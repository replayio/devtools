/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { makeBreakpointLocation, makeBreakpointId, getASTLocation } from "../../utils/breakpoint";

import {
  getBreakpoint,
  getBreakpointPositionsForLocation,
  getFirstBreakpointPosition,
  getSymbols,
  getSource,
  getSourceContent,
  getBreakpointsList,
  getPendingBreakpointList,
} from "../../selectors";

import { setBreakpointPositions } from "./breakpointPositions";
import { setSkipPausing } from "../pause/skipPausing";

import { recordEvent } from "../../utils/telemetry";
import { comparePosition } from "../../utils/location";
import { getTextAtPosition } from "../../utils/source";
const { PointHandlers } = require("../../../../../../../src/protocol/logpoint");

// This file has the primitive operations used to modify individual breakpoints
// and keep them in sync with the breakpoints installed on server threads. These
// are collected here to make it easier to preserve the following invariant:
//
// Breakpoints are included in reducer state iff they are disabled or requests
// have been dispatched to set them in all server threads.
//
// To maintain this property, updates to the reducer and installed breakpoints
// must happen with no intervening await. Using await allows other operations to
// modify the breakpoint state in the interim and potentially cause breakpoint
// state to go out of sync.
//
// The reducer is optimistically updated when users set or remove a breakpoint,
// but it might take a little while before the breakpoints have been set or
// removed in each thread. Once all outstanding requests sent to a thread have
// been processed, the reducer and server threads will be in sync.
//
// There is another exception to the above invariant when first connecting to
// the server: breakpoints have been installed on all generated locations in the
// pending breakpoints, but no breakpoints have been added to the reducer. When
// a matching source appears, either the server breakpoint will be removed or a
// breakpoint will be added to the reducer, to restore the above invariant.
// See syncBreakpoint.js for more.

function clientSetBreakpoint(client, state, breakpoint) {
  const breakpointLocation = makeBreakpointLocation(state, breakpoint.location);
  return client.setBreakpoint(breakpointLocation, breakpoint.options);
}

function clientRemoveBreakpoint(client, state, location) {
  const breakpointLocation = makeBreakpointLocation(state, location);
  return client.removeBreakpoint(breakpointLocation);
}

export function enableBreakpoint(cx, initialBreakpoint) {
  return async ({ dispatch, getState, client, sourceMaps }) => {
    const breakpoint = getBreakpoint(getState(), initialBreakpoint.location);
    if (!breakpoint || !breakpoint.disabled) {
      return;
    }

    dispatch(setSkipPausing(false));
    dispatch({
      type: "SET_BREAKPOINT",
      cx,
      breakpoint: { ...breakpoint, disabled: false },
    });

    await clientSetBreakpoint(client, getState(), breakpoint);
  };
}

export function addBreakpoint(
  cx,
  initialLocation,
  options = {},
  disabled = false,
  shouldCancel = () => false
) {
  return async ({ dispatch, getState, sourceMaps, client }) => {
    recordEvent("add_breakpoint");

    const { sourceId, column, line } = initialLocation;

    await dispatch(setBreakpointPositions({ cx, sourceId, line }));

    const location = column
      ? getBreakpointPositionsForLocation(getState(), initialLocation)
      : getFirstBreakpointPosition(getState(), initialLocation);

    if (!location) {
      return;
    }

    const source = getSource(getState(), location.sourceId);
    if (!source) {
      return;
    }

    const symbols = getSymbols(getState(), source);
    const astLocation = getASTLocation(source, symbols, location);

    const originalContent = getSourceContent(getState(), source.id);
    const originalText = getTextAtPosition(source.id, originalContent, location);

    const content = getSourceContent(getState(), source.id);
    const text = getTextAtPosition(source.id, content, location);

    const id = makeBreakpointId(location);
    const breakpoint = {
      id,
      disabled,
      options,
      location,
      astLocation,
      text,
      originalText,
    };

    if (shouldCancel()) {
      return;
    }

    dispatch(setSkipPausing(false));
    dispatch({
      type: "SET_BREAKPOINT",
      cx,
      breakpoint,
    });

    // We don't want notifications to show up for synced breakpoints that are added when we
    // start up the devtools. We only want them to show up for breakpoints that are added when
    // the user clicks on the gutter. Checking `isPaused` makes sure that we exclude all of the
    // synced breakpoints from displaying notifications.
    if (cx.isPaused) {
      PointHandlers.addPendingNotification(location);
    }

    if (disabled) {
      // If we just clobbered an enabled breakpoint with a disabled one, we need
      // to remove any installed breakpoint in the server.
      await clientRemoveBreakpoint(client, getState(), location);
    } else {
      await clientSetBreakpoint(client, getState(), breakpoint);
    }
  };
}

/**
 * Remove a single breakpoint
 *
 * @memberof actions/breakpoints
 * @static
 */
export function removeBreakpoint(cx, initialBreakpoint) {
  return async ({ dispatch, getState, client }) => {
    recordEvent("remove_breakpoint");

    const breakpoint = getBreakpoint(getState(), initialBreakpoint.location);
    if (!breakpoint) {
      return;
    }

    dispatch(setSkipPausing(false));
    dispatch({
      type: "REMOVE_BREAKPOINT",
      cx,
      location: breakpoint.location,
    });

    // If the breakpoint is disabled then it is not installed in the server.
    if (!breakpoint.disabled) {
      await clientRemoveBreakpoint(client, getState(), breakpoint.location);
    }
  };
}

/**
 * Remove all installed, pending, and client breakpoints associated with a
 * target generated location.
 *
 * @memberof actions/breakpoints
 * @static
 */
export function removeBreakpointAtGeneratedLocation(cx, target) {
  return async ({ dispatch, getState, client }) => {
    // Remove any breakpoints matching the generated location.
    const breakpoints = getBreakpointsList(getState());
    for (const { location } of breakpoints) {
      if (location.sourceId == target.sourceId && comparePosition(location, target)) {
        dispatch({
          type: "REMOVE_BREAKPOINT",
          cx,
          location,
        });
      }
    }

    // Remove any remaining pending breakpoints matching the generated location.
    const pending = getPendingBreakpointList(getState());
    for (const { location } of pending) {
      if (location.sourceUrl == target.sourceUrl && comparePosition(location, target)) {
        dispatch({
          type: "REMOVE_PENDING_BREAKPOINT",
          cx,
          location,
        });
      }
    }

    // remove breakpoint from the server
    await clientRemoveBreakpoint(client, getState(), target);
  };
}

/**
 * Disable a single breakpoint
 *
 * @memberof actions/breakpoints
 * @static
 */
export function disableBreakpoint(cx, initialBreakpoint) {
  return async ({ dispatch, getState, client }) => {
    const breakpoint = getBreakpoint(getState(), initialBreakpoint.location);
    if (!breakpoint || breakpoint.disabled) {
      return;
    }

    dispatch(setSkipPausing(false));
    dispatch({
      type: "SET_BREAKPOINT",
      cx,
      breakpoint: { ...breakpoint, disabled: true },
    });

    await clientRemoveBreakpoint(client, getState(), breakpoint.location);
  };
}

/**
 * Update the options of a breakpoint.
 *
 * @throws {Error} "not implemented"
 * @memberof actions/breakpoints
 * @static
 * @param {SourceLocation} location
 *        @see DebuggerController.Breakpoints.addBreakpoint
 * @param {Object} options
 *        Any options to set on the breakpoint
 */
export function setBreakpointOptions(cx, location, options = {}) {
  return async ({ dispatch, getState, client, sourceMaps }) => {
    let breakpoint = getBreakpoint(getState(), location);
    if (!breakpoint) {
      return dispatch(addBreakpoint(cx, location, options));
    }

    // Note: setting a breakpoint's options implicitly enables it.
    breakpoint = { ...breakpoint, disabled: false, options };

    dispatch({
      type: "SET_BREAKPOINT",
      cx,
      breakpoint,
    });

    await clientSetBreakpoint(client, getState(), breakpoint);
  };
}
