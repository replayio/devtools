/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import classnames from "classnames";
import React, { Component } from "react";
import { ConnectedProps, connect } from "react-redux";

import { showMenu } from "devtools/shared/contextmenu";
import { copyToClipboard } from "replay-next/components/sources/utils/clipboard";
import { Redacted } from "ui/components/Redacted";
import type { SourceDetails } from "ui/reducers/sources";
import { getHasSiblingOfSameName, getSourceContent, isFulfilled } from "ui/reducers/sources";
import type { UIState } from "ui/state";

import type { ContextMenuItem } from "../../reducers/types";
import { getContext } from "../../selectors";
import { getSourceQueryString } from "../../utils/source";
import { getPathWithoutThread, isDirectory } from "../../utils/sources-tree";
import { TreeNode } from "../../utils/sources-tree/types";
import AccessibleImage from "../shared/AccessibleImage";
import SourceIcon from "../shared/SourceIcon";

interface STIProps {
  item: TreeNode;
  depth: number;
  focused: boolean;
  autoExpand: boolean;
  expanded: boolean;
  focusItem: (item: TreeNode) => void;
  selectItem: (item: TreeNode) => void;
  source: SourceDetails;
  debuggeeUrl: string;
  setExpanded: (item: TreeNode, a: boolean, b: boolean) => void;
}

const mapStateToProps = (state: UIState, props: STIProps) => {
  const { source, item } = props;
  return {
    cx: getContext(state),
    hasSiblingOfSameName: getHasSiblingOfSameName(state, source),
    sourceContent: source ? getSourceContentValue(state, source) : null,
  };
};

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type FinalSTIProps = PropsFromRedux & STIProps;

class SourceTreeItem extends Component<FinalSTIProps> {
  componentDidMount() {
    const { autoExpand, item } = this.props;
    if (autoExpand) {
      this.props.setExpanded(item, true, false);
    }
  }

  onClick = () => {
    const { item, focusItem, selectItem } = this.props;

    focusItem(item);
    if (!isDirectory(item)) {
      selectItem(item);
    }
  };

  onContextMenu = (event: React.MouseEvent, item: TreeNode) => {
    // TODO [FE-926] Review source editor context menu for re-adding later
    // This includes actual implementation (legacy FF menu vs something new),
    // as well as what menu items it should contain.
    const copySourceUri2Label = "Copy source URI";
    const copySourceUri2Key = "u";

    event.stopPropagation();
    event.preventDefault();

    const menuOptions: ContextMenuItem[] = [];

    if (!isDirectory(item)) {
      // Flow requires some extra handling to ensure the value of contents.
      const { contents } = item;

      if (!Array.isArray(contents)) {
        const copySourceUri2: ContextMenuItem = {
          id: "node-menu-copy-source",
          label: copySourceUri2Label,
          accesskey: copySourceUri2Key,
          disabled: false,
          click: () => copyToClipboard(contents.url || ""),
        };

        const { source } = this.props;
        if (source) {
          menuOptions.push(copySourceUri2);
        }
      }
    }

    if (isDirectory(item)) {
      this.addCollapseExpandAllOptions(menuOptions, item);
    }

    showMenu(event, menuOptions);
  };

  addCollapseExpandAllOptions = (menuOptions: ContextMenuItem[], item: TreeNode) => {
    const { setExpanded } = this.props;

    menuOptions.push({
      id: "node-menu-collapse-all",
      label: "Collapse all",
      disabled: false,
      click: () => setExpanded(item, false, true),
    });

    menuOptions.push({
      id: "node-menu-expand-all",
      label: "Expand all",
      disabled: false,
      click: () => setExpanded(item, true, true),
    });
  };

  renderItemArrow() {
    const { item, expanded } = this.props;
    const shouldShowArrow = isDirectory(item) || item.type === "multiSource";
    return shouldShowArrow ? (
      <AccessibleImage className={classnames("arrow", { expanded })} />
    ) : (
      <span className="img no-arrow" />
    );
  }

  renderIcon(item: TreeNode, depth: number) {
    const { source } = this.props;

    if (item.name === "webpack://") {
      return <AccessibleImage className="webpack" />;
    } else if (item.name === "ng://") {
      return <AccessibleImage className="angular" />;
    }

    if (isDirectory(item)) {
      // Domain level
      if (depth === 0) {
        return <AccessibleImage className="globe-small" />;
      }
      return <AccessibleImage className="folder" />;
    }

    if (source) {
      return <SourceIcon source={source} shouldHide={(icon: string) => icon === "extension"} />;
    }

    return null;
  }

  renderItemName(depth: number) {
    const { item } = this.props;

    switch (item.name) {
      case "ng://":
        return "Angular";
      case "webpack://":
        return "Webpack";
      default:
        return `${unescape(item.name)}`;
    }
  }

  renderItemTooltip() {
    const { item, depth } = this.props;

    return item.type === "source" ? unescape(item.contents.url!) : getPathWithoutThread(item.path);
  }

  render() {
    const { item, depth, source, focused, hasSiblingOfSameName } = this.props;

    const suffix = null;

    let querystring;
    if (hasSiblingOfSameName) {
      querystring = getSourceQueryString(source);
    }

    const query =
      hasSiblingOfSameName && querystring ? <span className="query">{querystring}</span> : null;

    return (
      <div
        className={classnames("node", { focused })}
        data-item-name={`SourceTreeItem-${item.name.replace(/ /g, "")}`}
        key={item.path}
        onClick={this.onClick}
        onContextMenu={e => this.onContextMenu(e, item)}
        title={this.renderItemTooltip()}
      >
        {this.renderItemArrow()}
        {this.renderIcon(item, depth)}

        <Redacted className="label">
          {this.renderItemName(depth)}
          {query} {suffix}
        </Redacted>
      </div>
    );
  }
}

function getSourceContentValue(state: UIState, source: SourceDetails) {
  const content = getSourceContent(state, source.id);
  return content && isFulfilled(content) ? content.value : null;
}

export default connector(SourceTreeItem);
