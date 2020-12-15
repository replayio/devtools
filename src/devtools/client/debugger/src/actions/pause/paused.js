/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import { getSelectedFrame, getThreadContext } from "../../selectors";
import { actions } from "ui/actions";

import { fetchFrames } from ".";
import { selectLocation } from "../sources";

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

    dispatch(actions.setSelectedPrimaryPanel("debug"));
    await Promise.all(promises);
  };
}
