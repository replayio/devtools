import { Location, MappedLocation, Object as ProtocolObject } from "@replayio/protocol";
import { createCache } from "suspense";

import { mappedLocationCache } from "replay-next/src/suspense/MappedLocationCache";
import { sourcesByUrlCache } from "replay-next/src/suspense/SourcesCache";
import { findProtocolObjectPropertyValue } from "replay-next/src/utils/protocol";
import { ReplayClientInterface } from "shared/client/types";

// React DevTools (specifically react-debug-tools) returns locations as objects with the following shape:
// { fileName: string; lineNumber: number; columnNumber: number; }
//
// This method maps those locations to Replay's MappedLocations format (if possible) so it can be opened in the Source viewer
export const hookLocationCache = createCache<
  [replayClient: ReplayClientInterface, sourceObject: ProtocolObject],
  MappedLocation | null
>({
  config: { immutable: true },
  debugLabel: "hookLocationCache",
  getKey: ([_, sourceObject]) => {
    const fileName = findProtocolObjectPropertyValue<string>(sourceObject, "fileName");
    const column = findProtocolObjectPropertyValue<number>(sourceObject, "columnNumber");
    const line = findProtocolObjectPropertyValue<number>(sourceObject, "lineNumber");

    return `${fileName}:${line}:${column}`;
  },
  load: async ([replayClient, sourceObject]) => {
    const fileName = findProtocolObjectPropertyValue<string>(sourceObject, "fileName");
    const column = findProtocolObjectPropertyValue<number>(sourceObject, "columnNumber");
    const line = findProtocolObjectPropertyValue<number>(sourceObject, "lineNumber");

    if (fileName) {
      const sourcesByUrlMap = sourcesByUrlCache.read(replayClient);
      const sources = sourcesByUrlMap.get(fileName);
      if (sources) {
        const nonGeneratedSource = sources.find(source => !source.generated.length);
        if (nonGeneratedSource) {
          const sourceId = nonGeneratedSource.sourceId;

          if (column != null && line != null) {
            const nonGeneratedLocation: Location = {
              sourceId,
              line,
              column,
            };

            return await mappedLocationCache.readAsync(replayClient, nonGeneratedLocation);
          }
        }
      }
    }

    return null;
  },
});
