/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component } from "react";
import Modal from "./shared/Modal";
import classnames from "classnames";
import { formatKeyShortcut } from "../utils/text";

export class ShortcutsModal extends Component {
  renderPrettyCombos(combo) {
    return combo
      .split(" ")
      .map(c => (
        <span key={c} className="keystroke">
          {c}
        </span>
      ))
      .reduce((prev, curr) => [prev, " + ", curr]);
  }

  renderShorcutItem(title, combo) {
    return (
      <li>
        <span>{title}</span>
        <span>{this.renderPrettyCombos(combo)}</span>
      </li>
    );
  }

  renderSteppingShortcuts() {
    return (
      <ul className="shortcuts-list">
        {this.renderShorcutItem("Step Over", "F10")}
        {this.renderShorcutItem("Step In", "F11")}
        {this.renderShorcutItem("Step Out", formatKeyShortcut("Shift+F11"))}
      </ul>
    );
  }

  renderSearchShortcuts() {
    return (
      <ul className="shortcuts-list">
        {this.renderShorcutItem("Go to file", formatKeyShortcut("CmdOrCtrl+P"))}
        {this.renderShorcutItem("Find next", formatKeyShortcut("Cmd+G"))}
        {this.renderShorcutItem("Find in files", formatKeyShortcut("CmdOrCtrl+Shift+F"))}
        {this.renderShorcutItem("Find function", formatKeyShortcut("CmdOrCtrl+Shift+O"))}
        {this.renderShorcutItem("Find all functions", formatKeyShortcut("CmdOrCtrl+O"))}
        {this.renderShorcutItem("Go to line", formatKeyShortcut("Ctrl+G"))}
      </ul>
    );
  }

  renderShortcutsContent() {
    return (
      <div className={classnames("shortcuts-content", this.props.additionalClass)}>
        <div className="shortcuts-section">
          <h2>{"Stepping"}</h2>
          {this.renderSteppingShortcuts()}
        </div>
        <div className="shortcuts-section">
          <h2>{"Search"}</h2>
          {this.renderSearchShortcuts()}
        </div>
      </div>
    );
  }

  render() {
    const { enabled } = this.props;

    if (!enabled) {
      return null;
    }

    return (
      <Modal in={enabled} additionalClass="shortcuts-modal" handleClose={this.props.handleClose}>
        {this.renderShortcutsContent()}
      </Modal>
    );
  }
}
