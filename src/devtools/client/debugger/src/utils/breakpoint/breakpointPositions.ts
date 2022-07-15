//

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { Location, SameLineSourceLocations } from "@replayio/protocol";
import { comparePosition } from "../location";

export function findPosition(positions: Location[], location: Location) {
  if (!positions) {
    return null;
  }

  const lineBps = positions.filter(bp => bp.line === location.line);
  if (!lineBps) {
    return null;
  }
  return lineBps.find(pos => comparePosition(pos, location));
}
