import { ObjectId, PauseId } from "@replayio/protocol";
import { createCache } from "suspense";

import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { pauseEvaluationsCache } from "replay-next/src/suspense/PauseCache";
import { findProtocolObjectPropertyValue } from "replay-next/src/utils/protocol";
import { ReplayClientInterface } from "shared/client/types";

declare var __RECORD_REPLAY__: {
  getObjectFromProtocolId?: (id: string | number) => any;
};

declare var __RECORD_REPLAY_ARGUMENTS__: {
  getPersistentId?: (value: any) => number | null | void;
};

// TODO [FE-2005][FE-2067] With persistent DOM ids, we could switch this cache from PauseId to execution point.

export type Data = [fiberId: number | null, displayName: string | null];

export const domReactCache = createCache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, domNodeId: ObjectId],
  Data
>({
  config: { immutable: true },
  debugLabel: "DOMReactCache",
  getKey: ([replayClient, pauseId, domNodeId]) => `${pauseId}:${domNodeId}`,
  load: async ([replayClient, pauseId, domNodeId]) => {
    const expression = `
      {
        const [id, displayName] = (${getReactInfo.toString()})(${domNodeId});
        JSON.stringify([id, displayName]);
      }
    `;

    const result = await pauseEvaluationsCache.readAsync(replayClient, pauseId, null, expression);
    const value = result?.returned?.value;
    if (value) {
      return JSON.parse(value) as Data;
    }

    // This routine should always return a string value;
    // if it returns an Object then that is likely an Error.
    if (result.returned?.object) {
      const errorObject = await objectCache.readAsync(
        replayClient,
        pauseId,
        result.returned?.object,
        "full"
      );
      const message = findProtocolObjectPropertyValue<string>(errorObject, "message");
      if (message) {
        console.error(message);
      }
    }

    return [null, null];
  },
});

function getReactInfo(domNodeId: ObjectId): Data {
  if (
    typeof __RECORD_REPLAY__ !== "undefined" &&
    __RECORD_REPLAY__ != null &&
    __RECORD_REPLAY__.getObjectFromProtocolId
  ) {
    const domNode = __RECORD_REPLAY__.getObjectFromProtocolId(domNodeId);

    for (let name in domNode) {
      // HACK
      // Although a lot of tooling uses this attribute, it's not meant to be a public API.
      // We already have a better DOM-node-to-Fiber-id mapping (coming from React DevTools)
      // but it might not have been instantiated yet and it's in a place the Elements panel can't access.
      // This approach is a work around with limited perf impact, but it's pretty hacky.
      if (name.startsWith("__reactFiber$")) {
        const fiber = domNode[name];
        if (fiber) {
          // TRICKY
          // The Fiber directly associated with any host node (DOM element) will always be the host Fiber (e.g. <div/>)
          // When we display a rendered-by label, that should point to the "debug owner" (the class/function component that created the <div/>)
          // React only store "debug owner" information in DEV builds though.
          // We could fall back to the nearest user component for production builds,
          // but that would potentially be confusing/misleading so it's probably best to show nothing.
          const debugOwner = fiber._debugOwner;
          if (debugOwner) {
            if (
              typeof __RECORD_REPLAY_ARGUMENTS__ !== "undefined" &&
              __RECORD_REPLAY_ARGUMENTS__ != null &&
              __RECORD_REPLAY_ARGUMENTS__.getPersistentId
            ) {
              const id = __RECORD_REPLAY_ARGUMENTS__.getPersistentId(debugOwner);
              if (id) {
                const displayName = debugOwner.type.name ?? debugOwner.type.displayName ?? null;

                return [id, displayName];
              }
            }
          }
        }
      }
    }
  }

  return [null, null];
}
