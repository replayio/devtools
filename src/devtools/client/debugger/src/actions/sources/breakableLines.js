/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { getSourceActorsForSource, getBreakableLines } from "../../selectors";
import { setBreakpointPositions } from "../breakpoints/breakpointPositions";
import { loadSourceActorBreakableLines } from "../source-actors";

function calculateBreakableLines(positions) {
  const lines = [];
  for (const line in positions) {
    if (positions[line].length > 0) {
      lines.push(Number(line));
    }
  }

  return lines;
}

export function setBreakableLines(cx, sourceId) {
  return async ({ getState, dispatch, client }) => {
    let breakableLines;
    const actors = getSourceActorsForSource(getState(), sourceId);

    await Promise.all(
      actors.map(actor => dispatch(loadSourceActorBreakableLines({ id: actor.id, cx })))
    );
  };
}
