/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Threads reducer
 * @module reducers/threads
 */

import { createSelector } from "reselect";

import { features } from "../utils/prefs";

export function initialThreadsState() {
  return {
    threads: [],
    mainThread: {
      actor: "",
      url: "",
      type: "mainThread",
      name: "",
    },
    traits: {},
    isWebExtension: false,
  };
}

export default function update(state = initialThreadsState(), action) {
  switch (action.type) {
    case "CONNECT":
      return {
        ...state,
        mainThread: action.mainThread,
        traits: action.traits,
        isWebExtension: action.isWebExtension,
      };
    default:
      return state;
  }
}

export function getMainThread(state) {
  return state.threads.mainThread;
}

export function getDebuggeeUrl(state) {
  return getMainThread(state).url;
}
