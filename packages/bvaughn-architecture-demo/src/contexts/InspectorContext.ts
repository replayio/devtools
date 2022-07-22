import { MappedLocation, Object as ProtocolObject } from "@replayio/protocol";
import { createContext } from "react";

export type InspectorContextType = {
  inspectHTMLElement: (object: ProtocolObject) => void;
  inspectFunctionDefinition: (mappedLocation: MappedLocation) => void;
};

// This Context is used to connect the legacy app's Source viewer and HTML Elements panel to the new Console.
// Once the new app has added Source Viewer and HTML Elements, we may change the way this context works.
export const InspectorContext = createContext<InspectorContextType>({
  inspectHTMLElement: (object: ProtocolObject) => {
    alert("HTML Element viewer is not implemented yet");
  },
  inspectFunctionDefinition: (mappedLocation: MappedLocation) => {
    alert("Source viewer is not implemented yet");
  },
});
