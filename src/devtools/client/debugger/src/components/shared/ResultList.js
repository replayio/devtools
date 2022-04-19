/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import classnames from "classnames";
import React, { Component } from "react";

import AccessibleImage from "./AccessibleImage";

export default class ResultList extends Component {
  static defaultProps = {
    role: "listbox",
    size: "small",
  };

  renderListItem = (item, index) => {
    if (item.value === "/" && item.title === "") {
      item.title = "(index)";
    }

    const { selectItem, selected } = this.props;
    const props = {
      "aria-describedby": `${item.id}-subtitle`,
      "aria-labelledby": `${item.id}-title`,
      className: classnames("result-item", {
        selected: index === selected,
      }),
      key: `${item.id}${item.value}${index}`,
      onClick: event => selectItem(event, item, index),
      ref: String(index),
      role: "option",
      title: item.value,
    };

    return (
      <li {...props}>
        {item.icon && (
          <div className="icon">
            <AccessibleImage className={item.icon} />
          </div>
        )}
        <div id={`${item.id}-title`} className="title">
          {item.title}
          {item.secondaryTitle && <div className="secondary-title">{item.secondaryTitle}</div>}
        </div>

        {item.subtitle != item.title ? (
          <div id={`${item.id}-subtitle`} className="subtitle">
            {item.subtitle}
          </div>
        ) : null}
      </li>
    );
  };

  render() {
    const { size, items, role } = this.props;

    return (
      <ul
        className={classnames("result-list", size)}
        id="result-list"
        role={role}
        aria-live="polite"
      >
        {items.map(this.renderListItem)}
      </ul>
    );
  }
}
