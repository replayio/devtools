/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { Component } from "react";

import { Tree, TreeProps } from "./tree";

export interface ManagedTreeProps<T extends { name: string }>
  extends Omit<TreeProps<T>, "renderItem" | "onExpand" | "onCollapse" | "isExpanded" | "getKey"> {
  expanded?: Set<string>;
  getPath: (item: T) => string;
  getKey?: (item: T) => string;
  listItems?: T[];
  highlightItems?: T[];
  focused?: T;
  onFocus: (item: T | undefined) => void;
  onExpand?: (item: T, expanded: Set<string>) => void;
  onCollapse?: (item: T, expanded: Set<string>) => void;
  renderItem: (
    item: T,
    depth: number,
    isFocused: boolean,
    arrow: React.ReactNode,
    isExpanded: boolean,
    { setExpanded }: { setExpanded: () => void }
  ) => React.ReactNode;
}

interface ManagedTreeState {
  expanded: Set<string>;
}

class ManagedTree<T extends { name: string }> extends Component<
  ManagedTreeProps<T>,
  ManagedTreeState
> {
  constructor(props: ManagedTreeProps<T>) {
    super(props);

    const expanded = props.expanded || new Set();

    if (props.listItems) {
      props.listItems.forEach(item => expanded.add(props.getPath(item)));
    }

    if (props.highlightItems && props.highlightItems.length) {
      // This file is visible, so we highlight it.
      if (expanded.has(props.getPath(props.highlightItems[0]))) {
        props.onFocus(props.highlightItems[0]);
      } else {
        // Look at folders starting from the top-level until finds a
        // closed folder and highlights this folder
        const index = props.highlightItems
          .reverse()
          .findIndex(item => !expanded.has(props.getPath(item)) && item.name !== "root");

        if (props.highlightItems[index]) {
          props.onFocus(props.highlightItems[index]);
        }
      }
    }

    this.state = { expanded };
  }

  static defaultProps = {
    onFocus: () => {},
  };

  UNSAFE_componentWillReceiveProps(nextProps: ManagedTreeProps<T>) {
    const { listItems, highlightItems } = this.props;
    if (nextProps.listItems && nextProps.listItems != listItems) {
      this.expandListItems(nextProps.listItems);
    }

    if (
      nextProps.highlightItems &&
      nextProps.highlightItems != highlightItems &&
      nextProps.highlightItems.length
    ) {
      this.highlightItem(nextProps.highlightItems);
    }
  }

  setExpanded = (item: T, isExpanded: boolean) => {
    const expandItem = (item: T) => {
      const path = this.props.getPath(item);
      if (isExpanded) {
        expanded.add(path);
      } else {
        expanded.delete(path);
      }
    };
    const { expanded } = this.state;
    expandItem(item);

    this.setState({ expanded });

    if (isExpanded && this.props.onExpand) {
      this.props.onExpand(item, expanded);
    } else if (!isExpanded && this.props.onCollapse) {
      this.props.onCollapse(item, expanded);
    }
  };

  expandListItems(listItems: T[]) {
    const { expanded } = this.state;
    listItems.forEach(item => expanded.add(this.props.getPath(item)));
    //this.props.onFocus(listItems[0]);
    this.setState({ expanded });
  }

  highlightItem(highlightItems: T[]) {
    const { expanded } = this.state;
    // This file is visible, so we highlight it.
    if (expanded.has(this.props.getPath(highlightItems[0]))) {
      this.props.onFocus(highlightItems[0]);
    } else {
      // Look at folders starting from the top-level until finds a
      // closed folder and highlights this folder
      const index = highlightItems
        .reverse()
        .findIndex(item => !expanded.has(this.props.getPath(item)) && item.name !== "root");

      if (highlightItems[index]) {
        this.props.onFocus(highlightItems[index]);
      }
    }
  }

  render() {
    const { expanded } = this.state;
    return (
      <div className="managed-tree">
        <Tree<any>
          {...this.props}
          isExpanded={(item: T) => expanded.has(this.props.getPath(item))}
          focused={this.props.focused}
          getKey={this.props.getKey ?? this.props.getPath}
          onExpand={(item: T) => this.setExpanded(item, true)}
          onCollapse={(item: T) => this.setExpanded(item, false)}
          onFocus={this.props.onFocus}
          renderItem={(...args: any[]) =>
            // @ts-expect-error some spread complaint
            this.props.renderItem(...args, {
              setExpanded: this.setExpanded,
            })
          }
        />
      </div>
    );
  }
}

export default ManagedTree;
