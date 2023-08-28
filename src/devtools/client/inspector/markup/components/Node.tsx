import classnames from "classnames";
import React, { MouseEvent, PureComponent, ReactElement } from "react";
import { ConnectedProps, connect } from "react-redux";

import NodeConstants from "devtools/shared/dom-node-constants";
import { assert } from "protocol/utils";
import { UIState } from "ui/state";

import { setActiveTab } from "../../actions";
import {
  collapseNode,
  expandNode,
  highlightNode,
  selectNode,
  toggleNodeExpanded,
  unhighlightNode,
} from "../actions/markup";
import {
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

type FinalNodeProps = NodeProps & PropsFromRedux;

class _Node extends PureComponent<FinalNodeProps> {
  onExpanderToggle = (event: MouseEvent) => {
    event.stopPropagation();
    const { node } = this.props;

    this.props.toggleNodeExpanded(node.id, node.isExpanded);
  };

  onSelectNodeClick = (event: MouseEvent) => {
    event.stopPropagation();

    const { node, isSelectedNode } = this.props;

    // Don't reselect the same selected node.
    if (isSelectedNode) {
      return;
    }

    this.props.onSelectNode(node.id);
  };

  onMouseEnter = () => {
    this.props.highlightNode(this.props.node.id);
  };

  onMouseLeave = () => {
    this.props.unhighlightNode();
  };

  scrollIntoView = (el: HTMLElement | null) => {
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
  };

  /**
   * Renders the children of the current node.
   */
  renderChildren(): ReactElement | null {
    const { node } = this.props;
    const children = node.children || [];

    if (node.isLoadingChildren) {
      return <span>Loading…</span>;
    }

    if (!children.length) {
      return null;
    }

    return (
      <ul className="children" role={node.hasChildren ? "group" : ""}>
        {children.map(nodeId => (
          <Node key={nodeId} nodeId={nodeId} />
        ))}
      </ul>
    );
  }

  /**
   * Renders the closing tag of the current node.
   */
  renderClosingTag() {
    const { hasChildren, displayName } = this.props.node;
    // Whether or not the node can be expander - True if node has children and child is
    // not an inline text node.
    const canExpand = hasChildren;

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
    const { node } = this.props;

    let component = null;
    if (node.type === NodeConstants.ELEMENT_NODE) {
      component = <ElementNode node={node} onToggleNodeExpanded={this.props.toggleNodeExpanded} />;
    } else if (node.type === NodeConstants.COMMENT_NODE || node.type === NodeConstants.TEXT_NODE) {
      component = <TextNode type={node.type} value={node.value} />;
    } else {
      component = (
        <ReadOnlyNode
          displayName={node.displayName}
          isDocType={node.type === NodeConstants.DOCUMENT_TYPE_NODE}
          pseudoType={!!node.pseudoType}
        />
      );
    }

    return component;
  }

  render() {
    const { node, rootNodeId, isSelectedNode, isScrollIntoViewNode } = this.props;

    // Whether or not the node can be expanded - True if node has children and child is
    // not an inline text node.
    const canExpand = node.hasChildren;
    // Whether or not to the show the expanded - True if node can expand and the parent
    // node is not the root node.
    const showExpander = canExpand && node.parentNodeId !== rootNodeId;

    return (
      <li
        data-testid="Inspector-Nodes-Node"
        className={classnames("child", {
          collapsed: !node.isExpanded,
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
const connector = connect(mapStateToProps, {
  setActiveTab,
  onSelectNode: selectNode,
  expandNode,
  collapseNode,
  highlightNode,
  unhighlightNode,
  toggleNodeExpanded,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
const Node = connector(_Node);

export default Node;
