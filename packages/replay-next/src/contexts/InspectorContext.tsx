import {
  ExecutionPoint,
  MappedLocation,
  PauseId,
  Value as ProtocolValue,
} from "@replayio/protocol";
import { PropsWithChildren, createContext, useCallback, useContext, useMemo } from "react";

import { SourcesContext } from "./SourcesContext";

type InspectFunctionDefinition = (mappedLocation: MappedLocation) => void;

type ShowCommentsPanel = () => void;

type InspectHTMLElement = (
  protocolValue: ProtocolValue,
  pauseId: PauseId,
  executionPoint: ExecutionPoint,
  time: number
) => void;

export type InspectorContextType = {
  inspectFunctionDefinition: InspectFunctionDefinition | null;
  inspectHTMLElement: InspectHTMLElement | null;
  showCommentsPanel: ShowCommentsPanel | null;
};

// Certain inspectable values (like HTML Elements) require additional info regarding their location within the recording.
// This context provides that additional info without props drilling through the various KeyValue and Value renderers.
export type InspectableTimestampedPointContextType = {
  executionPoint: ExecutionPoint;
  time: number;
};

export const InspectableTimestampedPointContext =
  createContext<InspectableTimestampedPointContextType | null>(null);

// This Context is used to connect the legacy app's Source viewer and HTML Elements panel to the new Console.
// Once the new app has added Source Viewer and HTML Elements, we may change the way this context works.
export const InspectorContext = createContext<InspectorContextType>({
  inspectFunctionDefinition: null,
  inspectHTMLElement: null,
  showCommentsPanel: null,
});

export function InspectorContextRoot({
  children,
  showCommentsPanel,
  showSourcesPanel,
}: PropsWithChildren & {
  showCommentsPanel: () => void;
  showSourcesPanel: () => void;
}) {
  const { openSource } = useContext(SourcesContext);

  const inspectFunctionDefinition = useCallback<InspectFunctionDefinition>(
    (mappedLocation: MappedLocation) => {
      const location = mappedLocation.length > 0 ? mappedLocation[mappedLocation.length - 1] : null;
      if (location) {
        const lineIndex = location.line - 1;
        openSource(location.sourceId, lineIndex, lineIndex);
        showSourcesPanel();
      }
    },
    [openSource, showSourcesPanel]
  );

  const context = useMemo(
    () => ({ inspectFunctionDefinition, inspectHTMLElement: null, showCommentsPanel }),
    [inspectFunctionDefinition, showCommentsPanel]
  );

  return <InspectorContext.Provider value={context}>{children}</InspectorContext.Provider>;
}
