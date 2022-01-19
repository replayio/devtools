import React, { PureComponent, MouseEvent, ReactElement } from "react";
import { connect, ConnectedProps } from "react-redux";
const {
  COMMENT_NODE,
  DOCUMENT_TYPE_NODE,
  ELEMENT_NODE,
  TEXT_NODE,
} = require("devtools/shared/dom-node-constants");
import { assert } from "protocol/utils";
const { features } = require("devtools/client/inspector/prefs");
import {
  getNode,
  getRootNodeId,
  getSelectedNodeId,
  getScrollIntoViewNodeId,
} from "../selectors/markup";
import { UIState } from "ui/state";

import ElementNode from "./ElementNode";
import ReadOnlyNode from "./ReadOnlyNode";
import TextNode from "./TextNode";
import EventTooltip from "./EventTooltip";
import classnames from "classnames";

interface NodeProps {
  nodeId: string;
  onSelectNode: (nodeId: string) => void;
  onToggleNodeExpanded: (nodeId: string, isExpanded: boolean) => void;
  onMouseEnterNode: (nodeId: string) => void;
  onMouseLeaveNode: (nodeId: string) => void;
}

class _Node extends PureComponent<NodeProps & PropsFromRedux> {
  constructor(props: NodeProps & PropsFromRedux) {
    super(props);

    this.onExpanderToggle = this.onExpanderToggle.bind(this);
    this.onSelectNodeClick = this.onSelectNodeClick.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.scrollIntoView = this.scrollIntoView.bind(this);
  }

  onExpanderToggle(event: MouseEvent) {
    event.stopPropagation();
    const { node } = this.props;
    this.props.onToggleNodeExpanded(node.id, node.isExpanded);
  }

  onSelectNodeClick(event: MouseEvent) {
    event.stopPropagation();

    const { node, isSelectedNode } = this.props;

    // Don't reselect the same selected node.
    if (isSelectedNode) {
      return;
    }

    this.props.onSelectNode(node.id);
  }

  onMouseEnter() {
    this.props.onMouseEnterNode(this.props.node.id);
  }

  onMouseLeave() {
    this.props.onMouseLeaveNode(this.props.node.id);
  }

  scrollIntoView(el: HTMLElement | null) {
    if (!el) {
      return;
    }
    const { top, bottom } = el.getBoundingClientRect();
    const container = document.getElementById("markup-box");
    assert(container);
    const { top: containerTop, bottom: containerBottom } = container.getBoundingClientRect();
    if (top < containerTop || bottom > containerBottom) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  /**
   * Renders the children of the current node.
   */
  renderChildren(): ReactElement | null {
    const { node } = this.props;
    const children = node.children || [];

    if (node.isLoadingChildren) {
      return <span>Loading...</span>;
    }

    if (!children.length || node.isInlineTextChild) {
      return null;
    }

    return (
      <ul className="children" role={node.hasChildren ? "group" : ""}>
        {children.map(nodeId => (
          <Node
            key={nodeId}
            nodeId={nodeId}
            onSelectNode={this.props.onSelectNode}
            onToggleNodeExpanded={this.props.onToggleNodeExpanded}
            onMouseEnterNode={this.props.onMouseEnterNode}
            onMouseLeaveNode={this.props.onMouseLeaveNode}
          />
        ))}
      </ul>
    );
  }

  /**
   * Renders the closing tag of the current node.
   */
  renderClosingTag() {
    const { hasChildren, isInlineTextChild, displayName } = this.props.node;
    // Whether or not the node can be expander - True if node has children and child is
    // not an inline text node.
    const canExpand = hasChildren && !isInlineTextChild;

    if (!canExpand) {
      return null;
    }

    return (
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

  renderComponent() {
    const { node, onToggleNodeExpanded } = this.props;

    let component = null;
    if (node.type === ELEMENT_NODE) {
      component = <ElementNode node={node} onToggleNodeExpanded={onToggleNodeExpanded} />;
    } else if (node.type === COMMENT_NODE || node.type === TEXT_NODE) {
      component = <TextNode type={node.type} value={node.value} />;
    } else {
      component = (
        <ReadOnlyNode
          displayName={node.displayName}
          isDocType={node.type === DOCUMENT_TYPE_NODE}
          pseudoType={!!node.pseudoType}
        />
      );
    }

    return component;
  }

  renderEventBadge() {
    if (!this.props.node.hasEventListeners) {
      return null;
    }

    return <EventTooltip nodeId={this.props.node.id} />;
  }

  render() {
    const { node, rootNodeId, isSelectedNode, isScrollIntoViewNode } = this.props;

    const isWhitespaceTextNode = node.type === TEXT_NODE && !/[^\s]/.exec(node.value!);
    if (isWhitespaceTextNode && !features.showWhitespaceNodes) {
      return null;
    }

    // Whether or not the node can be expanded - True if node has children and child is
    // not an inline text node.
    const canExpand = node.hasChildren && !node.isInlineTextChild;
    // Whether or not to the show the expanded - True if node can expand and the parent
    // node is not the root node.
    const showExpander = canExpand && node.parentNodeId !== rootNodeId;

    return (
      <li
        className={classnames("child", {
          collapsed: !node.isExpanded || node.isInlineTextChild,
          "not-displayed": !node.isDisplayed,
          expandable: showExpander,
        })}
        role="presentation"
        onClick={this.onSelectNodeClick}
      >
        <div
          className={"tag-line" + (isSelectedNode ? " selected" : "")}
          role="treeitem"
          onMouseEnter={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}
          ref={isScrollIntoViewNode ? this.scrollIntoView : null}
        >
          <span
            className={"tag-state" + (isSelectedNode ? " theme-selected" : "")}
            role="presentation"
          ></span>
          {showExpander ? (
            <span
              className={"theme-twisty expander" + (node.isExpanded ? " open" : "")}
              onClick={this.onExpanderToggle}
            ></span>
          ) : null}
          {this.renderComponent()}
          {this.renderEventBadge()}
        </div>
        {this.renderChildren()}
        {this.renderClosingTag()}
      </li>
    );
  }
}

const mapStateToProps = (state: UIState, { nodeId }: NodeProps) => ({
  node: getNode(state, nodeId)!,
  rootNodeId: getRootNodeId(state),
  isSelectedNode: nodeId === getSelectedNodeId(state),
  isScrollIntoViewNode: nodeId === getScrollIntoViewNodeId(state),
});
const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;
const Node = connector(_Node);

export default Node;
