import { PauseId } from "@replayio/protocol";
import { FrontendBridge } from "@replayio/react-devtools-inline";
import { createCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";
import { reactDevToolsInjectionCache } from "ui/components/SecondaryToolbox/react-devtools/injectReactDevtoolsBackend";
import {
  ReplayWall,
  StoreWithInternals,
} from "ui/components/SecondaryToolbox/react-devtools/ReplayWall";
import { InspectedReactElement } from "ui/components/SecondaryToolbox/react-devtools/types";
import { createPromiseForRequest } from "ui/components/SecondaryToolbox/react-devtools/utils/createPromiseForRequest";

const TIMEOUT_DELAY = 30_000;

let uidCounter = 0;

type ErrorResponse = {
  errorType: string;
  id: number;
  message: string;
  responseID: number;
  stack: string;
  type: "error";
};

type FullDataResponse = {
  id: number;
  responseID: number;
  type: "full-data";
  value: InspectedReactElement;
};

type NotFoundResponse = {
  id: number;
  responseID: number;
  type: "not-found";
};

type Response = ErrorResponse | FullDataResponse | NotFoundResponse;

export const inspectedElementCache = createCache<
  [
    replayClient: ReplayClientInterface,
    bridge: FrontendBridge,
    store: StoreWithInternals,
    replayWall: ReplayWall,
    pauseId: PauseId,
    elementId: number
  ],
  InspectedReactElement | null
>({
  config: { immutable: true },
  debugLabel: "inspectedElementCache",
  getKey: ([replayClient, bridge, store, replayWall, pauseId, elementId]) =>
    `${pauseId}:${elementId}`,
  load: async ([replayClient, bridge, store, replayWall, pauseId, elementId]) => {
    const rendererID = store.getRendererIDForElement(elementId);
    const requestID = ++uidCounter;

    // Wait until the backend has been injected before sending a message through the wall/bridge
    await reactDevToolsInjectionCache.readAsync(replayClient, pauseId);

    const promise = createPromiseForRequest<Response>({
      bridge,
      eventType: "inspectedElement",
      requestID,
      timeoutDelay: TIMEOUT_DELAY,
      timeoutMessage: `Timed out while trying to inspect React element ${elementId}`,
    });

    replayWall.send("inspectElement", {
      forceFullData: true,
      id: elementId,
      path: null,
      rendererID,
      requestID,
    });

    const result = await promise;

    switch (result.type) {
      case "error":
        console.error(
          `React element ${elementId} threw an error while being inspected:\n\n${result.message}\n${result.stack}`
        );
        return null;
      case "full-data":
        return result.value;
      case "not-found":
        console.error(`React element ${elementId} could not be found`);
        return null;
    }
  },
});
