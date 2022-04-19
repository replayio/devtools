/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import zip from "lodash/zip";

import { getSourceByActorId, getSelectedFrame } from "../../selectors";

const { ThreadFront } = require("protocol/thread");

export function setFramePositions() {
  return async (dispatch, getState, { client }) => {
    const frame = getSelectedFrame(getState());
    if (!frame) {
      return;
    }

    const positions = await client.fetchAncestorFramePositions(frame.asyncIndex, frame.protocolId);
    const { sourceId: protocolSourceId } = await ThreadFront.getPreferredLocation(
      positions[0].frame
    );
    const sourceId = getSourceByActorId(getState(), protocolSourceId)?.id;

    if (!sourceId) {
      return;
    }

    const locations = await Promise.all(
      positions.map(async ({ frame }) => {
        const { line, column } = await ThreadFront.getPreferredLocation(frame);
        return { column, line, sourceId };
      })
    );

    const combinedPositions = zip(positions, locations).map(([{ point, time }, location]) => {
      return { location, point, time };
    });

    if (frame != getSelectedFrame(getState())) {
      return;
    }

    dispatch({
      positions: combinedPositions,
      type: "SET_FRAME_POSITIONS",
      unexecuted: [],
    });
  };
}
