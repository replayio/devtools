/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { getSelectedFrame, getFrameScope } from "../../selectors";
import { PROMISE } from "ui/setup/redux/middleware/promise";

export function fetchScopes(cx) {
  return async function ({ dispatch, getState, client }) {
    const frame = getSelectedFrame(getState());
    if (!frame || getFrameScope(getState(), frame.id)) {
      return;
    }

    const scopes = dispatch({
      type: "ADD_SCOPES",
      cx,
      thread: cx.thread,
      frame,
      [PROMISE]: client.getFrameScopes(frame),
    });
  };
}
