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

export function CountPill({ children }) {
  return (
    <span className="flex-shrink-0 rounded-md bg-themeMenuHighlight py-0.5 px-2 font-mono text-bodyColor">
      {children}
    </span>
  );
}

function FilterToggle({ children, count, onClick, selected, id }) {
  return (
    <ToggleRow onClick={onClick} selected={selected} id={id}>
      <div className="justify flex items-center justify-between">
        <span className="flex-grow overflow-hidden overflow-ellipsis whitespace-pre py-0.5">
          {children}
        </span>
        {count ? <CountPill>{count}</CountPill> : null}
      </div>
    </ToggleRow>
  );
}

function FilterSettings({
  filters,
  filteredMessagesCount,
  shouldLogExceptions,
  filterToggled,
  logExceptions,
}) {
  function getCount(filterKey) {
    return filteredMessagesCount[filterKey];
  }

  return (
    <div className="flex flex-col">
      <FilterToggle
        onClick={() => {
          trackEvent("console.settings.toggle_log_exceptions");
          logExceptions(!shouldLogExceptions);
        }}
        selected={shouldLogExceptions}
        id="show-exceptions"
      >
        Exceptions
      </FilterToggle>
      <FilterToggle
        count={getCount(FILTERS.ERROR)}
        onClick={() => {
          trackEvent("console.settings.toggle_error");
          filterToggled(FILTERS.ERROR);
        }}
        selected={filters[FILTERS.ERROR]}
        id="show-errors"
      >
        Errors
      </FilterToggle>
      <FilterToggle
        count={getCount(FILTERS.WARN)}
        onClick={() => {
          trackEvent("console.settings.toggle_warn");
          filterToggled(FILTERS.WARN);
        }}
        selected={filters[FILTERS.WARN]}
        id="show-warnings"
      >
        Warnings
      </FilterToggle>
      <FilterToggle
        count={getCount(FILTERS.LOG)}
        onClick={() => {
          trackEvent("console.settings.toggle_logs");
          filterToggled(FILTERS.LOG);
        }}
        selected={filters[FILTERS.LOG]}
        id="show-logs"
      >
        Logs
      </FilterToggle>
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
    filterToggled: actions.filterToggled,
    logExceptions: actions.logExceptions,
  }
)(FilterSettings);
