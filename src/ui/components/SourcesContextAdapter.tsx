import { SourceLocation } from "@replayio/protocol";
import {
  SourcesContext,
  SourcesContextRoot,
} from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getShownSource } from "devtools/client/debugger/src/selectors";
import { PropsWithChildren, ReactNode, useCallback, useContext, useLayoutEffect } from "react";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { findClosestFunctionNameThunk } from "devtools/client/debugger/src/utils/ast";

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

function SourcesContextAdapter({ children }: { children: ReactNode }) {
  const shownSource = useAppSelector(getShownSource);
  const shownSourceId = shownSource ? shownSource.id : null;

  const { focusedSourceId, openSource } = useContext(SourcesContext);

  useLayoutEffect(() => {
    if (shownSourceId !== null && shownSourceId !== focusedSourceId) {
      openSource(shownSourceId);
    }
  }, [focusedSourceId, openSource, shownSourceId]);

  return children as any;
}
