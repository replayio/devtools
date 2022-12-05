import { SourceLocation } from "@replayio/protocol";
import { PropsWithChildren, useCallback } from "react";

import { SourcesContextRoot } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { PartialLocation } from "devtools/client/debugger/src/actions/sources";
import { findClosestFunctionNameThunk } from "devtools/client/debugger/src/utils/ast";
import { clearSelectedLocation, locationSelected } from "ui/reducers/sources";
import { useAppDispatch } from "ui/setup/hooks";

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

  const selectLocation = useCallback(
    (location: PartialLocation | null) => {
      if (location === null) {
        dispatch(clearSelectedLocation);
      } else {
        dispatch(locationSelected({ location }));
      }
    },
    [dispatch]
  );

  return (
    <SourcesContextRoot
      findClosestFunctionName={findClosestFunctionName}
      selectLocation={selectLocation}
    >
      {children}
    </SourcesContextRoot>
  );
}
