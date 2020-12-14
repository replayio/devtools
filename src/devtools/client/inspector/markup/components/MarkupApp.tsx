import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { getNode, getRootNodeId } from "../selectors/markup";

import Node from "./Node";
import { UIState } from "ui/state";

interface MarkupAppProps {
  onSelectNode: (nodeId: string) => void;
  onShowEventTooltip: (nodeId: string, element: EventTarget) => void;
  onToggleNodeExpanded: (nodeId: string, isExpanded: boolean) => void;
  onMouseEnterNode: (nodeId: string) => void;
  onMouseLeaveNode: (nodeId: string) => void;
}

function MarkupApp(props: MarkupAppProps & PropsFromRedux) {
  const { node } = props;
  if (!node) {
    return null;
  }

  return (
    <ul aria-dropeffect="none" role="tree" tabIndex={0}>
      {node.children.map(nodeId => (
        <Node
          key={nodeId}
          nodeId={nodeId}
          onSelectNode={props.onSelectNode}
          onShowEventTooltip={props.onShowEventTooltip}
          onToggleNodeExpanded={props.onToggleNodeExpanded}
          onMouseEnterNode={props.onMouseEnterNode}
          onMouseLeaveNode={props.onMouseLeaveNode}
        />
      ))}
    </ul>
  );
}

const mapStateToProps = (state: UIState) => ({
  node: getNode(state, getRootNodeId(state)),
});
const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(MarkupApp);
