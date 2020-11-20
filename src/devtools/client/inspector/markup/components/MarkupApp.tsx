import React, { PureComponent } from "react";
import { connect, ConnectedProps } from "react-redux";

import { getNode, getRootNodeId } from "../reducers/markup";

import Node from "./Node";
import { UIState } from "ui/state";

interface MarkupAppProps {
  onSelectNode: (nodeId: string) => void;
  onShowEventTooltip: (nodeId: string, element: EventTarget) => void;
  onToggleNodeExpanded: (nodeId: string, isExpanded: boolean) => void;
  onMouseEnterNode: (nodeId: string) => void;
  onMouseLeaveNode: (nodeId: string) => void;
}

class MarkupApp extends PureComponent<MarkupAppProps & PropsFromRedux> {
  render() {
    const { node } = this.props;

    if (!node) {
      return null;
    }

    return (
      <ul aria-dropeffect="none" role="tree" tabIndex={0}>
        {node.children.map(nodeId => (
          <Node
            key={nodeId}
            nodeId={nodeId}
            onSelectNode={this.props.onSelectNode}
            onShowEventTooltip={this.props.onShowEventTooltip}
            onToggleNodeExpanded={this.props.onToggleNodeExpanded}
            onMouseEnterNode={this.props.onMouseEnterNode}
            onMouseLeaveNode={this.props.onMouseLeaveNode}
          />
        ))}
      </ul>
    );
  }
}

const mapStateToProps = (state: UIState) => ({
  node: getNode(state, getRootNodeId(state)),
});
const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(MarkupApp);
