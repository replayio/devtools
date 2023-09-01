import mapValues from "lodash/mapValues";
import React, { useContext, useMemo, useRef } from "react";
import { useImperativeCacheValue } from "suspense";

import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { processedNodeDataCache } from "ui/suspense/nodeCaches";
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
import { getRootNodeId } from "../selectors/markup";
import { MarkupContext } from "./MarkupContext";
import Node from "./Node";

function Nodes() {
  const dispatch = useAppDispatch();
  const rootNodeId = useAppSelector(getRootNodeId);
  const replayClient = useContext(ReplayClientContext);
  const { pauseId } = useContext(MarkupContext);

  const boundKeyHandlers = useMemo(() => {
    const initialKeyHandlers = {
      Up: onUpKey,
      Down: onDownKey,
      Left: onLeftKey,
      Right: onRightKey,
      PageUp: onPageUpKey,
      PageDown: onPageDownKey,
    };
    const dispatchKeyHandlers = mapValues(initialKeyHandlers, handler => {
      return () => dispatch(handler());
    });
    const dispatchLeftKey = dispatchKeyHandlers.Left;

    function onLeftKeyEnsureFocus() {
      dispatchLeftKey();
      // the focused element may have disappeared because its parent was collapsed,
      // ensure that the markup panel still has focus
      ref.current?.focus();
    }

    dispatchKeyHandlers.Left = onLeftKeyEnsureFocus;

    const finalKeyHandlers = mapValues(initialKeyHandlers, handler => {
      return cancelBubbling(preventDefault(handler));
    });
    return finalKeyHandlers;
  }, [dispatch]);

  const ref = useRef<HTMLUListElement>(null);

  useKeyShortcuts(boundKeyHandlers, ref);

  const { status, value: node } = useImperativeCacheValue(
    processedNodeDataCache,
    replayClient,
    pauseId!,
    rootNodeId!
  );

  if (status !== "resolved" || !node) {
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

export default React.memo(Nodes);
