/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import zip from "lodash/zip";
import { isCommandError, ProtocolError } from "shared/utils/error";
import type { UIThunkAction } from "ui/actions";
import { getPreferredLocation } from "ui/reducers/sources";

import { framePositionsLoaded } from "../../reducers/pause";
import { getSelectedFrame } from "../../selectors";

export function setFramePositions(): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { ThreadFront }) => {
    const frame = getSelectedFrame(getState());
    if (!frame) {
      return;
    }

    let positions;
    try {
      positions = await ThreadFront.getFrameSteps(frame.asyncIndex, frame.protocolId);
    } catch (e) {
      // "There are too many points to complete this operation"
      // is expected if the frame is too long and should not be treated as an error.
      if (isCommandError(e, ProtocolError.TooManyPoints)) {
        console.error(e);
        return;
      }
      throw e;
    }

    if (positions.length === 0) {
      return;
    }
    await ThreadFront.ensureAllSources();
    const state = getState();
    const locations = positions.map(({ frame }) =>
      getPreferredLocation(state.sources, frame!, ThreadFront.preferredGeneratedSources)
    );

    const combinedPositions = zip(positions, locations).map(([position, location]) => {
      const { point, time } = position!;
      return { point, time, location: location! };
    });

    if (frame != getSelectedFrame(getState())) {
      return;
    }

    dispatch(framePositionsLoaded(combinedPositions));
  };
}
