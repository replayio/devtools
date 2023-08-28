import classnames from "classnames";
import React, { ReactElement, useCallback } from "react";
import { shallowEqual } from "react-redux";

import NodeConstants from "devtools/shared/dom-node-constants";
import { assert } from "protocol/utils";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { highlightNode, selectNode, toggleNodeExpanded, unhighlightNode } from "../actions/markup";
import {
  getIsNodeExpanded,
  getNode,
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

function Node({ nodeId }: NodeProps) {
  const dispatch = useAppDispatch();
  const { node, rootNodeId, isSelectedNode, isScrollIntoViewNode, isExpanded } = useAppSelector(
    state => ({
      node: getNode(state, nodeId)!,
      rootNodeId: getRootNodeId(state),
      isSelectedNode: nodeId === getSelectedNodeId(state),
      isScrollIntoViewNode: nodeId === getScrollIntoViewNodeId(state),
      isExpanded: getIsNodeExpanded(state, nodeId),
    }),
    shallowEqual
  );

  const onExpanderToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    dispatch(toggleNodeExpanded(node.id, isExpanded));
  };

  const onSelectNodeClick = (event: React.MouseEvent) => {
    event.stopPropagation();

    // Don't reselect the same selected node.
    if (isSelectedNode) {
      return;
    }

    dispatch(selectNode(node.id));
  };

  const onMouseEnter = () => {
    dispatch(highlightNode(node.id));
  };

  const onMouseLeave = () => {
    dispatch(unhighlightNode());
  };

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

  let renderedChildren: ReactElement | null = null;
  let renderedClosingTag: ReactElement | null = null;
  let renderedComponent: ReactElement | null = null;

  if (node.isLoadingChildren) {
    renderedChildren = <span>Loading…</span>;
  } else if (node.children?.length) {
    renderedChildren = (
      <ul className="children" role={node.hasChildren ? "group" : ""}>
        {node.children.map(nodeId => (
          <Node key={nodeId} nodeId={nodeId} />
        ))}
      </ul>
    );
  }

  // Whether or not the node can be expanded.
  // True if node has children and child is not an inline text node.
  const { hasChildren, displayName } = node;
  const canExpand = hasChildren;

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

  if (node.type === NodeConstants.ELEMENT_NODE) {
    renderedComponent = <ElementNode node={node} />;
  } else if (node.type === NodeConstants.COMMENT_NODE || node.type === NodeConstants.TEXT_NODE) {
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

  // Whether or not to the show the expander.
  // True if node can expand and the parent node is not the root node.
  const showExpander = canExpand && node.parentNodeId !== rootNodeId;

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
