/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { AnyAction } from "@reduxjs/toolkit";

export type AsyncRequestsState = string[];

/**
 * Async request reducer
 * @module reducers/async-request
 */

const initialAsyncRequestState: AsyncRequestsState = [];

function update(state = initialAsyncRequestState, action: AnyAction) {
  const { seqId } = action;

  if (seqId) {
    let newState;
    if (action.status === "start") {
      newState = [...state, seqId];
    } else if (action.status === "error" || action.status === "done") {
      newState = state.filter(id => id !== seqId);
    }

    return newState;
  }

  return state;
}

export default update;
