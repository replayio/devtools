/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIThunkAction } from "ui/actions";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import type { PendingBreakpoint } from "../../reducers/types";

import { assertPendingBreakpoint } from "../../utils/breakpoint";

import { removePendingBreakpoint } from "../../reducers/pending-breakpoints";
import { getSourceDetails } from "ui/reducers/sources";
import { addBreakpoint } from "./modify";

export function syncBreakpoint(
  cx: Context,
  sourceId: string,
  pendingBreakpoint: PendingBreakpoint
): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    assertPendingBreakpoint(pendingBreakpoint);

    const source = getSourceDetails(getState(), sourceId);

    if (!source) {
      return;
    }

    const { location } = pendingBreakpoint;
    const previousLocation = { ...location, sourceId };

    const newLocation = {
      line: previousLocation.line,
      column: previousLocation.column,
      sourceUrl: source.url!,
      sourceId: source.id,
    };

    dispatch(removePendingBreakpoint(location, ThreadFront.recordingId!, cx));

    return dispatch(
      addBreakpoint(cx, newLocation, pendingBreakpoint.options, pendingBreakpoint.disabled)
    );
  };
}
