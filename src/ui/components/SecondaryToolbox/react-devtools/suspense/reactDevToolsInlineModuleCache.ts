import { PauseId } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { recordingTargetCache } from "replay-next/src/suspense/BuildIdCache";
import { evaluate } from "replay-next/src/utils/evaluate";
import { ReplayClientInterface } from "shared/client/types";
import { ReactDevToolsInlineModule } from "ui/components/SecondaryToolbox/react-devtools/types";
import { getJSON } from "ui/utils/objectFetching";

let cachedModule: ReactDevToolsInlineModule | null = null;

export const reactDevToolsInlineModuleCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId],
  ReactDevToolsInlineModule | null
> = createCache({
  debugLabel: "reactDevToolsInlineModuleCache",
  getKey: ([replayClient, pauseId]) => pauseId,
  load: ([replayClient, pauseId]) => {
    if (cachedModule != null) {
      // Return the cached value synchronously (without an async/Promise wrapper)
      // so we don't cause a temporary Suspense boundary to be shown
      return cachedModule;
    }

    return (async () => {
      // Default assume that it's a recent recording
      let backendBridgeProtocolVersion = 2;

      const recordingTarget = await recordingTargetCache.readAsync(replayClient);
      if (recordingTarget === "gecko") {
        // For Gecko recordings, introspect the page to determine what RDT version was used
        const response = await evaluate({
          replayClient,
          text: ` __RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__("getBridgeProtocol", undefined)`,
        });
        if (response.returned) {
          // Unwrap the nested eval objects by asking the backend for contents
          // of the nested fields: `{data: {version: 123}}`
          const result: any = await getJSON(replayClient, pauseId, response.returned);
          backendBridgeProtocolVersion = result?.data?.version ?? 2;
        }
      }

      // We should only load the DevTools module once we know which protocol version it requires.
      // If we don't have a version yet, it probably means we're too early in the Replay session.
      if (backendBridgeProtocolVersion === 1) {
        // We no longer support this protocol version
        throw Error("Unsupported protocol version");
      } else if (backendBridgeProtocolVersion >= 2) {
        cachedModule = await import("@replayio/react-devtools-inline/frontend");

        return cachedModule;
      } else {
        return null;
      }
    })();
  },
});
