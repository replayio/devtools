import React, { Component, useEffect } from "react";
import { ConnectedProps, connect } from "react-redux";

import { focusItem, setExpandedState } from "devtools/client/debugger/src/actions/source-tree";
import { selectSource } from "devtools/client/debugger/src/actions/sources/select";
import { getContext } from "devtools/client/debugger/src/reducers/pause";
import {
  getExpandedState,
  getFocusedSourceItem,
} from "devtools/client/debugger/src/reducers/source-tree";
import { getShownSource } from "devtools/client/debugger/src/reducers/ui";
import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";
import NagDismiss from "ui/components/NagDismiss";
import {
  SourceDetails,
  getSelectedSource,
  getSourceDetailsCount,
  getSourcesLoading,
  getSourcesToDisplayByUrl,
} from "ui/reducers/sources";
import type { UIState } from "ui/state";
import { trackEvent } from "ui/utils/telemetry";

import {
  SourcesMap,
  createTree,
  getDirectories,
  getSourceFromNode,
  isDirectory,
  nodeHasChildren,
  updateTree,
} from "../../utils/sources-tree";
import { TreeDirectory, TreeNode } from "../../utils/sources-tree/types";
import ManagedTree from "../shared/ManagedTree";
import SourcesTreeItem from "./SourcesTreeItem";

type $FixTypeLater = any;

function shouldAutoExpand(depth: number, item: TreeNode) {
  if (depth !== 1) {
    return false;
  }

  return item.name === "";
}

function findSource(sourcesByUrl: Record<string, SourceDetails>, source: SourceDetails) {
  if (source) {
    return sourcesByUrl[source.url!];
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
  selectSource,
  setExpandedState,
  focusItem,
});

export type PropsFromRedux = ConnectedProps<typeof connector> & {
  expanded: Set<unknown>;
};

interface STState {
  uncollapsedTree: TreeDirectory;
  sourceTree: TreeNode;
  parentMap: WeakMap<object, any>;
  listItems?: TreeNode[];
  highlightItems?: TreeNode[];
}

class SourcesTree extends Component<PropsFromRedux, STState> {
  constructor(props: PropsFromRedux) {
    const updatedProps = {
      ...props,
      cx: { navigateCounter: 0 },
      sourcesLoading: false,
      shownSource: null,
      selectedSource: null,
      focused: null,
      sources: {},
      sourceCount: 0,
    };

    super(updatedProps);

    const { sources } = updatedProps;

    const state = createTree({
      sources: sources as SourcesMap,
    }) as STState;

    if (updatedProps.shownSource) {
      const listItems = getDirectories(updatedProps.shownSource, state.sourceTree as TreeDirectory);
      state.listItems = listItems;
    }

    if (updatedProps.selectedSource) {
      const highlightItems = getDirectories(
        updatedProps.selectedSource,
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

  selectItem = (item: TreeNode | undefined) => {
    if (item && item.type == "source" && !Array.isArray(item.contents)) {
      trackEvent("source_explorer.select_source");
      this.props.selectSource(this.props.cx, item.contents.id);
    }
  };

  onFocus = (item: TreeNode | undefined) => {
    this.props.focusItem(item);
  };

  onActivate = (item: TreeNode | undefined) => {
    this.selectItem(item);
  };

  // NOTE: we get the source from sources because item.contents is cached
  getSource(item: TreeNode) {
    const source = getSourceFromNode(item);
    return findSource(this.props.sources, source!);
  }

  getPath = (item: TreeNode) => {
    const { path } = item;
    const source = this.getSource(item);

    if (!source || isDirectory(item)) {
      return path;
    }

    return `${path}/${source.id}/`;
  };

  getKey = (item: TreeNode) => {
    const { path } = item;
    const source = this.getSource(item);

    if (item.type === "source" && source) {
      // Probably overkill
      return `${source.url!}${source.contentHash || ""}${source.id}`;
    }

    return path;
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
    return sourceTree.contents as TreeNode[];
  };

  getChildren = (item: TreeNode) => {
    return nodeHasChildren(item) ? (item.contents as TreeNode[]) : [];
  };

  renderItem = (
    item: TreeNode,
    depth: number,
    focused: boolean,
    _: any,
    expanded: boolean,
    { setExpanded }: { setExpanded: (item: TreeNode) => void }
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

    return (
      <ManagedTree<TreeNode>
        autoExpandAll={false}
        autoExpandDepth={1}
        expanded={expanded}
        focused={focused as any}
        getChildren={this.getChildren}
        getParent={(item: TreeNode) => parentMap.get(item)}
        getPath={this.getPath}
        getKey={this.getKey}
        getRoots={() => this.getRoots(sourceTree)}
        highlightItems={highlightItems}
        key={this.isEmpty() ? "empty" : "full"}
        listItems={listItems}
        onCollapse={this.onCollapse}
        onExpand={this.onExpand}
        onFocus={this.onFocus}
        onActivate={this.onActivate}
        renderItem={this.renderItem}
        preventBlur={true}
      />
    );
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

const WrappedSourcesTree = (props: PropsFromRedux) => {
  const [, dismissExploreSourcesNag] = useNag(Nag.EXPLORE_SOURCES);

  useEffect(() => {
    dismissExploreSourcesNag();
  }, []);

  // Directly pass the props down to SourcesTree without destructuring
  return <SourcesTree {...props} />;
};

export default connector(WrappedSourcesTree);
