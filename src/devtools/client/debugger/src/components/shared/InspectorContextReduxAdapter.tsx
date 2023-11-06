import {
  ExecutionPoint,
  MappedLocation,
  PauseId,
  Value as ProtocolValue,
} from "@replayio/protocol";
import { ReactNode, useCallback, useMemo } from "react";

import { getPauseId } from "devtools/client/debugger/src/reducers/pause";
import { selectNode } from "devtools/client/inspector/markup/actions/markup";
import { onViewSourceInDebugger } from "devtools/client/webconsole/actions";
import { ThreadFront } from "protocol/thread";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import { setSelectedPanel, setSelectedPrimaryPanel, setViewMode } from "ui/actions/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

// Adapter that connects inspect-function and inspect-html-element actions with Redux.
export default function InspectorContextReduxAdapter({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const currentPauseId = useAppSelector(getPauseId);

  const [, setSidePanelCollapsed] = useGraphQLUserData("layout_sidePanelCollapsed");

  const inspectFunctionDefinition = useCallback(
    (mappedLocation: MappedLocation) => {
      const location = mappedLocation.length > 0 ? mappedLocation[mappedLocation.length - 1] : null;
      if (location) {
        const sourceId = location.sourceId;
        dispatch(
          onViewSourceInDebugger({
            column: location.column,
            line: location.line,
            openSource: true,
            sourceId,
          })
        );
      }
    },
    [dispatch]
  );

  const showCommentsPanel = useCallback(() => {
    dispatch(setSelectedPrimaryPanel("comments"));
    setSidePanelCollapsed(false);
  }, [dispatch, setSidePanelCollapsed]);

  const inspectHTMLElement = useCallback(
    (protocolValue: ProtocolValue, pauseId: PauseId, point: ExecutionPoint, time: number) => {
      if (pauseId !== currentPauseId) {
        ThreadFront.timeWarpToPause({ point, time, pauseId }, false);
      }
      dispatch(selectNode(protocolValue.object!));
      dispatch(setViewMode("dev"));
      dispatch(setSelectedPanel("inspector"));
    },
    [currentPauseId, dispatch]
  );

  const context = useMemo(
    () => ({ inspectFunctionDefinition, inspectHTMLElement, showCommentsPanel }),
    [inspectFunctionDefinition, inspectHTMLElement, showCommentsPanel]
  );

  return <InspectorContext.Provider value={context}>{children}</InspectorContext.Provider>;
}
