const { createFactory, PureComponent } = require("react");
const dom = require("react-dom-factories");
const PropTypes = require("prop-types");

const NodeAttribute = createFactory(require("./NodeAttribute"));
const TextNode = createFactory(require("./TextNode"));

const { HTML_VOID_ELEMENTS } = require("../constants");
const Types = require("../types");

class ElementNode extends PureComponent {
  static get propTypes() {
    return {
      node: PropTypes.shape(Types.node).isRequired,
    };
  }

  renderAttributes() {
    const { node } = this.props;
    const attributes = node.attributes.sort(compareAttributeNames);

    return dom.span(
      {},
      attributes.map(attribute => {
        return NodeAttribute({
          key: `${node.id}-${attribute.name}`,
          attribute,
          attributes,
          node,
        });
      })
    );
  }

  renderCloseTag() {
    const { displayName } = this.props.node;

    if (HTML_VOID_ELEMENTS.includes(displayName)) {
      return null;
    }

    return dom.span(
      { className: "close" },
      "</",
      dom.span({ className: "tag theme-fg-color3" }, displayName),
      ">"
    );
  }

  renderInlineTextChild() {
    const { isInlineTextChild, value } = this.props.node;

    if (!isInlineTextChild) {
      return null;
    }

    return TextNode({
      isComment: false,
      value,
    });
  }

  renderOpenTag() {
    const { displayName } = this.props.node;

    return dom.span(
      { className: "open" },
      "<",
      dom.span({ className: "tag theme-fg-color3", tabIndex: -1 }, displayName),
      this.renderAttributes(),
      dom.span({ className: "closing-bracket" }, ">")
    );
  }

  render() {
    return dom.span(
      { className: "editor" },
      this.renderOpenTag(),
      this.renderInlineTextChild(),
      this.renderCloseTag()
    );
  }
}

/**
 * A compare function to be used when sorting the array of node attributes. This will
 * prioritize "id" and "class" attribute names being first and second of the array if the
 * attributes exist.
 */
function compareAttributeNames(a, b) {
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

module.exports = ElementNode;
