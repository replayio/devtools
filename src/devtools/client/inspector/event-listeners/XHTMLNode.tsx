import React, { FC } from "react";

import { NodeWithPreview } from "ui/actions/eventListeners/eventListenerUtils";

type XHTMLNodeProps = {
  node: NodeWithPreview;
};

const getAttribute = (node: NodeWithPreview, name: string) => {
  const attr = node.preview.node.attributes?.find(a => a.name == name);
  return attr?.value;
};

// Show a stringified DOM node representation, like:
// button#someId.class1.class2
export const XHTMLNode: FC<XHTMLNodeProps> = ({ node }) => {
  const { nodeName, pseudoType, attributes } = node.preview.node;

  const id = getAttribute(node, "id");
  const className = getAttribute(node, "class") || "";
  const classList = className.split(" ").filter(Boolean);

  const tagText = `${nodeName.toLowerCase()}${pseudoType ? "::" + pseudoType : ""}`;
  const idText = id ? `#${id}` : "";
  // Add a preceding `.` if there are any classes, plus in-between each
  const classesText = [""].concat(classList).join(".");

  return (
    <span>
      <span className="theme-fg-color3">{tagText}</span>
      {idText && (
        <span
          style={{
            color: "var(--theme-highlight-purple)",
          }}
        >
          {idText}
        </span>
      )}
      {classesText && <span className="theme-fg-color3">{classesText}</span>}
    </span>
  );
};
