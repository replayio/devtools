import {
  ExecutionPoint,
  MappedLocation,
  PauseId,
  Value as ProtocolValue,
} from "@replayio/protocol";
import React, { ReactNode, useCallback, useMemo } from "react";

import { selectNode } from "devtools/client/inspector/markup/actions/markup";
import { onViewSourceInDebugger } from "devtools/client/webconsole/actions";
import { ThreadFront } from "protocol/thread";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { setSelectedPanel, setSelectedPrimaryPanel } from "ui/actions/layout";
import { getSourceDetailsEntities } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

// Adapter that connects inspect-function and inspect-html-element actions with Redux.
export default function InspectorContextReduxAdapter({ children }: { children: ReactNode }) {
  const sourcesById = useAppSelector(getSourceDetailsEntities);
  const dispatch = useAppDispatch();

  const inspectFunctionDefinition = useCallback(
    (mappedLocation: MappedLocation) => {
      const location = mappedLocation.length > 0 ? mappedLocation[mappedLocation.length - 1] : null;
      if (location) {
        const url = sourcesById[location.sourceId]?.url;
        if (url) {
          dispatch(
            onViewSourceInDebugger({
              url,
              sourceId: location.sourceId,
              line: location.line,
              column: location.column,
            })
          );
        }
      }
    },
    [sourcesById, dispatch]
  );

  const showCommentsPanel = useCallback(() => {
    dispatch(setSelectedPrimaryPanel("comments"));
  }, [dispatch]);

  const inspectHTMLElement = useCallback(
    (protocolValue: ProtocolValue, pauseId: PauseId, point: ExecutionPoint, time: number) => {
      if (pauseId !== ThreadFront.currentPauseIdUnsafe) {
        ThreadFront.timeWarpToPause({ point, time, pauseId }, false);
      }
      dispatch(selectNode(protocolValue.object!));
      dispatch(setSelectedPanel("inspector"));
    },
    [dispatch]
  );

  const context = useMemo(
    () => ({ inspectFunctionDefinition, inspectHTMLElement, showCommentsPanel }),
    [inspectFunctionDefinition, inspectHTMLElement, showCommentsPanel]
  );

  return <InspectorContext.Provider value={context}>{children}</InspectorContext.Provider>;
}
