/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { createStore, applyMiddleware } from "redux";
import { promise } from "./middleware/promise";
import { thunk } from "./middleware/thunk";
import { context } from "./middleware/context";

/**
 * This creates a dispatcher with all the standard middleware in place
 * that all code requires. It can also be optionally configured in
 * various ways, such as logging and recording.
 *
 * @param {object} opts:
 *        - log: log all dispatched actions to console
 *        - history: an array to store every action in. Should only be
 *                   used in tests.
 *        - middleware: array of middleware to be included in the redux store
 * @memberof utils/create-store
 * @static
 */
const configureStore = (opts = {}) => {
  const middleware = [thunk(opts.makeThunkArgs), context, promise];

  if (opts.middleware) {
    opts.middleware.forEach(fn => middleware.push(fn));
  }

  // Hook in the redux devtools browser extension if it exists
  const devtoolsExt =
    typeof window === "object" && window.devToolsExtension ? window.devToolsExtension() : f => f;

  return applyMiddleware(...middleware)(devtoolsExt(createStore));
};

export default configureStore;
