import { SourceLocation } from "@replayio/protocol";
import { PropsWithChildren, useCallback } from "react";

import { PartialLocation, selectLocation } from "devtools/client/debugger/src/actions/sources";
import { getContext } from "devtools/client/debugger/src/selectors";
import { findClosestFunctionNameThunk } from "devtools/client/debugger/src/utils/ast";
import { SourcesContextRoot } from "replay-next/src/contexts/SourcesContext";
import {
  clearSelectedLocation,
  getPreferredGeneratedSources,
  getSelectedLocation,
} from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

// Relays information about the active source from Redux to the newer SourcesContext.
// This information is consumed, along with other state (like the hovered line number) by the PointsContext.
export default function SourcesContextWrapper({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const selectedLocation = useAppSelector(getSelectedLocation);
  const cx = useAppSelector(getContext);
  const preferredGeneratedSourceIds = useAppSelector(getPreferredGeneratedSources);

  const findClosestFunctionName = useCallback(
    (sourceId: string, location: SourceLocation) => {
      // Quirky but legal: use a thunk for a one-shot selection
      // without subscribing to the store directly
      return dispatch(findClosestFunctionNameThunk(sourceId, location));
    },
    [dispatch]
  );

  const selectLocationWrapper = useCallback(
    (location: PartialLocation | null) => {
      if (location === null) {
        if (selectedLocation !== null) {
          dispatch(clearSelectedLocation);
        }
      } else {
        if (
          selectedLocation?.sourceId !== location.sourceId ||
          selectedLocation.line !== location.line
        ) {
          dispatch(selectLocation(cx, location));
        }
      }
    },
    [cx, dispatch, selectedLocation]
  );

  return (
    <SourcesContextRoot
      findClosestFunctionName={findClosestFunctionName}
      selectLocation={selectLocationWrapper}
      preferredGeneratedSourceIds={preferredGeneratedSourceIds}
    >
      {children}
    </SourcesContextRoot>
  );
}
