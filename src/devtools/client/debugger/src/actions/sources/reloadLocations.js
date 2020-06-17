/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import {
  getContext,
  getSelectedLocation,
  getSourceActorsForSource,
  getSourceByActorId,
} from "../../selectors";

import {
  selectSource,
} from "./select";

import { ThreadFront } from "protocol/thread";

// This is used to update the debugger and other panel state when we've decided
// to show one source instead of another. Currently this isn't used...
export function reloadLocations() {
  return async ({ dispatch, getState }) => {
    const cx = getContext(getState());
    const selectedLocation = getSelectedLocation(getState());

    const actors = getSourceActorsForSource(getState(), selectedLocation.sourceId);
    if (actors.length != 1) {
      // Not handling HTML files yet.
      return;
    }

    const scriptId = actors[0].actor;
    const preferredScriptId = ThreadFront.getPreferredScriptId(scriptId);
    if (preferredScriptId != scriptId) {
      const newSource = getSourceByActorId(getState(), preferredScriptId);
      if (newSource) {
        await dispatch(selectSource(cx, newSource.id));
      }
    }

    // FIXME breakpoints should be reloaded as well...
  };
}
