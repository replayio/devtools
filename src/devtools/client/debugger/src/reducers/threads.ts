/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { AnyAction } from "@reduxjs/toolkit";
import type { UIState } from "ui/state";

import type { Thread } from "./types";

export interface ThreadsState {
  isWebExtension: boolean;
  mainThread: Thread;
  threads: Thread[];
  traits: Record<string, unknown>;
}

export function initialThreadsState(): ThreadsState {
  return {
    isWebExtension: false,
    mainThread: {
      actor: "",
      name: "",
      type: "mainThread",
      url: "",
    },
    threads: [],
    traits: {},
  };
}

export default function update(state = initialThreadsState(), action: AnyAction) {
  switch (action.type) {
    case "CONNECT":
      return {
        ...state,
        isWebExtension: action.isWebExtension,
        mainThread: action.mainThread,
        traits: action.traits,
      };
    default:
      return state;
  }
}

export function getMainThread(state: UIState) {
  return state.threads.mainThread;
}

export function getDebuggeeUrl(state: UIState) {
  return getMainThread(state).url;
}
