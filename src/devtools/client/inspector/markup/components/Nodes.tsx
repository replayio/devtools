import React, { useRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { getNode, getRootNodeId } from "../selectors/markup";
import {
  onDownKey,
  onLeftKey,
  onPageDownKey,
  onPageUpKey,
  onRightKey,
  onUpKey,
} from "../actions/markup";
import useKeyShortcuts from "ui/utils/use-key-shortcuts";
import Node from "./Node";
import { MarkupProps } from "./MarkupApp";

function Nodes(props: MarkupProps & PropsFromRedux) {
  const { node, onUpKey, onDownKey, onLeftKey, onRightKey, onPageUpKey, onPageDownKey } = props;

  const ref = useRef<HTMLUListElement>(null);
  useKeyShortcuts(
    {
      Up: onUpKey,
      Down: onDownKey,
      Left: onLeftKey,
      Right: onRightKey,
      PageUp: onPageUpKey,
      PageDown: onPageDownKey,
    },
    ref
  );

  if (!node) {
    return null;
  }

  return (
    <ul aria-dropeffect="none" role="tree" tabIndex={0} ref={ref}>
      {node.children.map(nodeId => (
        <Node
          key={nodeId}
          nodeId={nodeId}
          onSelectNode={props.onSelectNode}
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
const mapDispatchToProps = {
  onUpKey,
  onDownKey,
  onLeftKey,
  onRightKey,
  onPageUpKey,
  onPageDownKey,
};
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Nodes);
