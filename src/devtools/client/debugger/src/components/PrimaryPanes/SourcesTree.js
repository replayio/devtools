/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

// Dependencies
import React, { Component } from "react";

import { connect } from "../../utils/connect";

// Selectors
import {
  getShownSource,
  getSelectedSource,
  getDebuggeeUrl,
  getExpandedState,
  getDisplayedSources,
  getFocusedSourceItem,
  getContext,
} from "../../selectors";

import { getGeneratedSourceByURL } from "../../reducers/sources";

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
  findSourceTreeNodes,
  getSourceFromNode,
  nodeHasChildren,
  updateTree,
} from "../../utils/sources-tree";
import { parse } from "../../utils/url";
import { getRawSourceURL } from "../../utils/source";
import { trackEvent } from "ui/utils/telemetry";

function shouldAutoExpand(depth, item, debuggeeUrl) {
  if (depth !== 1) {
    return false;
  }

  const { host } = debuggeeUrl.length ? parse(debuggeeUrl) : { host: "" };
  return item.name === host;
}

function findSource({ sources }, itemPath, source) {
  if (source) {
    return sources[source.id];
  }
  return source;
}

class SourcesTree extends Component {
  constructor(props) {
    super(props);
    const { debuggeeUrl, sources } = this.props;

    const state = createTree({
      debuggeeUrl,
      sources,
    });

    if (props.shownSource) {
      const listItems = getDirectories(props.shownSource, state.sourceTree);
      state.listItems = listItems;
    }

    if (props.selectedSource) {
      const highlightItems = getDirectories(props.selectedSource, state.sourceTree);
      state.highlightItems = highlightItems;
    }

    this.state = state;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { debuggeeUrl, sources, shownSource, selectedSource } = this.props;
    const { uncollapsedTree, sourceTree } = this.state;

    if (debuggeeUrl != nextProps.debuggeeUrl || nextProps.sourceCount === 0) {
      // early recreate tree because of changes
      // to project root, debuggee url or lack of sources
      return this.setState(
        createTree({
          sources: nextProps.sources,
          debuggeeUrl: nextProps.debuggeeUrl,
        })
      );
    }

    if (nextProps.shownSource && nextProps.shownSource != shownSource) {
      const listItems = getDirectories(nextProps.shownSource, sourceTree);
      return this.setState({ listItems });
    }

    if (nextProps.selectedSource && nextProps.selectedSource != selectedSource) {
      const highlightItems = getDirectories(nextProps.selectedSource, sourceTree);
      this.setState({ highlightItems });
    }

    // NOTE: do not run this every time a source is clicked,
    // only when a new source is added
    if (nextProps.sources != this.props.sources) {
      this.setState(
        updateTree({
          newSources: nextProps.sources,
          prevSources: sources,
          debuggeeUrl,
          uncollapsedTree,
          sourceTree,
        })
      );
    }
  }

  selectItem = item => {
    if (item.type == "source" && !Array.isArray(item.contents)) {
      trackEvent("source_explorer.select_source");
      this.props.selectSource(this.props.cx, item.contents.id);
    }
  };

  onFocus = item => {
    this.props.focusItem(item);
  };

  onActivate = item => {
    this.selectItem(item);
  };

  // NOTE: we get the source from sources because item.contents is cached
  getSource(item) {
    const source = getSourceFromNode(item);
    return findSource(this.props, item.path, source);
  }

  getPath = item => {
    const { path } = item;
    const source = this.getSource(item);

    if (!source || isDirectory(item)) {
      return path;
    }

    const blackBoxedPart = source.isBlackBoxed ? ":blackboxed" : "";

    return `${path}/${source.id}/${blackBoxedPart}`;
  };

  onExpand = (item, expandedState) => {
    this.props.setExpandedState(expandedState);
  };

  onCollapse = (item, expandedState) => {
    this.props.setExpandedState(expandedState);
  };

  isEmpty() {
    const { sourceTree } = this.state;
    return sourceTree.contents.length === 0;
  }

  renderEmptyElement(message) {
    return (
      <div key="empty" className="no-sources-message">
        {message}
      </div>
    );
  }

  getRoots = sourceTree => {
    return sourceTree.contents;
  };

  getChildren = item => {
    return nodeHasChildren(item) ? item.contents : [];
  };

  renderItem = (item, depth, focused, _, expanded, { setExpanded }) => {
    const { debuggeeUrl } = this.props;

    return (
      <SourcesTreeItem
        item={item}
        depth={depth}
        focused={focused}
        autoExpand={shouldAutoExpand(depth, item, debuggeeUrl)}
        expanded={expanded}
        focusItem={this.onFocus}
        selectItem={this.selectItem}
        source={this.getSource(item)}
        debuggeeUrl={debuggeeUrl}
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
      getParent: item => parentMap.get(item),
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

  renderPane(child) {
    return (
      <div key="pane" className="sources-pane">
        {child}
      </div>
    );
  }

  render() {
    return this.renderPane(
      this.isEmpty() ? (
        this.renderEmptyElement("This page has no sources.")
      ) : (
        <div key="tree" className="sources-list">
          {this.renderTree()}
        </div>
      )
    );
  }
}

function getSourceForTree(state, displayedSources, source) {
  if (!source) {
    return null;
  }

  if (!source.isPrettyPrinted) {
    return source;
  }

  return getGeneratedSourceByURL(state, getRawSourceURL(source.url));
}

const mapStateToProps = (state, props) => {
  const selectedSource = getSelectedSource(state);
  const shownSource = getShownSource(state);
  const sources = getDisplayedSources(state);

  return {
    cx: getContext(state),
    shownSource: shownSource,
    selectedSource: selectedSource,
    debuggeeUrl: getDebuggeeUrl(state),
    expanded: getExpandedState(state),
    focused: getFocusedSourceItem(state),
    sources: sources,
    sourceCount: Object.values(sources).length,
  };
};

export default connect(mapStateToProps, {
  selectSource: actions.selectSource,
  setExpandedState: actions.setExpandedState,
  focusItem: actions.focusItem,
})(SourcesTree);
