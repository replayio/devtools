import React, { PureComponent } from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { Attr } from "@recordreplay/protocol";
import { NodeInfo } from "../state/markup";

const { truncateString } = require("devtools/shared/inspector/utils");
const { parseAttribute } = require("devtools/client/shared/node-attribute-parser");

const COLLAPSE_DATA_URL_REGEX = /^data.+base64/;
const COLLAPSE_DATA_URL_LENGTH = 60;

interface NodeAttributeProps {
  attribute: Attr;
  attributes: Attr[];
  node: NodeInfo;
}

class NodeAttribute extends PureComponent<NodeAttributeProps & PropsFromRedux> {
  /**
   * Truncates the given attribute value if it is a base65 data URL or the
   * collapse attributes pref is enabled.
   *
   * @param  {String} value
   *         Attribute value.
   * @return {String} truncated attribute value.
   */
  truncateValue(value: string) {
    if (value && value.match(COLLAPSE_DATA_URL_REGEX)) {
      return truncateString(value, COLLAPSE_DATA_URL_LENGTH);
    }

    const { collapseAttributes, collapseAttributeLength } = this.props;
    return collapseAttributes ? truncateString(value, collapseAttributeLength) : value;
  }

  render() {
    const { attribute, attributes, node } = this.props;
    // Parse the attribute value to detect whether there are linkable parts in it
    const parsedLinksData = parseAttribute(
      node.namespaceURI,
      node.tagName,
      attributes,
      attribute.name,
      attribute.value
    );
    const values = [];

    for (const token of parsedLinksData) {
      if (token.type === "string") {
        values.push(this.truncateValue(token.value));
      } else {
        values.push(
          <span key={token.value} className="link" data-link={token.value} data-type={token.type}>
            {this.truncateValue(token.value)}
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
}

const mapStateToProps = (state: UIState) => {
  return {
    collapseAttributes: state.markup.collapseAttributes,
    collapseAttributeLength: state.markup.collapseAttributeLength,
  };
};
const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(NodeAttribute);
