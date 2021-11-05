/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component } from "react";
import classnames from "classnames";

export default class OutlineFilter extends Component {
  state = { focused: false };

  setFocus = shouldFocus => {
    this.setState({ focused: shouldFocus });
  };

  onChange = e => {
    this.props.updateFilter(e.target.value);
  };

  onKeyDown = e => {
    if (e.key === "Escape" && this.props.filter !== "") {
      // use preventDefault to override toggling the split-console which is
      // also bound to the ESC key
      e.preventDefault();
      this.props.updateFilter("");
    } else if (e.key === "Enter") {
      // We must prevent the form submission from taking any action
      // https://github.com/firefox-devtools/debugger/pull/7308
      e.preventDefault();
    }
  };

  render() {
    return (
      <div className="outline-filter sticky top-0 pt-1 px-3">
        <form>
          <input
            className={"w-full h-full text-xs px-2 py-1 rounded-md"}
            onFocus={() => this.setFocus(true)}
            onBlur={() => this.setFocus(false)}
            placeholder={"Filter functions"}
            value={this.props.filter}
            type="text"
            onChange={this.onChange}
            onKeyDown={this.onKeyDown}
          />
        </form>
      </div>
    );
  }
}
