/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { loadSymbols } from "./sources";

export function setQuickOpenQuery(query) {
  return {
    type: "SET_QUICK_OPEN_QUERY",
    query,
  };
}

export function openQuickOpen(query = "", project) {
  return ({ dispatch }) => {
    if (project) {
      dispatch(loadSymbols());
    }

    return dispatch({ type: "OPEN_QUICK_OPEN", query, project });
  };
}

export function closeQuickOpen() {
  return { type: "CLOSE_QUICK_OPEN" };
}
