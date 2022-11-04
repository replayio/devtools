import isEqual from "lodash/isEqual";
import { useContext } from "react";

import { SelectedFrameContext } from "bvaughn-architecture-demo/src/contexts/SelectedFrameContext";
import { getSelectedFrameId } from "devtools/client/debugger/src/selectors";
import { useAppSelector } from "ui/setup/hooks";

export default function SelectedFrameContextAdapter() {
  const selectedPauseAndFrameIdRedux = useAppSelector(getSelectedFrameId);
  const { selectedPauseAndFrameId, setSelectedPauseAndFrameId } = useContext(SelectedFrameContext);

  // We create a new pause-and-frame-id wrapper object each time we update,
  // so use deep comparison to avoid scheduling unnecessary/no-op state updates.
  if (!isEqual(selectedPauseAndFrameId, selectedPauseAndFrameIdRedux)) {
    setSelectedPauseAndFrameId(selectedPauseAndFrameIdRedux);
  }
  return null;
}
