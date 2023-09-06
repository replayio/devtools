import classnames from "classnames";
import React, { ReactElement, useCallback, useContext } from "react";
import { shallowEqual } from "react-redux";
import { useImperativeCacheValue } from "suspense";

import NodeConstants from "devtools/shared/dom-node-constants";
import { assert } from "protocol/utils";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import {
  canRenderNodeInfo,
  getCurrentRenderableChildNodeIds,
  processedNodeDataCache,
  renderableChildNodesCache,
} from "ui/suspense/nodeCaches";
import { canHighlightNode } from "ui/suspense/nodeCaches";

import { highlightNode, selectNode, toggleNodeExpanded, unhighlightNode } from "../actions/markup";
import { getIsNodeExpanded, getScrollIntoViewNodeId, getSelectedNodeId } from "../selectors/markup";
import ElementNode from "./ElementNode";
import { MarkupContext } from "./MarkupContext";
import ReadOnlyNode from "./ReadOnlyNode";
import TextNode from "./TextNode";

interface NodeProps {
  nodeId: string;
}

const reIsEmptyValue = /[^\s]/;

function Node({ nodeId }: NodeProps) {
  const dispatch = useAppDispatch();
  const replayClient = useContext(ReplayClientContext);
  const { rootNodeId, pauseId } = useContext(MarkupContext);

  // Do these as one big object, with a shallow comparison,
  // to minimize the number of Redux subscriptions
  const { isSelectedNode, isScrollIntoViewNode, isExpanded } = useAppSelector(
    state => ({
      isSelectedNode: nodeId === getSelectedNodeId(state),
      isScrollIntoViewNode: nodeId === getScrollIntoViewNodeId(state),
      isExpanded: getIsNodeExpanded(state, nodeId),
    }),
    shallowEqual
  );

  const scrollIntoView = useCallback((el: HTMLElement | null) => {
    if (!el) {
      return;
    }
    const { top, bottom } = el.getBoundingClientRect();
    const container = document.getElementById("markup-box");
    assert(container, "no markup container");
    const { top: containerTop, bottom: containerBottom } = container.getBoundingClientRect();
    if (top < containerTop || bottom > containerBottom) {
      // Chrome sometimes ignores element.scrollIntoView() here,
      // calling it with a little delay fixes it.
      // Also, increase the delay to account for siblings/ancestors
      // popping in when a deeply nested node item is picked,
      // and we have its direct ancestor data but fetch others.
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 1000);
    }
  }, []);

  // Ensure that we have the processed node data for _this_ node.
  const { value: node, status: nodeStatus } = useImperativeCacheValue(
    processedNodeDataCache,
    replayClient,
    pauseId!,
    nodeId
  );

  // Fetching "renderable" child node data here serves two purposes:
  // 1) It allows us to only render meaningful child nodes,
  //    omitting whitespace and empty text nodes.
  //    (We currently have no way to filter that list in the backend.)
  // 2) We actually pre-fetch these children regardless of whether the
  //    node is expanded or not. That means that when the user does expand
  //    this node, we already have the data for each child and it will
  //    render the content immediately.
  const { value: renderableChildNodes, status: childNodesStatus } = useImperativeCacheValue(
    renderableChildNodesCache,
    replayClient,
    pauseId!,
    nodeId
  );

  if (nodeStatus === "rejected" || (node && !canRenderNodeInfo(node))) {
    return null;
  }

  const onExpanderToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    dispatch(toggleNodeExpanded(nodeId, isExpanded));
  };

  const onSelectNodeClick = (event: React.MouseEvent) => {
    event.stopPropagation();

    // Don't reselect the same selected node.
    if (isSelectedNode) {
      return;
    }

    dispatch(selectNode(nodeId));
  };

  const onMouseEnter = () => {
    if (node && canHighlightNode(node)) {
      dispatch(highlightNode(nodeId));
    }
  };

  const onMouseLeave = () => {
    dispatch(unhighlightNode());
  };

  let renderedNodeContent: ReactElement | null = null;

  const canExpand = !!node?.hasChildren;
  const showExpander = canExpand && node.parentNodeId !== rootNodeId;

  if (nodeStatus === "pending") {
    console.log("Rendering pending: ", nodeId);
    renderedNodeContent = <span>Loading…</span>;
  } else if (node) {
    let renderedChildren: ReactElement | null = null;
    let renderedClosingTag: ReactElement | null = null;
    let renderedComponent: ReactElement | null = null;

    // This will be either _all_ child nodes if we have them
    // available, or a filtered list of non-text nodes
    const childNodeIds = getCurrentRenderableChildNodeIds(
      replayClient,
      pauseId!,
      node,
      childNodesStatus === "resolved" ? renderableChildNodes : null
    );

    if (isExpanded && childNodeIds.length) {
      renderedChildren = (
        <ul className="children" role={node.hasChildren ? "group" : ""}>
          {childNodeIds.map(nodeId => (
            <Node key={nodeId} nodeId={nodeId} />
          ))}
        </ul>
      );
    }

    if (canExpand) {
      renderedClosingTag = (
        <div className="tag-line" role="presentation">
          <div className="tag-state"></div>
          <span className="close">
            {"</"}
            <span className="tag theme-fg-color3">{node.displayName}</span>
            {">"}
          </span>
        </div>
      );
    }

    if (node.type === NodeConstants.ELEMENT_NODE) {
      renderedComponent = <ElementNode node={node} />;
    } else if (
      node.type === NodeConstants.COMMENT_NODE ||
      node.type === NodeConstants.TEXT_NODE ||
      (typeof node.value === "string" && reIsEmptyValue.exec(node.value!))
    ) {
      renderedComponent = <TextNode type={node.type} value={node.value} />;
    } else {
      renderedComponent = (
        <ReadOnlyNode
          displayName={node.displayName}
          isDocType={node.type === NodeConstants.DOCUMENT_TYPE_NODE}
          pseudoType={!!node.pseudoType}
        />
      );
    }

    renderedNodeContent = (
      <>
        <div
          className={"tag-line" + (isSelectedNode ? " selected" : "")}
          role="treeitem"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          ref={isScrollIntoViewNode ? scrollIntoView : null}
        >
          <span
            className={"tag-state" + (isSelectedNode ? " theme-selected" : "")}
            role="presentation"
          ></span>
          {showExpander ? (
            <span
              className={"theme-twisty expander" + (isExpanded ? " open" : "")}
              onClick={onExpanderToggle}
            ></span>
          ) : null}
          {renderedComponent}
        </div>
        {renderedChildren}
        {renderedClosingTag}
      </>
    );
  }

  return (
    <li
      data-testid="Inspector-Nodes-Node"
      className={classnames("child", {
        collapsed: !isExpanded,
        expandable: showExpander,
      })}
      role="presentation"
      onClick={onSelectNodeClick}
    >
      {renderedNodeContent}
    </li>
  );
}

export default React.memo(Node);
