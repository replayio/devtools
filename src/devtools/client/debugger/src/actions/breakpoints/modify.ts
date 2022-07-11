/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { Context } from "devtools/client/debugger/src/reducers/pause";
import type { UIThunkAction } from "ui/actions";
import { trackEvent } from "ui/utils/telemetry";

import {
  Breakpoint,
  removeBreakpoint,
  setBreakpoint,
  setRequestedBreakpoint,
} from "../../reducers/breakpoints";
import {
  getBreakpoint,
  getFirstBreakpointPosition,
  getSymbols,
  getRequestedBreakpointLocations,
} from "../../selectors";
import { getAnalysisPointsForLocation } from "devtools/client/debugger/src/reducers/breakpoints";
import { getLocationKey, getASTLocation } from "../../utils/breakpoint";
import { getTextAtPosition } from "../../utils/source";

import { getSourceContent, getSourceDetails } from "ui/reducers/sources";
import { Location } from "@replayio/protocol";
import {
  fetchPossibleBreakpointsForSource,
  getPossibleBreakpointsForSource,
} from "ui/reducers/possibleBreakpoints";

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

export function enableBreakpoint(
  cx: Context,
  initialBreakpoint: Breakpoint
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { client, ThreadFront }) => {
    const breakpoint = getBreakpoint(getState(), initialBreakpoint.location);
    if (!breakpoint || !breakpoint.disabled) {
      return;
    }

    dispatch(setBreakpoint({ ...breakpoint, disabled: false }, ThreadFront.recordingId!, cx));

    await client.setBreakpoint(breakpoint.location, breakpoint.options);
  };
}

export function addBreakpoint(
  cx: Context,
  initialLocation: Location,
  options: Breakpoint["options"] = {},
  disabled = false,
  shouldCancel = () => false
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { client, ThreadFront }) => {
    const { sourceId, line } = initialLocation;

    dispatch(setRequestedBreakpoint({ sourceId, line }));

    let possibleBreakpoints = getPossibleBreakpointsForSource(getState(), sourceId);
    if (!possibleBreakpoints) {
      // TODO @jcmorrow gotta fix this
      await dispatch(fetchPossibleBreakpointsForSource(sourceId));
      possibleBreakpoints = getPossibleBreakpointsForSource(getState(), sourceId);
    }

    // check if the user deleted the requested breakpoint in the meantime
    const requestedBreakpointLocations = getRequestedBreakpointLocations(getState());
    if (!(getLocationKey({ sourceId, line }) in requestedBreakpointLocations)) {
      return;
    }

    const firstLocationOnLine = getPossibleBreakpointsForSource(
      getState(),
      initialLocation.sourceId
    )?.find(lineLocation => {
      lineLocation.line === line;
    })?.columns[0];

    const location = {
      sourceId,
      line,
      column: firstLocationOnLine,
    };

    const source = getSourceDetails(getState(), location.sourceId);
    if (!source) {
      return;
    }

    const symbols = getSymbols(getState(), source);
    const astLocation = getASTLocation(source, symbols, location);

    const originalContent = getSourceContent(getState(), source.id);
    const originalText = getTextAtPosition(originalContent, location);

    const content = getSourceContent(getState(), source.id);
    const text = getTextAtPosition(content, location);

    const id = getLocationKey(location);
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

    // @ts-expect-error Breakpoint structure mismatch
    dispatch(setBreakpoint(breakpoint, ThreadFront.recordingId!, cx));

    if (disabled) {
      // If we just clobbered an enabled breakpoint with a disabled one, we need
      // to remove any installed breakpoint in the server.
      await client.removeBreakpoint(location);
    } else {
      await client.setBreakpoint(breakpoint.location, breakpoint.options);
    }
  };
}

export function runAnalysis(
  cx: Context,
  initialLocation: Location,
  options: Breakpoint["options"]
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { client }) => {
    const location = getFirstBreakpointPosition(getState(), initialLocation);

    if (!location) {
      return;
    }

    // Don't run the analysis if we already have the analysis points for that
    // location.
    const analysisPoints = getAnalysisPointsForLocation(getState(), location, options.condition);
    if (analysisPoints) {
      return;
    }

    client.runAnalysis(location, options);
  };
}

export function _removeBreakpoint(
  cx: Context,
  initialBreakpoint: Breakpoint
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { client, ThreadFront }) => {
    const breakpoint = getBreakpoint(getState(), initialBreakpoint.location);
    if (!breakpoint) {
      return;
    }

    dispatch(removeBreakpoint(breakpoint.location, ThreadFront.recordingId!, cx));

    // If the breakpoint is disabled then it is not installed in the server.
    if (!breakpoint.disabled) {
      await client.removeBreakpoint(breakpoint.location);
    }
  };
}

export function disableBreakpoint(
  cx: Context,
  initialBreakpoint: Breakpoint
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { client, ThreadFront }) => {
    const breakpoint = getBreakpoint(getState(), initialBreakpoint.location);
    if (!breakpoint || breakpoint.disabled) {
      return;
    }

    dispatch(setBreakpoint({ ...breakpoint, disabled: true }, ThreadFront.recordingId!, cx));

    await client.removeBreakpoint(breakpoint.location);
  };
}

export function removeBreakpointOption(
  cx: Context,
  breakpoint: Breakpoint,
  option: keyof Breakpoint["options"]
): UIThunkAction<Promise<void>> {
  return async (dispatch, _getState, { client, ThreadFront }) => {
    const newOptions = { ...breakpoint.options };
    delete newOptions[option];

    dispatch(setBreakpoint({ ...breakpoint, options: newOptions }, ThreadFront.recordingId!, cx));

    await client.setBreakpoint(breakpoint.location, newOptions);
  };
}

export function setBreakpointOptions(
  cx: Context,
  location: Location,
  options: Partial<Breakpoint["options"]> = {}
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { client, ThreadFront }) => {
    let breakpoint = getBreakpoint(getState(), location);
    if (!breakpoint) {
      return dispatch(addBreakpoint(cx, location, options));
    }

    // Note: setting a breakpoint's options implicitly enables it.
    breakpoint = { ...breakpoint, disabled: false, options };
    trackEvent("breakpoint.edit");

    dispatch(setBreakpoint(breakpoint, ThreadFront.recordingId!, cx));

    await client.setBreakpoint(breakpoint.location, breakpoint.options);
  };
}
