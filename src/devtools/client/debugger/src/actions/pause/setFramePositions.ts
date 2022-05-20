/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import zip from "lodash/zip";
import type { UIThunkAction } from "ui/actions";

import { getSourceByActorId, getSelectedFrame } from "../../selectors";

type $FixTypeLater = any;

export function setFramePositions(): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { client, ThreadFront }) => {
    const frame = getSelectedFrame(getState());
    if (!frame) {
      return;
    }

    const positions = await client.fetchAncestorFramePositions(frame.asyncIndex, frame.protocolId);
    if (positions.length === 0) {
      return;
    }
    const { sourceId: protocolSourceId } = await ThreadFront.getPreferredLocation(
      positions[0].frame!
    );
    const sourceId = getSourceByActorId(getState(), protocolSourceId)?.id;

    if (!sourceId) {
      return;
    }

    const locations = await Promise.all(
      positions.map(async ({ frame }) => {
        const { line, column } = await ThreadFront.getPreferredLocation(frame!);
        return { line, column, sourceId };
      })
    );

    const combinedPositions = zip(positions, locations).map(([position, location]) => {
      const { point, time } = position!;
      return { point, time, location };
    });

    if (frame != getSelectedFrame(getState())) {
      return;
    }

    dispatch({
      type: "SET_FRAME_POSITIONS",
      positions: combinedPositions,
      unexecuted: [],
    });
  };
}
