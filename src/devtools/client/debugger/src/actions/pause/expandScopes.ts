/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIThunkAction } from "ui/actions";
import type { Context } from "devtools/client/debugger/src/reducers/pause";

import { getScopeItemPath } from "../../utils/pause/scopes/utils";

export function setExpandedScope(cx: Context, item: any, expanded: boolean): UIThunkAction {
  return function (dispatch, getState) {
    return dispatch({
      type: "SET_EXPANDED_SCOPE",
      cx,
      // @ts-expect-error This is almost definitely a dead field
      thread: cx.thread,
      path: getScopeItemPath(item),
      expanded,
    });
  };
}
