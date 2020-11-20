import React, { PureComponent, MouseEvent } from "react";
import { NodeInfo } from "../state/markup";
import { Attr } from "record-replay-protocol";

import NodeAttribute from "./NodeAttribute";
import TextNode from "./TextNode";
import { assert } from "protocol/utils";

const { getStr } = require("../utils/l10n");
const { HTML_VOID_ELEMENTS } = require("../constants");

// Contains only valid computed display property types of the node to display in the
// element markup and their respective title tooltip text.
const DISPLAY_TYPES: { [key: string]: string | undefined } = {
  flex: getStr("markupView.display.flex.tooltiptext2"),
  "inline-flex": getStr("markupView.display.inlineFlex.tooltiptext2"),
  grid: getStr("markupView.display.grid.tooltiptext2"),
  "inline-grid": getStr("markupView.display.inlineGrid.tooltiptext2"),
  subgrid: getStr("markupView.display.subgrid.tooltiptiptext"),
  "flow-root": getStr("markupView.display.flowRoot.tooltiptext"),
  contents: getStr("markupView.display.contents.tooltiptext2"),
};

interface ElementNodeProps {
  node: NodeInfo;
  onShowEventTooltip: (nodeId: string, element: EventTarget) => void;
  onToggleNodeExpanded: (nodeId: string, isExpanded: boolean) => void;
}

class ElementNode extends PureComponent<ElementNodeProps> {
  constructor(props: ElementNodeProps) {
    super(props);

    this.onEventBadgeClick = this.onEventBadgeClick.bind(this);
    this.onExpandBadgeClick = this.onExpandBadgeClick.bind(this);
  }

  onEventBadgeClick(event: MouseEvent) {
    event.stopPropagation();
    this.props.onShowEventTooltip(this.props.node.id, event.target);
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

  renderEventBadge() {
    if (!this.props.node.hasEventListeners) {
      return null;
    }

    return (
      <div
        className="inspector-badge interactive"
        title={getStr("markupView.event.tooltiptext")}
        onClick={this.onEventBadgeClick}
      >
        event
      </div>
    );
  }

  renderDisplayBadge() {
    const { displayType } = this.props.node;
    assert(displayType);

    if (!(displayType in DISPLAY_TYPES)) {
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
        title={getStr("markupView.scrollableBadge.tooltip")}
      >
        {getStr("markupView.scrollableBadge.label")}
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
        {this.renderEventBadge()}
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
