import React, { useRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { cancelBubbling, preventDefault } from "ui/utils/key-shortcuts";
import useKeyShortcuts from "ui/utils/use-key-shortcuts";

import {
  onDownKey,
  onLeftKey,
  onPageDownKey,
  onPageUpKey,
  onRightKey,
  onUpKey,
} from "../actions/markup";
import { getNode, getRootNodeId } from "../selectors/markup";

import { MarkupProps } from "./MarkupApp";
import Node from "./Node";

function Nodes(props: MarkupProps & PropsFromRedux) {
  const { node, onUpKey, onDownKey, onLeftKey, onRightKey, onPageUpKey, onPageDownKey } = props;

  const ref = useRef<HTMLUListElement>(null);
  function onLeftKeyEnsureFocus() {
    onLeftKey();
    // the focused element may have disappeared because its parent was collapsed,
    // ensure that the markup panel still has focus
    ref.current?.focus();
  }
  useKeyShortcuts(
    {
      Down: cancelBubbling(preventDefault(onDownKey)),
      Left: cancelBubbling(preventDefault(onLeftKeyEnsureFocus)),
      PageDown: cancelBubbling(preventDefault(onPageDownKey)),
      PageUp: cancelBubbling(preventDefault(onPageUpKey)),
      Right: cancelBubbling(preventDefault(onRightKey)),
      Up: cancelBubbling(preventDefault(onUpKey)),
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
  onDownKey,
  onLeftKey,
  onPageDownKey,
  onPageUpKey,
  onRightKey,
  onUpKey,
};
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Nodes);
