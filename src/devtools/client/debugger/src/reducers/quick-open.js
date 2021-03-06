/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Quick Open reducer
 * @module reducers/quick-open
 */

import { parseQuickOpenQuery } from "../utils/quick-open";

export const createQuickOpenState = () => ({
  enabled: false,
  query: "",
  searchType: "sources",
  project: false,
});

export default function update(state = createQuickOpenState(), action) {
  switch (action.type) {
    case "OPEN_QUICK_OPEN":
      return {
        ...state,
        enabled: true,
        project: action.project,
        query: action.query,
        searchType: parseQuickOpenQuery(action.query),
      };
    case "CLOSE_QUICK_OPEN":
      return createQuickOpenState();
    case "SET_QUICK_OPEN_QUERY":
      return {
        ...state,
        query: action.query,
        searchType: parseQuickOpenQuery(action.query),
      };
    default:
      return state;
  }
}

export function getQuickOpenEnabled(state) {
  return state.quickOpen.enabled;
}
export function getQuickOpenProject(state) {
  return state.quickOpen.project;
}

export function getQuickOpenQuery(state) {
  return state.quickOpen.query;
}

export function getQuickOpenType(state) {
  return state.quickOpen.searchType;
}
