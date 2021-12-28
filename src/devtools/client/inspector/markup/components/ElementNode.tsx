import React, { PureComponent, MouseEvent } from "react";
import { NodeInfo } from "../state/markup";
import { Attr } from "@recordreplay/protocol";

import NodeAttribute from "./NodeAttribute";
import TextNode from "./TextNode";

const { HTML_VOID_ELEMENTS } = require("../constants");

// Contains only valid computed display property types of the node to display in the
// element markup and their respective title tooltip text.
const DISPLAY_TYPES: { [key: string]: string | undefined } = {
  flex: "This element behaves like a block element and lays out its content according to the flexbox model. Click to toggle the flexbox overlay for this element.",
  "inline-flex":
    "This element behaves like an inline element and lays out its content according to the flexbox model. Click to toggle the flexbox overlay for this element.",
  grid: "This element behaves like a block element and lays out its content according to the grid model. Click to toggle the grid overlay for this element.",
  "inline-grid":
    "This element behaves like an inline element and lays out its content according to the grid model. Click to toggle the grid overlay for this element.",
  subgrid:
    "This element lays out its content according to the grid model but defers the definition of its rows and/or columns to its parent grid container.",
  "flow-root":
    "This element generates a block element box that establishes a new block formatting context.",
  contents: "This element doesn’t produce a specific box by itself, but renders its contents.",
};

interface ElementNodeProps {
  node: NodeInfo;
  onToggleNodeExpanded: (nodeId: string, isExpanded: boolean) => void;
}

class ElementNode extends PureComponent<ElementNodeProps> {
  constructor(props: ElementNodeProps) {
    super(props);

    this.onExpandBadgeClick = this.onExpandBadgeClick.bind(this);
  }

  onExpandBadgeClick(event: MouseEvent) {
    event.stopPropagation();
    this.props.onToggleNodeExpanded(this.props.node.id, false);
  }

  renderAttributes() {
    const { node } = this.props;
    const attributes = node.attributes.sort(compareAttributeNames);

    return (
      <span>
        {attributes.map(attribute => (
          <NodeAttribute
            key={`${node.id}-${attribute.name}`}
            attribute={attribute}
            attributes={attributes}
            node={node}
          />
        ))}
      </span>
    );
  }

  renderCloseTag() {
    const { displayName } = this.props.node;

    if (HTML_VOID_ELEMENTS.includes(displayName)) {
      return null;
    }

    return (
      <span className="close">
        {"</"}
        <span className="tag theme-fg-color3">{displayName}</span>
        {">"}
      </span>
    );
  }

  renderDisplayBadge() {
    const { displayType } = this.props.node;

    if (!displayType || !(displayType in DISPLAY_TYPES)) {
      return null;
    }

    return (
      <div className="inspector-badge" title={DISPLAY_TYPES[displayType]}>
        {displayType}
      </div>
    );
  }

  renderInlineTextChild() {
    const { isInlineTextChild, value, type } = this.props.node;

    if (!isInlineTextChild) {
      return null;
    }

    return <TextNode type={type} value={value} />;
  }

  renderOpenTag() {
    const { displayName } = this.props.node;

    return (
      <span className="open">
        &lt;
        <span className="tag theme-fg-color3" tabIndex={-1}>
          {displayName}
        </span>
        {this.renderAttributes()}
        <span className="closing-bracket">&gt;</span>
      </span>
    );
  }

  renderScrollableBadge() {
    if (!this.props.node.isScrollable) {
      return null;
    }

    return (
      <div
        className="inspector-badge scrollable-badge"
        title="This element has scrollable overflow"
      >
        Scroll
      </div>
    );
  }

  render() {
    return (
      <span className="editor">
        {this.renderOpenTag()}
        <span className="markup-expand-badge" onClick={this.onExpandBadgeClick}></span>
        {this.renderInlineTextChild()}
        {this.renderCloseTag()}
        {this.renderDisplayBadge()}
        {this.renderScrollableBadge()}
      </span>
    );
  }
}

/**
 * A compare function to be used when sorting the array of node attributes. This will
 * prioritize "id" and "class" attribute names being first and second of the array if the
 * attributes exist.
 */
function compareAttributeNames(a: Attr, b: Attr) {
  const nameA = a.name.toLowerCase();
  const nameB = b.name.toLowerCase();

  if (nameA === "id" && nameB === "class") {
    return -1;
  } else if (nameA === "class" && nameB === "id") {
    return 1;
  } else if (nameA === "id" || nameA === "class") {
    return -1;
  } else if (nameB === "id" || nameB === "class") {
    return 1;
  }

  return 0;
}

export default ElementNode;
