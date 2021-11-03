/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { Component } from "react";
import classnames from "classnames";

export class Dropdown extends Component {
  toggleDropdown;

  state = {
    dropdownShown: false,
  };

  static defaultProps = {
    panelStyles: {},
  };

  toggleDropdown = e => {
    this.setState(prevState => ({
      dropdownShown: !prevState.dropdownShown,
    }));
  };

  renderPanel() {
    const { panelStyles } = this.props;
    return (
      <div
        className="dropdown"
        onClick={this.toggleDropdown}
        style={{ display: this.state.dropdownShown ? "block" : "none", ...panelStyles }}
      >
        {this.props.panel}
      </div>
    );
  }

  renderButton() {
    return (
      // eslint-disable-next-line prettier/prettier
      <button className="dropdown-button" onClick={this.toggleDropdown}>
        {this.props.icon}
      </button>
    );
  }

  renderMask() {
    return (
      <div
        className="dropdown-mask"
        onClick={this.toggleDropdown}
        style={{ display: this.state.dropdownShown ? "block" : "none" }}
      />
    );
  }

  render() {
    return (
      <div className={classnames("dropdown-block", { open: this.state.dropdownShown })}>
        {this.renderPanel()}
        {this.renderButton()}
        {this.renderMask()}
      </div>
    );
  }
}

export default Dropdown;
