/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import { getSelectedFrame, getThreadContext } from "../../selectors";

import { fetchFrames } from ".";
import { removeBreakpoint } from "../breakpoints";
import { selectLocation } from "../sources";
import assert from "../../utils/assert";

import { fetchScopes } from "./fetchScopes";
import { setFramePositions } from "./setFramePositions";

/**
 * Debugger has just paused
 *
 * @param {object} pauseInfo
 * @memberof actions/pause
 * @static
 */
export function paused({ executionPoint }) {
  return async function ({ dispatch, getState }) {
    dispatch({ type: "PAUSED", executionPoint });

    // Get a context capturing the newly paused and selected thread.
    const cx = getThreadContext(getState());

    await dispatch(fetchFrames(cx));

    const frame = getSelectedFrame(getState());
    if (frame) {
      dispatch(selectLocation(cx, frame.location, { remap: true }));

      // If the user is paused on a frame, make sure to open up the
      // debug primary panel.
      dispatch({ type: "set_selected_primary_panel", panel: "debug" });
    }

    const promises = [];
    promises.push(
      (async () => {
        dispatch(setFramePositions());
      })()
    );

    promises.push(
      (async () => {
        await dispatch(fetchScopes(cx));
      })()
    );

    await Promise.all(promises);
  };
}
