import { ObjectId } from "@replayio/protocol";
import { useEffect, useRef, useState } from "react";

import { selectNode } from "devtools/client/inspector/markup/actions/markup";
import { getSelectedNodeId } from "devtools/client/inspector/markup/selectors/markup";
import ElementsPanel from "replay-next/components/elements";
import { ImperativeHandle } from "replay-next/components/elements/ElementsList";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

export function ElementsPanelAdapter() {
  const { pauseId } = useMostRecentLoadedPause() ?? {};
  const selectedNodeIdFromRedux = useAppSelector(getSelectedNodeId);

  const dispatch = useAppDispatch();

  const [list, setList] = useState<ImperativeHandle | null>(null);

  const selectedNodeIdRef = useRef<ObjectId | null>(null);

  useEffect(() => {
    if (list) {
      if (selectedNodeIdFromRedux !== selectedNodeIdRef.current) {
        selectedNodeIdRef.current = selectedNodeIdFromRedux;

        list.selectNode(selectedNodeIdFromRedux);
      }
    }
  }, [list, selectedNodeIdFromRedux]);

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
      listRefSetter={setList}
      onSelectionChange={onSelectionChange}
      pauseId={pauseId ?? null}
    />
  );
}
