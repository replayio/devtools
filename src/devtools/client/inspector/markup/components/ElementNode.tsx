import { Attr } from "@replayio/protocol";
import React, { MouseEvent, PureComponent } from "react";

import { NodeInfo } from "../reducers/markup";
import NodeAttribute from "./NodeAttribute";
import TextNode from "./TextNode";

// Contains only void (without end tag) HTML elements.
const HTML_VOID_ELEMENTS = [
  "area",
  "base",
  "br",
  "col",
  "command",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
];

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
    const attributes = node.attributes.slice().sort(compareAttributeNames);

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

  render() {
    return (
      <span className="editor">
        {this.renderOpenTag()}
        <span className="markup-expand-badge" onClick={this.onExpandBadgeClick}></span>
        {this.renderCloseTag()}
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
