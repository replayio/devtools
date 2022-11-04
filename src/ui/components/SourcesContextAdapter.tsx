import { SourceLocation } from "@replayio/protocol";
import { PropsWithChildren, ReactNode, useCallback, useContext, useLayoutEffect } from "react";

import {
  SourcesContext,
  SourcesContextRoot,
} from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getShownSource } from "devtools/client/debugger/src/selectors";
import { findClosestFunctionNameThunk } from "devtools/client/debugger/src/utils/ast";
import { useFeature } from "ui/hooks/settings";
import { getSelectedLocation } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

// Relays information about the active source from Redux to the newer SourcesContext.
// This information is consumed, along with other state (like the hovered line number) by the PointsContext.
export default function SourcesContextWrapper({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();

  const findClosestFunctionName = useCallback(
    (sourceId: string, location: SourceLocation) => {
      // Quirky but legal: use a thunk for a one-shot selection
      // without subscribing to the store directly
      return dispatch(findClosestFunctionNameThunk(sourceId, location));
    },
    [dispatch]
  );

  return (
    <SourcesContextRoot findClosestFunctionName={findClosestFunctionName}>
      <SourcesContextAdapter>{children}</SourcesContextAdapter>
    </SourcesContextRoot>
  );
}

// This adapter keeps the newer Points components in-sync with the Redux state.
//
// TODO [source viewer]
// Once the new Source viewer is rolled out always-on, we should delete this adapter.
function SourcesContextAdapter({ children }: { children: ReactNode }) {
  const selectedLocation = useAppSelector(getSelectedLocation);
  const selectedLineNumber = selectedLocation?.line || null;
  const selectedSourceId = selectedLocation?.sourceId || null;

  const { value: enableNewSourceViewer } = useFeature("newSourceViewer");

  const { focusedSourceId, openSource } = useContext(SourcesContext);

  useLayoutEffect(() => {
    if (enableNewSourceViewer) {
      // The new Source viewer has its own context adapter, NewSourceAdapter.
      // This adapter can skip its update if the new Source viewer is enabled.
      return;
    }

    if (selectedSourceId !== null && selectedSourceId !== focusedSourceId) {
      // TRICKY
      // Legacy code passes 1-based line numbers around,
      // Except when a filed is opened (e.g. by clicking on the file tab) in which cases it passes 0.
      // We ignore the 0 because it breaks scroll state preservation between tabs.
      const lineNumber = selectedLineNumber !== null ? selectedLineNumber + 1 : undefined;

      openSource(selectedSourceId, lineNumber);
    }
  }, [enableNewSourceViewer, focusedSourceId, openSource, selectedLineNumber, selectedSourceId]);

  return children as any;
}
