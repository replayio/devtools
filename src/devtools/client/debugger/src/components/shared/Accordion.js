/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import classNames from "classnames";
import findLastIndex from "lodash/findLastIndex";
import lastIndexOf from "lodash/lastIndexOf";
import React, { cloneElement, Component } from "react";
import AccessibleImage from "./AccessibleImage";

class Accordion extends Component {
  handleHeaderClick(i) {
    const item = this.props.items[i];
    const opened = !item.opened;
    item.opened = opened;

    if (item.onToggle) {
      item.onToggle(opened);
    }

    // We force an update because otherwise the accordion
    // would not re-render
    this.forceUpdate();
  }

  onHandleHeaderKeyDown(e, i) {
    if (e && (e.key === " " || e.key === "Enter")) {
      this.handleHeaderClick(i);
    }
  }

  renderContainer = (item, i) => {
    const { opened } = item;
    const lastOpenedIndex = i === findLastIndex(this.props.items, item => item.opened);

    return (
      <li
        className={classNames(item.className, item.opened ? "expanded" : "collapsed", {
          lastOpen: lastOpenedIndex,
        })}
        key={i}
      >
        <h2
          className="_header bg-themeTabBackground"
          tabIndex="0"
          onKeyDown={e => this.onHandleHeaderKeyDown(e, i)}
          onClick={() => this.handleHeaderClick(i)}
        >
          <AccessibleImage className={`arrow ${opened ? "expanded" : ""}`} />
          <span className="header-label">{item.header}</span>
          {item.buttons ? (
            <div className="header-buttons" tabIndex="-1">
              {item.buttons}
            </div>
          ) : null}
        </h2>
        {opened && (
          <div className="_content">{cloneElement(item.component, item.componentProps || {})}</div>
        )}
      </li>
    );
  };
  render() {
    return <ul className="accordion">{this.props.items.map(this.renderContainer)}</ul>;
  }
}

export default Accordion;
