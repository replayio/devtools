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
 * Truncates the given attribute value if it is a base65 data URL.
 *
 * @param  {String} value
 *         Attribute value.
 * @return {String} truncated attribute value.
 */
function truncateBase64Values(value: string) {
  if (value && value.match(COLLAPSE_DATA_URL_REGEX)) {
    return truncateString(value, COLLAPSE_DATA_URL_LENGTH);
  }

  return value;
}

function NodeAttribute({ attribute, attributes, node }: NodeAttributeProps) {
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
      values.push(truncateBase64Values(token.value));
    } else {
      values.push(
        <span key={token.value} className="link" data-link={token.value} data-type={token.type}>
          {truncateBase64Values(token.value)}
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
