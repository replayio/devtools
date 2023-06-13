/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { selectSource } from "devtools/client/debugger/src/actions/sources";
import { showSource } from "devtools/client/debugger/src/actions/ui";
import { getContext } from "devtools/client/debugger/src/selectors";
import type { UIThunkAction } from "ui/actions";

export function onViewSourceInDebugger({
  column,
  line,
  openSource,
  sourceId,
}: {
  column?: number;
  line?: number;
  openSource: boolean;
  sourceId: string;
}): UIThunkAction {
  return async (dispatch, getState) => {
    const state = getContext(getState());

    dispatch(showSource(state, sourceId, openSource));

    await dispatch(selectSource(state, sourceId, { column, line, sourceId }, openSource));
  };
}
