/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import React, { useState } from "react";
const { connect } = require("react-redux");
import classNames from "classnames";

const { actions } = require("ui/actions");
const { selectors } = require("ui/reducers");
const { trackEvent } = require("ui/utils/telemetry");

import PortalDropdown from "ui/components/shared/PortalDropdown";
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
  DropdownItemContent,
} from "ui/components/Library/LibraryDropdown";
import MaterialIcon from "ui/components/shared/MaterialIcon";

const { FILTERS } = require("devtools/client/webconsole/constants");

function _ConsoleSettings({
  filters,
  filteredMessagesCount,
  shouldLogExceptions,
  filterToggle,
  timestampsToggle,
  timestampsVisible,
  logExceptions,
}) {
  const [expanded, setExpanded] = useState(false);

  function getLabel(baseLabel, filterKey) {
    const count = filteredMessagesCount[filterKey];
    if (count === 0) {
      return baseLabel;
    }
    return `${baseLabel} (${count})`;
  }

  const button = (
    <MaterialIcon outlined className="h-4 w-4 text-gray-600 hover:text-primaryAccentHover">
      more_vert
    </MaterialIcon>
  );

  return (
    <PortalDropdown
      buttonContent={button}
      setExpanded={setExpanded}
      expanded={expanded}
      buttonStyle=""
      distance={0}
      position="bottom-left"
    >
      <Dropdown>
        {/* Show Error */}
        <DropdownItem
          onClick={() => {
            trackEvent("console.settings.toggle_log_exceptions");
            logExceptions(!shouldLogExceptions);
          }}
        >
          <DropdownItemContent selected={shouldLogExceptions} icon="bug_report">
            Show Exceptions
          </DropdownItemContent>
        </DropdownItem>

        {/* Error */}
        <DropdownItem
          onClick={() => {
            trackEvent("console.settings.toggle_error");
            filterToggle(FILTERS.ERROR);
          }}
        >
          <DropdownItemContent selected={filters[FILTERS.ERROR]} icon="error_outline">
            {getLabel("Show Errors", FILTERS.ERROR)}
          </DropdownItemContent>
        </DropdownItem>

        {/* Warning */}
        <DropdownItem
          onClick={() => {
            trackEvent("console.settings.toggle_warn");
            filterToggle(FILTERS.WARN);
          }}
        >
          <DropdownItemContent selected={filters[FILTERS.WARN]} icon="report_problem">
            {getLabel("Show Warnings", FILTERS.WARN)}
          </DropdownItemContent>
        </DropdownItem>

        {/* Logs */}
        <DropdownItem
          onClick={() => {
            trackEvent("console.settings.toggle_logs");
            filterToggle(FILTERS.LOG);
          }}
        >
          <DropdownItemContent selected={filters[FILTERS.LOG]} icon="article">
            {getLabel("Show Logs", FILTERS.LOG)}
          </DropdownItemContent>
        </DropdownItem>
        <DropdownDivider />

        <DropdownItem
          onClick={() => {
            trackEvent("console.settings.toggle_node_modules");
            filterToggle(FILTERS.NODEMODULES);
          }}
        >
          <DropdownItemContent selected={!filters[FILTERS.NODEMODULES]} icon="book">
            Hide Node Modules
          </DropdownItemContent>
        </DropdownItem>
        <DropdownItem
          onClick={() => {
            trackEvent("console.settings.toggle_timestamp");
            timestampsToggle();
          }}
        >
          <DropdownItemContent selected={timestampsVisible} icon="schedule">
            Show Timestamps
          </DropdownItemContent>
        </DropdownItem>
      </Dropdown>
    </PortalDropdown>
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
    timestampsToggle: actions.timestampsToggle,
    logExceptions: actions.logExceptions,
  }
)(_ConsoleSettings);
