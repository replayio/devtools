/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// React & Redux
const { Component } = require("react");
const { connect } = require("react-redux");
const { createFactory } = require("react");
const PropTypes = require("prop-types");

const { actions } = require("ui/actions");
const { l10n } = require("devtools/client/webconsole/utils/messages");
const { selectors } = require("ui/reducers");

// Additional Components
const MenuButton = createFactory(require("devtools/client/shared/components/menu/MenuButton"));

const MenuItem = createFactory(require("devtools/client/shared/components/menu/MenuItem"));
const MenuList = createFactory(require("devtools/client/shared/components/menu/MenuList"));

const { FILTERS } = require("devtools/client/webconsole/constants");

class ConsoleSettings extends Component {
  static get propTypes() {
    return {
      timestampsVisible: PropTypes.bool.isRequired,
    };
  }

  getLabel(baseLabel, filterKey) {
    const { filters, filteredMessagesCount } = this.props;

    const count = filteredMessagesCount[filterKey];
    if (filters[filterKey] || count === 0) {
      return baseLabel;
    }
    return `${baseLabel} (${count})`;
  }

  renderMenuItems() {
    const {
      timestampsVisible,
      filters,
      filterToggle,
      timestampsToggle,
      shouldLogExceptions,
      logExceptions,
    } = this.props;
    const items = [];

    items.push(
      MenuItem({
        key: "webconsole-console-settings-log-exceptions",
        checked: shouldLogExceptions,
        className: "menu-item",
        label: "Show Exceptions",
        onClick: () => logExceptions(!shouldLogExceptions),
      })
    );

    items.push(
      MenuItem({
        key: "webconsole-console-settings-filter-errors",
        checked: filters[FILTERS.ERROR],
        className: "menu-item",
        label: this.getLabel("Show Errors", FILTERS.ERROR),
        onClick: () => filterToggle(FILTERS.ERROR),
      })
    );

    items.push(
      MenuItem({
        key: "webconsole-console-settings-filter-warnings",
        checked: filters[FILTERS.WARN],
        className: "menu-item",
        label: this.getLabel("Show Warnings", FILTERS.WARN),
        onClick: () => filterToggle(FILTERS.WARN),
      })
    );

    items.push(
      MenuItem({
        key: "webconsole-console-settings-filter-logs",
        checked: filters[FILTERS.LOG],
        className: "menu-item",
        label: this.getLabel("Show Logs", FILTERS.LOG),
        onClick: () => filterToggle(FILTERS.LOG),
      })
    );

    items.push(
      MenuItem({
        key: "separator",
        role: "menuseparator",
      })
    );

    // Filter for node modules
    items.push(
      MenuItem({
        key: "webconsole-console-settings-add-node-module-messages",
        checked: !filters[FILTERS.NODEMODULES],
        className: "menu-item webconsole-console-settings-add-node-module-messages",
        label: "Hide Node Module Messages",
        tooltip: "While enabled, messages from the node_modules directory are hidden",
        onClick: () => filterToggle(FILTERS.NODEMODULES),
      })
    );

    // Timestamps
    items.push(
      MenuItem({
        key: "webconsole-console-settings-menu-item-timestamps",
        checked: timestampsVisible,
        className: "menu-item webconsole-console-settings-menu-item-timestamps",
        label: "Show Timestamps",
        tooltip:
          "If you enable this option commands and output in the Web Console will display a timestamp",
        onClick: timestampsToggle,
      })
    );

    return MenuList({ id: "webconsole-console-settings-menu-list" }, items);
  }

  render() {
    return MenuButton(
      {
        menuId: "webconsole-console-settings-menu-button",
        toolboxDoc: document,
        className: "devtools-button webconsole-console-settings-menu-button",
        title: "Console Settings",
      },
      // We pass the children in a function so we don't require the MenuItem and MenuList
      // components until we need to display them (i.e. when the button is clicked).
      () => this.renderMenuItems()
    );
  }
}

module.exports = connect(
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
)(ConsoleSettings);
