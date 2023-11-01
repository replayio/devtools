import { Location, MappedLocation } from "@replayio/protocol";
import { createCache } from "suspense";

import { updateMappedLocation } from "replay-next/src/suspense/PauseCache";
import {
  sourcesByIdCache,
  streamingSourceContentsCache,
} from "replay-next/src/suspense/SourcesCache";
import { getPreferredLocation } from "replay-next/src/utils/sources";
import { ReplayClientInterface } from "shared/client/types";
import { locationToString } from "ui/actions/eventListeners/eventListenerUtils";

const MAX_LINE_LENGTH = 200;

export const hookNameCache = createCache<
  [
    replayClient: ReplayClientInterface,
    locationOrMappedLocation: Location | MappedLocation,
    fallbackName: string
  ],
  string | undefined
>({
  config: { immutable: true },
  debugLabel: "hookNameCache",
  getKey: ([_, locationOrMappedLocation, fallbackName]) => {
    let locationString: string;
    if (Array.isArray(locationOrMappedLocation)) {
      locationString = locationOrMappedLocation.map(locationToString).join(",");
    } else {
      locationString = locationToString(locationOrMappedLocation);
    }

    return `${locationString}:${fallbackName}`;
  },
  load: async ([replayClient, locationOrMappedLocation, fallbackName]) => {
    // If we already have a seemingly valid hook name,
    // use it and skip the source fetching and parsing logic below.
    if (fallbackName.startsWith("use")) {
      return fallbackName.substring(3);
    } else if (fallbackName.startsWith(".use")) {
      // Some libraries (like React Router) assign hook displayNames with the format ".useRouter"
      return fallbackName.substring(4);
    }

    let location: Location | undefined;
    if (Array.isArray(locationOrMappedLocation)) {
      const sourcesById = await sourcesByIdCache.readAsync(replayClient);

      updateMappedLocation(sourcesById, locationOrMappedLocation);
      location = getPreferredLocation(sourcesById, [], locationOrMappedLocation);
    } else {
      location = locationOrMappedLocation;
    }

    const { value: sourceContent } = await streamingSourceContentsCache.readAsync(
      replayClient,
      location.sourceId
    );
    if (!sourceContent) {
      return fallbackName;
    }

    let lineIndex = location.line - 1;
    let columnIndex = location.column;

    // We could probably write a more efficient version of this that doesn't split the string if needed.
    const sourceLines = sourceContent.split("\n");
    const sourceLine = sourceLines[lineIndex];

    let possibleHookName = "";
    forLoop: for (
      let characterIndex = columnIndex;
      characterIndex < sourceLine.length;
      characterIndex++
    ) {
      const char = sourceLine.charAt(characterIndex);

      switch (char) {
        case "(": {
          // We've reached the end of the hook name, e.g. useCustomHook[(]
          if (possibleHookName) {
            return possibleHookName.substring(3);
          } else {
            break forLoop;
          }
        }
        case ".": {
          // We're dealing with a scoped format, e.g. "hooks.useGetNonPendingWorkspaces();"
          // Reset the possible hook name and continue.
          possibleHookName = "";
          break;
        }
        default: {
          if (char.match(/[a-zA-Z]/)) {
            possibleHookName += char;
          } else {
            break forLoop;
          }
          break;
        }
      }
    }

    // Our column alignment may have been off
    // In some cases we can still infer the hook name by looking at the source code on the line
    // We should avoid trying this unless the line is short and only contains one hook-like function call
    if (sourceLine.length <= MAX_LINE_LENGTH) {
      const match = sourceLine.match(/use([A-Z][a-z]*)+/g);
      if (match && match.length === 1) {
        const hookName = match[0];
        return hookName.substring(3);
      }
    }
  },
});
