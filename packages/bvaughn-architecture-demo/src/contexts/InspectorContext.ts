import {
  ExecutionPoint,
  MappedLocation,
  PauseId,
  Value as ProtocolValue,
} from "@replayio/protocol";
import { createContext } from "react";

type InspectFunctionDefinition = (mappedLocation: MappedLocation) => void;

type InspectHTMLElement = (
  protocolValue: ProtocolValue,
  pauseId: PauseId,
  executionPoint: ExecutionPoint,
  time: number
) => void;

export type InspectorContextType = {
  inspectFunctionDefinition: InspectFunctionDefinition | null;
  inspectHTMLElement: InspectHTMLElement | null;
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
});
