/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {
  FILTER_TEXT_SET,
  FILTER_TOGGLE,
  DEFAULT_FILTERS_RESET,
  EVALUATE_EXPRESSION,
  MESSAGES_ADD,
  PERSIST_TOGGLE,
} = require("devtools/client/webconsole/constants");

/**
 * Event telemetry middleware is responsible for logging specific events to telemetry.
 */
function eventTelemetryMiddleware(telemetry, sessionId, store) {
  return next => action => next(action);
}

module.exports = eventTelemetryMiddleware;
