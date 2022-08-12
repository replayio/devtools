/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

// Dependencies
import React, { Component } from "react";

import { connect, ConnectedProps } from "react-redux";

import type { UIState } from "ui/state";

// Selectors
import {
  getShownSource,
  getExpandedState,
  getFocusedSourceItem,
  getContext,
} from "../../selectors";

import {
  getSelectedSource,
  getSourcesLoading,
  SourceDetails,
  getSourceDetailsCount,
  getSourcesToDisplayByUrl,
} from "ui/reducers/sources";

// Actions
import actions from "../../actions";

// Components
import SourcesTreeItem from "./SourcesTreeItem";
import ManagedTree from "../shared/ManagedTree";

// Utils
import {
  createTree,
  getDirectories,
  isDirectory,
  getSourceFromNode,
  nodeHasChildren,
  updateTree,
  SourcesMap,
} from "../../utils/sources-tree";
import { parse } from "../../utils/url";
import { trackEvent } from "ui/utils/telemetry";
import { TreeDirectory, TreeNode, TreeSource } from "../../utils/sources-tree/types";

type $FixTypeLater = any;

function shouldAutoExpand(depth: number, item: TreeNode) {
  if (depth !== 1) {
    return false;
  }

  return item.name === "";
}

function findSource(
  sources: Record<string, SourceDetails>,
  itemPath: string,
  source: SourceDetails
) {
  if (source) {
    return sources[source.id];
  }
  return source;
}

const mapStateToProps = (state: UIState) => {
  const selectedSource = getSelectedSource(state);
  const shownSource = getShownSource(state);
  const sources = getSourcesToDisplayByUrl(state) as Record<string, SourceDetails>;

  return {
    cx: getContext(state),
    sourcesLoading: getSourcesLoading(state),
    shownSource: shownSource,
    selectedSource: selectedSource,
    expanded: getExpandedState(state),
    focused: getFocusedSourceItem(state),
    sources,
    sourceCount: getSourceDetailsCount(state),
  };
};

const connector = connect(mapStateToProps, {
  selectSource: actions.selectSource,
  setExpandedState: actions.setExpandedState,
  focusItem: actions.focusItem,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

interface STState {
  uncollapsedTree: TreeDirectory;
  sourceTree: TreeNode;
  parentMap: WeakMap<object, any>;
  listItems?: (TreeDirectory | TreeSource)[];
  highlightItems?: (TreeDirectory | TreeSource)[];
}

class SourcesTree extends Component<PropsFromRedux, STState> {
  constructor(props: PropsFromRedux) {
    super(props);
    const { sources } = this.props;

    const state = createTree({
      sources: sources as SourcesMap,
    }) as STState;

    if (props.shownSource) {
      const listItems = getDirectories(props.shownSource, state.sourceTree as TreeDirectory);
      state.listItems = listItems;
    }

    if (props.selectedSource) {
      const highlightItems = getDirectories(
        props.selectedSource,
        state.sourceTree as TreeDirectory
      );
      state.highlightItems = highlightItems;
    }

    this.state = state;
  }

  UNSAFE_componentWillReceiveProps(nextProps: PropsFromRedux) {
    const { sources, shownSource, selectedSource } = this.props;
    const { uncollapsedTree, sourceTree } = this.state;

    if (nextProps.shownSource && nextProps.shownSource != shownSource) {
      const listItems = getDirectories(nextProps.shownSource, sourceTree as TreeDirectory);
      return this.setState({ listItems });
    }

    if (nextProps.selectedSource && nextProps.selectedSource != selectedSource) {
      const highlightItems = getDirectories(nextProps.selectedSource, sourceTree as TreeDirectory);
      this.setState({ highlightItems });
    }

    // NOTE: do not run this every time a source is clicked,
    // only when a new source is added
    if (nextProps.sources != this.props.sources) {
      this.setState(
        updateTree({
          debuggeeUrl: "",
          newSources: nextProps.sources,
          prevSources: sources,
          uncollapsedTree,
          sourceTree,
        })
      );
    }
  }

  selectItem = (item: TreeNode) => {
    if (item.type == "source" && !Array.isArray(item.contents)) {
      trackEvent("source_explorer.select_source");
      this.props.selectSource(this.props.cx, item.contents.id);
    }
  };

  onFocus = (item: TreeNode) => {
    this.props.focusItem(item);
  };

  onActivate = (item: TreeNode) => {
    this.selectItem(item);
  };

  // NOTE: we get the source from sources because item.contents is cached
  getSource(item: TreeNode) {
    const source = getSourceFromNode(item);
    return findSource(this.props.sources, item.path, source!);
  }

  getPath = (item: TreeNode) => {
    const { path } = item;
    const source = this.getSource(item);

    if (!source || isDirectory(item)) {
      return path;
    }

    return `${path}/${source.id}/`;
  };

  onExpand = (item: TreeNode, expandedState: $FixTypeLater) => {
    this.props.setExpandedState(expandedState);
  };

  onCollapse = (item: TreeNode, expandedState: $FixTypeLater) => {
    this.props.setExpandedState(expandedState);
  };

  isEmpty() {
    const { sourceTree } = this.state;
    if (!Array.isArray(sourceTree.contents)) {
      return true;
    }
    return sourceTree.contents.length === 0;
  }

  renderEmptyElement(message: string) {
    return (
      <div key="empty" className="no-sources-message">
        {message}
      </div>
    );
  }

  getRoots = (sourceTree: TreeNode) => {
    return sourceTree.contents;
  };

  getChildren = (item: TreeNode) => {
    return nodeHasChildren(item) ? item.contents : [];
  };

  renderItem = (
    item: TreeNode,
    depth: number,
    focused: boolean,
    _: any,
    expanded: boolean,
    { setExpanded }: { setExpanded: () => void }
  ) => {
    return (
      <SourcesTreeItem
        item={item}
        depth={depth}
        focused={focused}
        autoExpand={shouldAutoExpand(depth, item)}
        expanded={expanded}
        focusItem={this.onFocus}
        selectItem={this.selectItem}
        source={this.getSource(item)}
        debuggeeUrl={""}
        setExpanded={setExpanded}
      />
    );
  };

  renderTree() {
    const { expanded, focused } = this.props;

    const { highlightItems, listItems, parentMap, sourceTree } = this.state;

    const treeProps = {
      autoExpandAll: false,
      autoExpandDepth: 1,
      expanded,
      focused,
      getChildren: this.getChildren,
      getParent: (item: TreeNode) => parentMap.get(item),
      getPath: this.getPath,
      getRoots: () => this.getRoots(sourceTree),
      highlightItems,
      itemHeight: 21,
      key: this.isEmpty() ? "empty" : "full",
      listItems,
      onCollapse: this.onCollapse,
      onExpand: this.onExpand,
      onFocus: this.onFocus,
      onActivate: this.onActivate,
      renderItem: this.renderItem,
      preventBlur: true,
    };

    return <ManagedTree {...treeProps} />;
  }

  render() {
    const { sourcesLoading } = this.props;
    if (sourcesLoading) {
      return (
        <div key="pane" className="sources-pane">
          {this.renderEmptyElement("Sources are loading.")}
        </div>
      );
    }

    if (this.isEmpty()) {
      return (
        <div key="pane" className="sources-pane">
          {this.renderEmptyElement("This page has no sources.")}
        </div>
      );
    }

    return (
      <div key="pane" className="sources-pane">
        <div key="tree" className="sources-list">
          {this.renderTree()}
        </div>
      </div>
    );
  }
}

export default connector(SourcesTree);
