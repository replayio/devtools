/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import classnames from "classnames";
//
import React, { Component } from "react";

import { scrollList } from "../../utils/result-list";
import { SearchResultWithHighlighting } from "../QuickOpenModal";
import AccessibleImage from "./AccessibleImage";

interface ResultListProps {
  dataTestId?: string;
  role?: string;
  items: SearchResultWithHighlighting[];
  expanded: boolean;
  selected: number;
  size?: string;
  selectItem: (e: any, item: SearchResultWithHighlighting) => void;
}

export default class ResultList extends Component<ResultListProps> {
  listItemNodes: Record<number, HTMLElement> = {};

  static defaultProps = {
    size: "small",
    role: "listbox",
  };

  scrollList = (newSelectedIndex: number) => {
    if (newSelectedIndex in this.listItemNodes) {
      scrollList(this.listItemNodes, newSelectedIndex);
    }
  };

  renderListItem = (item: SearchResultWithHighlighting, index: number) => {
    if (item.value === "/" && item.title === "") {
      item.title = "(index)";
    }

    const { selectItem, selected } = this.props;
    const props: React.ComponentPropsWithRef<"li"> = {
      onClick: (event: any) => selectItem(event, item),
      ref: element => {
        // Keep a lookup table of items by index for scrolling
        if (element) {
          this.listItemNodes[index] = element;
        } else {
          delete this.listItemNodes[index];
        }
      },
      title: item.value,
      "aria-labelledby": `${item.id}-title`,
      "aria-describedby": `${item.id}-subtitle`,
      role: "option",
      className: classnames("result-item", {
        selected: index === selected,
      }),
    };

    return (
      <li key={`${item.id}${item.value}${index}`} {...props}>
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
    const { dataTestId, size, items, role } = this.props;

    return (
      <ul
        className={classnames("result-list", size)}
        data-test-id={dataTestId}
        id="result-list"
        role={role}
        aria-live="polite"
      >
        {items.map(this.renderListItem)}
      </ul>
    );
  }
}
