import { PauseId } from "@replayio/protocol";
import { createCache } from "suspense";

import { assert } from "protocol/utils";
import { Node } from "replay-next/components/elements-new/types";
import { deserializeDOM } from "replay-next/components/elements-new/utils/serialization";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { pauseEvaluationsCache } from "replay-next/src/suspense/PauseCache";
import { joinChunksToString } from "replay-next/src/utils/protocol";
import { ReplayClientInterface } from "shared/client/types";

// TODO [FE-2005][FE-2067] With persistent DOM ids, we could switch this cache from PauseId to execution point.

export type Data = Node;

let serializeDOMString: string | null = null;
let splitStringToChunksString: string | null = null;

export const domCache = createCache<
  [replayClient: ReplayClientInterface, pauseId: PauseId],
  Data | null
>({
  config: { immutable: true },
  debugLabel: "DOMCache",
  getKey: ([replayClient, pauseId]) => pauseId,
  load: async ([replayClient, pauseId]) => {
    if (serializeDOMString == null) {
      await lazyImportExpression();
    }

    const expression = `
        // Guard against minification renaming the functions
        const serializeDOM = ${serializeDOMString};
        const splitStringToChunks = ${splitStringToChunksString};

        const resultsArray = serializeDOM(document);
        const resultsString = JSON.stringify(resultsArray);

        splitStringToChunks(resultsString);
      `;

    const result = await pauseEvaluationsCache.readAsync(replayClient, pauseId, null, expression);

    const objectId = result.returned?.object;
    assert(objectId != null);

    const object = await objectCache.readAsync(replayClient, pauseId, objectId, "full");
    assert(object?.preview?.properties);

    const resultsString = joinChunksToString(object.preview.properties);
    const numericArray = JSON.parse(resultsString) as number[];

    return deserializeDOM(numericArray);
  },
});

async function lazyImportExpression() {
  const serializationModule = await import(
    "replay-next/components/elements-new/utils/serialization"
  );
  serializeDOMString = serializationModule.serializeDOM.toString();

  const protocolUtilsModule = await import("replay-next/src/utils/protocol");
  splitStringToChunksString = protocolUtilsModule.splitStringToChunks.toString();
}
