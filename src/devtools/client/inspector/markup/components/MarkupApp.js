const { createFactory, PureComponent } = require("react");
const dom = require("react-dom-factories");
const PropTypes = require("prop-types");
const { connect } = require("react-redux");

const { getNode, getRootNodeId } = require("../reducers/markup");

const Node = createFactory(require("./Node"));

const Types = require("../types");

class MarkupApp extends PureComponent {
  static get propTypes() {
    return {
      node: PropTypes.shape(Types.node).isRequired,
      onSelectNode: PropTypes.func.isRequired,
      onShowEventTooltip: PropTypes.func.isRequired,
      onToggleNodeExpanded: PropTypes.func.isRequired,
      onMouseEnterNode: PropTypes.func.isRequired,
      onMouseLeaveNode: PropTypes.func.isRequired,
    };
  }

  render() {
    const { node } = this.props;

    if (!node) {
      return null;
    }

    return dom.ul(
      {
        "aria-dropeffect": "none",
        role: "tree",
        tabIndex: 0,
      },
      node.children.map(nodeId => {
        return Node({
          key: nodeId,
          nodeId,
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

const mapStateToProps = state => ({
  node: getNode(state, getRootNodeId(state)),
});

module.exports = connect(mapStateToProps)(MarkupApp);
