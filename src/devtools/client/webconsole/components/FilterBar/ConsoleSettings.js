/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// React & Redux
const { Component } = require("react");
const { createFactory } = require("react");
const PropTypes = require("prop-types");

const actions = require("devtools/client/webconsole/actions/index");
const { l10n } = require("devtools/client/webconsole/utils/messages");

// Additional Components
const MenuButton = createFactory(require("devtools/client/shared/components/menu/MenuButton"));

const MenuItem = createFactory(require("devtools/client/shared/components/menu/MenuItem"));
const MenuList = createFactory(require("devtools/client/shared/components/menu/MenuList"));

const { FILTERS } = require("devtools/client/webconsole/constants");

class ConsoleSettings extends Component {
  static get propTypes() {
    return {
      timestampsVisible: PropTypes.bool.isRequired,
      filter: PropTypes.object.isRequired,
    };
  }

  renderMenuItems() {
    const { dispatch, timestampsVisible, filter } = this.props;

    const items = [];

    // Timestamps
    items.push(
      MenuItem({
        key: "webconsole-console-settings-menu-item-timestamps",
        checked: timestampsVisible,
        className: "menu-item webconsole-console-settings-menu-item-timestamps",
        label: l10n.getStr("webconsole.console.settings.menu.item.timestamps.label"),
        tooltip: l10n.getStr("webconsole.console.settings.menu.item.timestamps.tooltip"),
        onClick: () => dispatch(actions.timestampsToggle()),
      })
    );

    // Timestamps
    items.push(
      MenuItem({
        key: "webconsole-console-settings-add-node-module-messages",
        checked: !filter[FILTERS.NODEMODULES],
        className: "menu-item webconsole-console-settings-add-node-module-messages",
        label: l10n.getStr("webconsole.console.settings.menu.item.nodeModuleMessages.label"),
        tooltip: l10n.getStr("webconsole.console.settings.menu.item.nodeModuleMessages.tooltip"),
        onClick: () => dispatch(actions.filterToggle(FILTERS.NODEMODULES)),
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
        title: l10n.getStr("webconsole.console.settings.menu.button.tooltip"),
      },
      // We pass the children in a function so we don't require the MenuItem and MenuList
      // components until we need to display them (i.e. when the button is clicked).
      () => this.renderMenuItems()
    );
  }
}

module.exports = ConsoleSettings;
