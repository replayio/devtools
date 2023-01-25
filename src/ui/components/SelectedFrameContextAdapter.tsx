import isEqual from "lodash/isEqual";
import { useContext, useEffect } from "react";

import {
  getPausePreviewLocation,
  getSelectedFrameId,
} from "devtools/client/debugger/src/selectors";
import { SelectedFrameContext } from "replay-next/src/contexts/SelectedFrameContext";
import { useAppSelector } from "ui/setup/hooks";

export default function SelectedFrameContextAdapter() {
  const selectedPauseAndFrameIdRedux = useAppSelector(getSelectedFrameId);
  const previewLocationRedux = useAppSelector(getPausePreviewLocation);
  const {
    selectedPauseAndFrameId,
    previewLocation,
    setSelectedPauseAndFrameId,
    setPreviewLocation,
  } = useContext(SelectedFrameContext);

  useEffect(() => {
    // We create a new pause-and-frame-id wrapper object each time we update,
    // so use deep comparison to avoid scheduling unnecessary/no-op state updates.
    if (!isEqual(selectedPauseAndFrameId, selectedPauseAndFrameIdRedux)) {
      setSelectedPauseAndFrameId(selectedPauseAndFrameIdRedux);
    }
    if (previewLocation !== previewLocationRedux) {
      setPreviewLocation(previewLocationRedux);
    }
  }, [
    selectedPauseAndFrameId,
    selectedPauseAndFrameIdRedux,
    previewLocation,
    previewLocationRedux,
    setSelectedPauseAndFrameId,
    setPreviewLocation,
  ]);

  return null;
}
