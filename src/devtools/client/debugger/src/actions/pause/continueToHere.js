/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { getFramePositions } from "../../selectors";
import actions from "../../actions";

export function continueToHere(cx, location) {
  return async function ({ dispatch, getState }) {
    const framePositions = getFramePositions(getState());

    if (!framePositions) {
      return;
    }

    const { positions } = framePositions;
    const { line } = location;

    if (!positions || !line) {
      return;
    }

    // Look for the first point on that line, ignoring column breakpoints
    const selectedPosition = positions.find(position => position.location.line === line);

    if (!selectedPosition) {
      return;
    }

    const { point, time } = selectedPosition;
    return dispatch(actions.seekToPosition(point, time));
  };
}
