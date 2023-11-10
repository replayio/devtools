import { ObjectId } from "@replayio/protocol";
import { useEffect, useRef } from "react";

import { selectNode } from "devtools/client/inspector/markup/actions/markup";
import { getSelectedNodeId } from "devtools/client/inspector/markup/selectors/markup";
import ElementsPanel from "replay-next/components/elements";
import { ImperativeHandle } from "replay-next/components/elements/ElementsList";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

export function ElementsPanelAdapter() {
  const { pauseId } = useMostRecentLoadedPause() ?? {};
  const selectedNodeId = useAppSelector(getSelectedNodeId);

  const dispatch = useAppDispatch();

  const listRef = useRef<ImperativeHandle>(null);
  const selectedNodeIdRef = useRef<ObjectId | null>(null);

  useEffect(() => {
    if (selectedNodeId !== selectedNodeIdRef.current) {
      selectedNodeIdRef.current = selectedNodeId;

      const list = listRef.current;
      if (list) {
        list.selectNode(selectedNodeId);
      }
    }
  }, [selectedNodeId]);

  const onSelectionChange = (id: ObjectId | null) => {
    if (id !== selectedNodeIdRef.current) {
      selectedNodeIdRef.current = id;

      if (id) {
        dispatch(selectNode(id));
      }
    }
  };

  return (
    <ElementsPanel
      listRef={listRef}
      onSelectionChange={onSelectionChange}
      pauseId={pauseId ?? null}
    />
  );
}
