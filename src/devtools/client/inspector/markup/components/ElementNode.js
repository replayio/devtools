const { createFactory, PureComponent } = require("react");
const dom = require("react-dom-factories");
const PropTypes = require("prop-types");

const NodeAttribute = createFactory(require("./NodeAttribute"));
const TextNode = createFactory(require("./TextNode"));

const { getStr } = require("../utils/l10n");
const { HTML_VOID_ELEMENTS } = require("../constants");
const Types = require("../types");

// Contains only valid computed display property types of the node to display in the
// element markup and their respective title tooltip text.
const DISPLAY_TYPES = {
  flex: getStr("markupView.display.flex.tooltiptext2"),
  "inline-flex": getStr("markupView.display.inlineFlex.tooltiptext2"),
  grid: getStr("markupView.display.grid.tooltiptext2"),
  "inline-grid": getStr("markupView.display.inlineGrid.tooltiptext2"),
  subgrid: getStr("markupView.display.subgrid.tooltiptiptext"),
  "flow-root": getStr("markupView.display.flowRoot.tooltiptext"),
  contents: getStr("markupView.display.contents.tooltiptext2"),
};

class ElementNode extends PureComponent {
  static get propTypes() {
    return {
      node: PropTypes.shape(Types.node).isRequired,
      onToggleNodeExpanded: PropTypes.func.isRequired,
    };
  }

  constructor(props) {
    super(props);

    this.onExpandBadgeClick = this.onExpandBadgeClick.bind(this);
  }

  onExpandBadgeClick(event) {
    event.stopPropagation();
    this.props.onToggleNodeExpanded(this.props.node.id, false);
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

  renderEventBadge() {
    if (!this.props.node.hasEventListeners) {
      return null;
    }

    return dom.div(
      {
        className: "inspector-badge interactive",
        title: getStr("markupView.event.tooltiptext"),
      },
      "event"
    );
  }

  renderDisplayBadge() {
    const { displayType } = this.props.node;

    if (!(displayType in DISPLAY_TYPES)) {
      return null;
    }

    return dom.div(
      {
        className: "inspector-badge",
        title: DISPLAY_TYPES[displayType],
      },
      displayType
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

  renderScrollableBadge() {
    if (!this.props.node.isScrollable) {
      return null;
    }

    return dom.div(
      {
        className: "inspector-badge scrollable-badge",
        title: getStr("markupView.scrollableBadge.tooltip"),
      },
      getStr("markupView.scrollableBadge.label")
    );
  }

  render() {
    return dom.span(
      { className: "editor" },
      this.renderOpenTag(),
      dom.span({
        className: "markup-expand-badge",
        onClick: this.onExpandBadgeClick,
      }),
      this.renderInlineTextChild(),
      this.renderCloseTag(),
      this.renderEventBadge(),
      this.renderDisplayBadge(),
      this.renderScrollableBadge()
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
