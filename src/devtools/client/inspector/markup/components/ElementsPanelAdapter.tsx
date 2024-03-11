import { ObjectId } from "@replayio/protocol";
import { useContext, useEffect, useRef, useState } from "react";

import { selectNode } from "devtools/client/inspector/markup/actions/markup";
import { getSelectedNodeId } from "devtools/client/inspector/markup/selectors/markup";
import NewElementsPanel from "replay-next/components/elements-new";
import OldElementsPanel from "replay-next/components/elements-old";
import { ImperativeHandle } from "replay-next/components/elements-old/ElementsList";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { recordingCapabilitiesCache } from "replay-next/src/suspense/BuildIdCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

export function ElementsPanelAdapter() {
  const { pauseId } = useMostRecentLoadedPause() ?? {};
  const selectedNodeIdFromRedux = useAppSelector(getSelectedNodeId);

  const dispatch = useAppDispatch();

  const [list, setList] = useState<ImperativeHandle | null>(null);

  const selectedNodeIdRef = useRef<ObjectId | null>(null);

  const replayClient = useContext(ReplayClientContext);
  const recordingCapabilities = recordingCapabilitiesCache.read(replayClient);
  const ElementsPanel = recordingCapabilities.supportsObjectIdLookupsInEvaluations
    ? NewElementsPanel
    : OldElementsPanel;

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
