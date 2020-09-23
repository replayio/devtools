const { createFactory, PureComponent } = require("react");
const dom = require("react-dom-factories");
const PropTypes = require("prop-types");
const { connect } = require("react-redux");

const Node = createFactory(require("./Node"));

const Types = require("../types");

class MarkupApp extends PureComponent {
  static get propTypes() {
    return {
      markup: PropTypes.shape(Types.markup).isRequired,
      onSelectNode: PropTypes.func.isRequired,
      onToggleNodeExpanded: PropTypes.func.isRequired,
    };
  }

  renderTreeView() {
    const { markup } = this.props;
    const { rootNode, tree } = markup;

    if (!rootNode) {
      return null;
    }

    return dom.ul(
      {
        "aria-dropeffect": "none",
        role: "tree",
        tabIndex: 0,
      },
      tree[rootNode].children.map(nodeId => {
        return Node({
          key: nodeId,
          markup,
          node: tree[nodeId],
          onSelectNode: this.props.onSelectNode,
          onToggleNodeExpanded: this.props.onToggleNodeExpanded,
        });
      })
    );
  }

  render() {
    return dom.div(
      {
        id: "markup-box",
        className: "theme-body devtools-monospace",
      },
      dom.div(
        { id: "markup-root-wrapper", role: "presentation" },
        dom.div({ id: "markup-root", role: "presentation" }, this.renderTreeView())
      )
    );
  }
}

module.exports = connect(state => state)(MarkupApp);
