import { NodeFront } from "protocol/thread/node";
import React, { FC } from "react";
import { SHADOW_ROOT_TAGNAME } from "../breadcrumbs";

type XHTMLNodeProps = {
  node: NodeFront;
};

export const XHTMLNode: FC<XHTMLNodeProps> = ({ node }) => {
  const tagText = `${node.isShadowRoot ? SHADOW_ROOT_TAGNAME : node.displayName}${
    node.pseudoType ? "::" + node.pseudoType : ""
  }`;

  const idText = node.id ? `#${node.id}` : "";

  const classesText = node.classList.length > 0 ? "." + node.classList.join(".") : "";

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
