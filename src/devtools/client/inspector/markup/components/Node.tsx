import classnames from "classnames";
import React, { ReactElement, useCallback, useContext } from "react";
import { shallowEqual } from "react-redux";
import { useImperativeCacheValue } from "suspense";

import { getPauseId } from "devtools/client/debugger/src/selectors";
import NodeConstants from "devtools/shared/dom-node-constants";
import { assert } from "protocol/utils";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { processedNodeDataCache } from "ui/suspense/nodeCaches";
import { canHighlightNode } from "ui/suspense/nodeCaches";

import { highlightNode, selectNode, toggleNodeExpanded, unhighlightNode } from "../actions/markup";
import {
  getIsNodeExpanded,
  getRootNodeId,
  getScrollIntoViewNodeId,
  getSelectedNodeId,
} from "../selectors/markup";
import ElementNode from "./ElementNode";
import ReadOnlyNode from "./ReadOnlyNode";
import TextNode from "./TextNode";

interface NodeProps {
  nodeId: string;
}

const reIsEmptyValue = /[^\s]/;

function Node({ nodeId }: NodeProps) {
  const dispatch = useAppDispatch();
  const replayClient = useContext(ReplayClientContext);

  // Do these as one big object, with a shallow comparison,
  // to minimize the number of Redux subscriptions
  const { rootNodeId, isSelectedNode, isScrollIntoViewNode, isExpanded, pauseId } = useAppSelector(
    state => ({
      rootNodeId: getRootNodeId(state),
      isSelectedNode: nodeId === getSelectedNodeId(state),
      isScrollIntoViewNode: nodeId === getScrollIntoViewNodeId(state),
      isExpanded: getIsNodeExpanded(state, nodeId),
      pauseId: getPauseId(state),
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
      // calling it with a little delay fixes it
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
  }, []);

  const { value: node, status: nodeStatus } = useImperativeCacheValue(
    processedNodeDataCache,
    replayClient,
    pauseId!,
    nodeId
  );

  if (nodeStatus === "rejected" || !node) {
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
    if (canHighlightNode(node)) {
      dispatch(highlightNode(nodeId));
    }
  };

  const onMouseLeave = () => {
    dispatch(unhighlightNode());
  };

  let renderedChildren: ReactElement | null = null;
  let renderedClosingTag: ReactElement | null = null;
  let renderedComponent: ReactElement | null = null;

  if (isExpanded && node.children.length) {
    renderedChildren = (
      <ul className="children" role={node.hasChildren ? "group" : ""}>
        {node.children.map(nodeId => (
          <Node key={nodeId} nodeId={nodeId} />
        ))}
      </ul>
    );
  }

  const { hasChildren, displayName } = node;
  const canExpand = hasChildren;
  const showExpander = canExpand && node.parentNodeId !== rootNodeId;

  if (canExpand) {
    renderedClosingTag = (
      <div className="tag-line" role="presentation">
        <div className="tag-state"></div>
        <span className="close">
          {"</"}
          <span className="tag theme-fg-color3">{displayName}</span>
          {">"}
        </span>
      </div>
    );
  }

  if (nodeStatus === "pending") {
    renderedComponent = <span>Loading…</span>;
  } else if (node.type === NodeConstants.ELEMENT_NODE) {
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
    </li>
  );
}

export default React.memo(Node);
