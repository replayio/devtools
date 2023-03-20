import React, { useRef } from "react";
import { ConnectedProps, connect } from "react-redux";

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
      Up: cancelBubbling(preventDefault(onUpKey)),
      Down: cancelBubbling(preventDefault(onDownKey)),
      Left: cancelBubbling(preventDefault(onLeftKeyEnsureFocus)),
      Right: cancelBubbling(preventDefault(onRightKey)),
      PageUp: cancelBubbling(preventDefault(onPageUpKey)),
      PageDown: cancelBubbling(preventDefault(onPageDownKey)),
    },
    ref
  );

  if (!node) {
    return null;
  }

  return (
    <ul aria-dropeffect="none" role="tree" tabIndex={0} ref={ref} data-testid="Inspector-Nodes">
      {node.children.map(nodeId => (
        <Node key={nodeId} nodeId={nodeId} />
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
