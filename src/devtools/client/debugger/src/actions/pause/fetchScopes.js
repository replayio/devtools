/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { PROMISE } from "ui/setup/redux/middleware/promise";

import { getSelectedFrame, getFrameScope } from "../../selectors";

export function fetchScopes(cx) {
  return async function (dispatch, getState, { client }) {
    const frame = getSelectedFrame(getState());
    if (!frame || getFrameScope(getState(), frame.id)) {
      return;
    }

    const scopes = dispatch({
      [PROMISE]: client.getFrameScopes(frame),
      cx,
      frame,
      thread: cx.thread,
      type: "ADD_SCOPES",
    });
  };
}
