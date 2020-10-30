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
      onShowEventTooltip: PropTypes.func.isRequired,
      onToggleNodeExpanded: PropTypes.func.isRequired,
    };
  }

  render() {
    const { markup } = this.props;
    const { rootNode, tree } = markup;

    if (!rootNode || !tree[rootNode]) {
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
          onShowEventTooltip: this.props.onShowEventTooltip,
          onToggleNodeExpanded: this.props.onToggleNodeExpanded,
          onMouseEnterNode: this.props.onMouseEnterNode,
          onMouseLeaveNode: this.props.onMouseLeaveNode,
        });
      })
    );
  }
}

module.exports = connect(state => state)(MarkupApp);
