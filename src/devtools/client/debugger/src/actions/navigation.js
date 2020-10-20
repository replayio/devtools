/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { clearDocuments } from "../utils/editor";
import sourceQueue from "../utils/source-queue";

import { evaluateExpressions } from "./expressions";

import { getMainThread, getThreadContext } from "../selectors";

/**
 * Redux actions for the navigation state
 * @module actions/navigation
 */

/**
 * @memberof actions/navigation
 * @static
 */
export function willNavigate(event) {
  return async function ({ dispatch, getState, client, sourceMaps, parser }) {
    sourceQueue.clear();
    sourceMaps.clearSourceMaps();
    clearDocuments();
    parser.clear();
    const thread = getMainThread(getState());

    dispatch({
      type: "NAVIGATE",
      mainThread: { ...thread, url: event.url },
    });
  };
}

export function connect(url, actor, traits, isWebExtension) {
  return async function ({ dispatch, getState }) {
    await dispatch({
      type: "CONNECT",
      mainThread: {
        url,
        actor,
        type: "mainThread",
        name: L10N.getStr("mainThread"),
      },
      traits,
      isWebExtension,
    });

    const cx = getThreadContext(getState());
    dispatch(evaluateExpressions(cx));
  };
}

/**
 * @memberof actions/navigation
 * @static
 */
export function navigated() {
  return async function ({ }) {
  };
}
