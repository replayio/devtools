const { PureComponent } = require("react");
const dom = require("react-dom-factories");
const PropTypes = require("prop-types");
const { connect } = require("react-redux");
const { truncateString } = require("devtools/shared/inspector/utils");
const { parseAttribute } = require("devtools/client/shared/node-attribute-parser");

const Types = require("../types");

const COLLAPSE_DATA_URL_REGEX = /^data.+base64/;
const COLLAPSE_DATA_URL_LENGTH = 60;

class NodeAttribute extends PureComponent {
  static get propTypes() {
    return {
      attribute: PropTypes.shape(Types.attribute).isRequired,
      attributes: PropTypes.arrayOf(PropTypes.shape(Types.attribute)).isRequired,
      collapseAttributeLength: PropTypes.number.isRequired,
      collapseAttributes: PropTypes.bool.isRequired,
      node: PropTypes.shape(Types.node).isRequired,
    };
  }

  /**
   * Truncates the given attribute value if it is a base65 data URL or the
   * collapse attributes pref is enabled.
   *
   * @param  {String} value
   *         Attribute value.
   * @return {String} truncated attribute value.
   */
  truncateValue(value) {
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
          dom.span(
            {
              key: token.value,
              className: "link",
              "data-link": token.value,
              "data-type": token.type,
            },
            this.truncateValue(token.value)
          )
        );
      }
    }

    return dom.span(
      {
        className: "attreditor",
        "data-attr": attribute.name,
        "data-value": attribute.value,
      },
      " ",
      dom.span(
        { className: "editable", tabIndex: 0 },
        dom.span({ className: "attr-name theme-fg-color1" }, attribute.name),
        '="',
        dom.span({ className: "attr-value theme-fg-color2" }, values),
        '"'
      )
    );
  }
}

const mapStateToProps = state => {
  return {
    collapseAttributes: state.markup.collapseAttributes,
    collapseAttributeLength: state.markup.collapseAttributeLength,
  };
};

module.exports = connect(mapStateToProps)(NodeAttribute);
