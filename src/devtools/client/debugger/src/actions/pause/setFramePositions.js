/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import type { ActorId, ExecutionPoint } from "../../types";
import type { ThunkArgs } from "../types";

import { getSourceByActorId, getCurrentThread, getSelectedFrame } from "../../selectors";
import { zip } from "lodash";

export function setFramePositions() {
  return async ({ dispatch, getState, sourceMaps, client }: ThunkArgs) => {
    const thread = getCurrentThread(getState());
    const frame = getSelectedFrame(getState(), thread);
    if (!frame) {
      return;
    }

    const positions = await client.fetchAncestorFramePositions(frame.index);

    if (frame != getSelectedFrame(getState(), thread)) {
      return;
    }

    const sourceId = getSourceByActorId(getState(), positions[0].frame.scriptId).id;

    const generatedLocations = positions.map(({ frame: { line, column } }) => {
      return { line, column, sourceId };
    });
    const originalLocations = await sourceMaps.getOriginalLocations(
      generatedLocations
    );

    const combinedPositions = zip(positions, originalLocations, generatedLocations).map(
      ([{ point, time }, location, generatedLocation]) => {
        return { point, time, location, generatedLocation };
      }
    );

    // FIXME
    const unexecuted = [];

    const generatedUnexecuted = unexecuted.map(({ line, column }) => {
      return { line, column, sourceId };
    });
    const originalUnexecuted = await sourceMaps.getOriginalLocations(
      generatedUnexecuted
    );

    const combinedUnexecuted = zip(originalUnexecuted, generatedUnexecuted).map(
      ([location, generatedLocation]) => ({ location, generatedLocation })
    );

    if (frame != getSelectedFrame(getState(), thread)) {
      return;
    }

    dispatch({
      type: "SET_FRAME_POSITIONS",
      positions: combinedPositions,
      unexecuted: combinedUnexecuted,
    });
  };
}
