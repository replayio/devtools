const { createElement, createFactory, PureComponent } = require("react");
const dom = require("react-dom-factories");
const PropTypes = require("prop-types");
const {
  COMMENT_NODE,
  DOCUMENT_TYPE_NODE,
  ELEMENT_NODE,
  TEXT_NODE,
} = require("devtools/shared/dom-node-constants");

const ElementNode = createFactory(require("./ElementNode"));
const ReadOnlyNode = createFactory(require("./ReadOnlyNode"));
const TextNode = createFactory(require("./TextNode"));

const Types = require("../types");

class Node extends PureComponent {
  static get propTypes() {
    return {
      markup: PropTypes.shape(Types.markup).isRequired,
      node: PropTypes.shape(Types.node).isRequired,
      onSelectNode: PropTypes.func.isRequired,
      onShowEventTooltip: PropTypes.func.isRequired,
      onToggleNodeExpanded: PropTypes.func.isRequired,
    };
  }

  constructor(props) {
    super(props);

    this.onExpanderToggle = this.onExpanderToggle.bind(this);
    this.onSelectNodeClick = this.onSelectNodeClick.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
  }

  onExpanderToggle(event) {
    event.stopPropagation();
    const { node } = this.props;
    this.props.onToggleNodeExpanded(node.id, node.isExpanded);
  }

  onSelectNodeClick(event) {
    event.stopPropagation();

    const { markup, node } = this.props;

    // Don't reselect the same selected node.
    if (markup.selectedNode === node.id) {
      return;
    }

    this.props.onSelectNode(node.id);
  }

  onMouseEnter() {
    this.props.onMouseEnterNode(this.props.node.id);
  }

  onMouseLeave() {
    this.props.onMouseLeaveNode(this.props.node.id);
  }

  /**
   * Renders the children of the current node.
   */
  renderChildren() {
    const { markup, node } = this.props;
    const { tree } = markup;
    const children = tree[node.id].children || [];

    if (!children.length || node.isInlineTextChild) {
      return null;
    }

    return dom.ul(
      {
        className: "children",
        role: node.hasChildren ? "group" : "",
      },
      children.map(childId => {
        return createElement(Node, {
          key: childId,
          markup,
          node: tree[childId],
          onSelectNode: this.props.onSelectNode,
          onShowEventTooltip: this.props.onShowEventTooltip,
          onToggleNodeExpanded: this.props.onToggleNodeExpanded,
          onMouseEnterNode: this.props.onMouseEnterNode,
          onMouseLeaveNode: this.props.onMouseLeaveNode,
        });
      })
    );
  }

  /**
   * Renders the closing tag of the current node.
   */
  renderClosingTag() {
    const { hasChildren, isInlineTextChild, displayName } = this.props.node;
    // Whether or not the node can be expander - True if node has children and child is
    // not an inline text node.
    const canExpand = hasChildren && !isInlineTextChild;

    if (!canExpand) {
      return null;
    }

    return dom.div(
      { className: "tag-line", role: "presentation" },
      dom.div({ className: "tag-state" }),
      dom.span(
        { className: "close" },
        "</",
        dom.span({ className: "tag theme-fg-color3" }, displayName),
        ">"
      )
    );
  }

  renderComponent() {
    const { node, onShowEventTooltip, onToggleNodeExpanded } = this.props;

    let component = null;
    if (node.type === ELEMENT_NODE) {
      component = ElementNode({ node, onShowEventTooltip, onToggleNodeExpanded });
    } else if (node.type === COMMENT_NODE || node.type === TEXT_NODE) {
      component = TextNode({
        type: node.type,
        value: node.value,
      });
    } else {
      component = ReadOnlyNode({
        displayName: node.displayName,
        isDocType: node.type === DOCUMENT_TYPE_NODE,
        pseudoType: node.pseudoType,
      });
    }

    return component;
  }

  render() {
    const { markup, node } = this.props;
    const { rootNode, selectedNode } = markup;
    // Whether or not the node can be expanded - True if node has children and child is
    // not an inline text node.
    const canExpand = node.hasChildren && !node.isInlineTextChild;
    // Whether or not to the show the expanded - True if node can expand and the parent
    // node is not the root node.
    const showExpander = canExpand && node.parentNodeId !== rootNode;
    const isSelected = node.id === selectedNode;

    return dom.li(
      {
        className:
          "child" +
          (!node.isExpanded || node.isInlineTextChild ? " collapsed" : "") +
          (!node.isDisplayed ? " not-displayed" : "") +
          (showExpander ? " expandable" : ""),
        role: "presentation",
        onClick: this.onSelectNodeClick,
        onMouseEnter: this.onMouseEnter,
        onMouseLeave: this.onMouseLeave,
      },
      dom.div(
        {
          className: "tag-line" + (isSelected ? " selected" : ""),
          role: "treeitem",
        },
        dom.span({
          className: "tag-state" + (isSelected ? " theme-selected" : ""),
          role: "presentation",
        }),
        showExpander
          ? dom.span({
              className: "theme-twisty expander" + (node.isExpanded ? " open" : ""),
              onClick: this.onExpanderToggle,
            })
          : null,
        this.renderComponent()
      ),
      this.renderChildren(),
      this.renderClosingTag()
    );
  }
}

module.exports = Node;
