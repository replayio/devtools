/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import React from "react";
const { connect } = require("react-redux");

const { actions } = require("ui/actions");
const { selectors } = require("ui/reducers");
const { trackEvent } = require("ui/utils/telemetry");

const { FILTERS } = require("devtools/client/webconsole/constants");
const { ToggleRow } = require("./ConsoleSettings");

function FilterSettings({
  filters,
  filteredMessagesCount,
  shouldLogExceptions,
  filterToggle,
  logExceptions,
}) {
  function getLabel(baseLabel, filterKey) {
    const count = filteredMessagesCount[filterKey];
    if (count === 0) {
      return baseLabel;
    }
    return `${baseLabel} (${count})`;
  }

  return (
    <div className="flex flex-col">
      {/* Show Error */}
      <ToggleRow
        onClick={() => {
          trackEvent("console.settings.toggle_log_exceptions");
          logExceptions(!shouldLogExceptions);
        }}
        selected={shouldLogExceptions}
        id="show-exceptions"
      >
        Show Exceptions
      </ToggleRow>

      {/* Error */}
      <ToggleRow
        onClick={() => {
          trackEvent("console.settings.toggle_error");
          filterToggle(FILTERS.ERROR);
        }}
        selected={filters[FILTERS.ERROR]}
        id="show-errors"
      >
        {getLabel("Show Errors", FILTERS.ERROR)}
      </ToggleRow>

      {/* Warning */}
      <ToggleRow
        onClick={() => {
          trackEvent("console.settings.toggle_warn");
          filterToggle(FILTERS.WARN);
        }}
        selected={filters[FILTERS.WARN]}
        id="show-warnings"
      >
        {getLabel("Show Warnings", FILTERS.WARN)}
      </ToggleRow>

      {/* Logs */}
      <ToggleRow
        onClick={() => {
          trackEvent("console.settings.toggle_logs");
          filterToggle(FILTERS.LOG);
        }}
        selected={filters[FILTERS.LOG]}
        id="show-logs"
      >
        {getLabel("Show Logs", FILTERS.LOG)}
      </ToggleRow>
    </div>
  );
}

export default connect(
  state => ({
    filters: selectors.getAllFilters(state),
    filteredMessagesCount: selectors.getFilteredMessagesCount(state),
    shouldLogExceptions: selectors.getShouldLogExceptions(state),
  }),
  {
    filterToggle: actions.filterToggle,
    logExceptions: actions.logExceptions,
  }
)(FilterSettings);
