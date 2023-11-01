import { Location, MappedLocation, Object as ProtocolObject } from "@replayio/protocol";

import { mappedLocationCache } from "replay-next/src/suspense/MappedLocationCache";
import { sourcesByUrlCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";
import { findProtocolObjectPropertyValue } from "ui/components/SecondaryToolbox/react-devtools/utils/findProtocolObjectPropertyValue";

// React DevTools (specifically react-debug-tools) returns locations as objects with the following shape:
// { fileName: string; lineNumber: number; columnNumber: number; }
//
// This method maps those locations to Replay preferred Locations that can be viewed in the Source viewer.
export function getReplayLocationFromReactDevToolsSourceSuspends(
  replayClient: ReplayClientInterface,
  sourceObject: ProtocolObject
): MappedLocation | null {
  const fileName = findProtocolObjectPropertyValue<string>(sourceObject, "fileName");
  if (fileName) {
    const sourcesByUrlMap = sourcesByUrlCache.read(replayClient);
    const sources = sourcesByUrlMap.get(fileName);
    if (sources) {
      const originalSource = sources.find(source => !source.generated.length);
      if (originalSource) {
        const sourceId = originalSource.sourceId;

        const column = findProtocolObjectPropertyValue<number>(sourceObject, "columnNumber");
        const line = findProtocolObjectPropertyValue<number>(sourceObject, "lineNumber");

        if (column != null && line != null) {
          const nonGeneratedLocation: Location = {
            sourceId,
            line,
            column,
          };

          const preferredLocation = mappedLocationCache.read(replayClient, nonGeneratedLocation);

          return preferredLocation;
        }
      }
    }
  }

  return null;
}
