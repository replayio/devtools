/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { selectSource } from "devtools/client/debugger/src/actions/sources";
import { showSource } from "devtools/client/debugger/src/actions/ui";
import { getContext } from "devtools/client/debugger/src/selectors";
import type { UIThunkAction } from "ui/actions";
import { getSourceDetails, getSourceToDisplayForUrl } from "ui/reducers/sources";

export function onViewSourceInDebugger(
  frame: { sourceId?: string; url: string; line?: number; column: number },
  openSource = true
): UIThunkAction {
  return async (dispatch, getState) => {
    const cx = getContext(getState());
    const source = frame.sourceId
      ? getSourceDetails(getState(), frame.sourceId)
      : getSourceToDisplayForUrl(getState(), frame.url!);
    if (source) {
      dispatch(showSource(cx, source.id, openSource));
      await dispatch(
        selectSource(
          cx,
          source.id,
          { sourceId: source.id, line: frame.line, column: frame.column },
          openSource
        )
      );
    }
  };
}
