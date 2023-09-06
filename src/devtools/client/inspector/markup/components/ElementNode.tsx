import { Attr } from "@replayio/protocol";
import React, { MouseEvent, useMemo } from "react";

import { useAppDispatch } from "ui/setup/hooks";

import { toggleNodeExpanded } from "../actions/markup";
import { NodeInfo } from "../reducers/markup";
import NodeAttribute from "./NodeAttribute";

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

function ElementNode({ node }: { node: NodeInfo }) {
  const dispatch = useAppDispatch();

  const onExpandBadgeClick = (event: MouseEvent) => {
    event.stopPropagation();
    dispatch(toggleNodeExpanded(node.id, false));
  };

  const { displayName } = node;

  const renderedAttributes = useMemo(() => {
    const sortedAttributes = node.attributes.slice().sort(compareAttributeNames);

    const renderedAttributes = (
      <span>
        {sortedAttributes.map(attribute => (
          <NodeAttribute
            key={`${node.id}-${attribute.name}`}
            attribute={attribute}
            attributes={node.attributes}
            node={node}
          />
        ))}
      </span>
    );
    return renderedAttributes;
  }, [node]);

  let renderedCloseTag: React.ReactNode = null;

  if (!HTML_VOID_ELEMENTS.includes(displayName)) {
    renderedCloseTag = (
      <span className="close">
        {"</"}
        <span className="tag theme-fg-color3">{displayName}</span>
        {">"}
      </span>
    );
  }

  const renderedOpenTag = (
    <span className="open">
      &lt;
      <span className="tag theme-fg-color3" tabIndex={-1}>
        {displayName}
      </span>
      {renderedAttributes}
      <span className="closing-bracket">&gt;</span>
    </span>
  );

  return (
    <span className="editor">
      {renderedOpenTag}
      <span className="markup-expand-badge" onClick={onExpandBadgeClick}></span>
      {renderedCloseTag}
    </span>
  );
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
