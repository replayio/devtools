/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const throttlingProfiles = require("devtools/client/shared/components/throttling/profiles");
const Types = require("devtools/client/shared/components/throttling/types");

// Localization
const { LocalizationHelper } = require("devtools/shared/l10n");
const PropTypes = require("prop-types");
const { PureComponent } = require("react");
const dom = require("react-dom-factories");
const L10N = new LocalizationHelper("devtools/client/locales/network-throttling.properties");
const NO_THROTTLING_LABEL = L10N.getStr("responsive.noThrottling");

/**
 * This component represents selector button that can be used
 * to throttle network bandwidth.
 */
class NetworkThrottlingMenu extends PureComponent {
  static get propTypes() {
    return {
      networkThrottling: PropTypes.shape(Types.networkThrottling).isRequired,
      onChangeNetworkThrottling: PropTypes.func.isRequired,
    };
  }

  constructor(props) {
    super(props);
    this.onShowThrottlingMenu = this.onShowThrottlingMenu.bind(this);
  }

  onShowThrottlingMenu(event) {
    const { networkThrottling, onChangeNetworkThrottling } = this.props;

    const menuItems = throttlingProfiles.map(profile => {
      return {
        checked: networkThrottling.enabled && profile.id == networkThrottling.profile,
        click: () => onChangeNetworkThrottling(true, profile.id),
        label: profile.id,
        type: "checkbox",
      };
    });

    menuItems.unshift("-");

    menuItems.unshift({
      checked: !networkThrottling.enabled,
      click: () => onChangeNetworkThrottling(false, ""),
      label: NO_THROTTLING_LABEL,
      type: "checkbox",
    });

    showMenu(menuItems, { button: event.target });
  }

  render() {
    const { networkThrottling } = this.props;
    const selectedProfile = networkThrottling.enabled
      ? networkThrottling.profile
      : NO_THROTTLING_LABEL;

    return dom.button(
      {
        className: "devtools-button devtools-dropdown-button",
        id: "network-throttling-menu",
        onClick: this.onShowThrottlingMenu,
        title: selectedProfile,
      },
      dom.span({ className: "title" }, selectedProfile)
    );
  }
}

module.exports = NetworkThrottlingMenu;
