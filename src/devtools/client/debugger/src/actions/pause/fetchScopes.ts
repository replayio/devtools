/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIThunkAction } from "ui/actions";
import type { Context } from "devtools/client/debugger/src/reducers/pause";

import { getSelectedFrame, getFrameScope } from "../../selectors";
import { PROMISE } from "ui/setup/redux/middleware/promise";

export function fetchScopes(cx: Context): UIThunkAction {
  return async function (dispatch, getState, { client }) {
    const frame = getSelectedFrame(getState());
    if (!frame || getFrameScope(getState(), frame.id)) {
      return;
    }

    dispatch({
      type: "ADD_SCOPES",
      cx,
      // @ts-expect-error This is almost definitely a dead field
      thread: cx.thread,
      frame,
      [PROMISE]: client.getFrameScopes(frame),
    });
  };
}
