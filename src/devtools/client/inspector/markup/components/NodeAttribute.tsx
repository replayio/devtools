import { Attr } from "@replayio/protocol";
import React, { useContext } from "react";

import { truncateString } from "devtools/shared/inspector/utils";
import { parseAttribute } from "third-party/node-attribute-parser";

import { NodeInfo } from "../reducers/markup";
import { MarkupContext } from "./MarkupContext";

const COLLAPSE_DATA_URL_REGEX = /^data.+base64/;
const COLLAPSE_DATA_URL_LENGTH = 60;

interface NodeAttributeProps {
  attribute: Attr;
  attributes: Attr[];
  node: NodeInfo;
}

/**
 * Truncates the given attribute value if it is a base65 data URL or the
 * collapse attributes pref is enabled.
 *
 * @param  {String} value
 *         Attribute value.
 * @return {String} truncated attribute value.
 */
function truncateValue(
  value: string,
  collapseAttributes: boolean,
  collapseAttributeLength: number
) {
  if (value && value.match(COLLAPSE_DATA_URL_REGEX)) {
    return truncateString(value, COLLAPSE_DATA_URL_LENGTH);
  }

  return collapseAttributes ? truncateString(value, collapseAttributeLength) : value;
}

function NodeAttribute({ attribute, attributes, node }: NodeAttributeProps) {
  const { collapseAttributes, collapseAttributeLength } = useContext(MarkupContext);

  // Parse the attribute value to detect whether there are linkable parts in it
  const parsedLinksData = parseAttribute(
    node.namespaceURI,
    node.tagName!,
    attributes,
    attribute.name,
    attribute.value
  );
  const values = [];

  for (const token of parsedLinksData) {
    if (token.type === "string") {
      values.push(truncateValue(token.value, collapseAttributes, collapseAttributeLength));
    } else {
      values.push(
        <span key={token.value} className="link" data-link={token.value} data-type={token.type}>
          {truncateValue(token.value, collapseAttributes, collapseAttributeLength)}
        </span>
      );
    }
  }

  return (
    <span className="attreditor" data-attr={attribute.name} data-value={attribute.value}>
      {" "}
      <span className="editable" tabIndex={0}>
        <span className="attr-name theme-fg-color1">{attribute.name}</span>
        {'="'}
        <span className="attr-value theme-fg-color2">{values}</span>
        {'"'}
      </span>
    </span>
  );
}

export default React.memo(NodeAttribute);
