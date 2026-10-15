import { ObjectId, PauseId } from "@replayio/protocol";
import type { RendererInterface } from "react-devtools-inline";
import type { DevToolsHook } from "react-devtools-inline/backend";
import type { SerializedElement, Store } from "react-devtools-inline/frontend";
import { Cache, createCache, createExternallyManagedCache } from "suspense";

import { recordingCapabilitiesCache } from "replay-next/src/suspense/BuildIdCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { pauseEvaluationsCache } from "replay-next/src/suspense/PauseCache";
import { evaluate } from "replay-next/src/utils/evaluate";
import { ReplayClientInterface } from "shared/client/types";
import { ChunksArray, deserializeChunkedString } from "ui/utils/evalChunkedStrings";

// The renderer interface method we use, not included in `@types/react-devtools-inline`
type RendererInterfaceWithHostInstances = RendererInterface & {
  findHostInstancesForElementID: (id: number) => HTMLElement[] | null;
};

// Some internal values not currently included in `@types/react-devtools-inline`
type ElementWithChildren = SerializedElement & {
  children: number[];
};

export type StoreWithInternals = Store & {
  _idToElement: Map<number, ElementWithChildren>;
};

declare global {
  interface Window {
    __REACT_DEVTOOLS_SAVED_RENDERERS__: any[];
    evaluationLogs: string[];
    logMessage: (message: string) => void;
    __REACT_DEVTOOLS_STUB_FIBER_ROOTS: Record<string, Set<any>>;
    __RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__: (
      event: string,
      data: any
    ) => { event: string; data: any };

    __REACT_DEVTOOLS_GLOBAL_HOOK__: DevToolsHook;

    // Available in Chromium builds after 2023-09-16
    __RECORD_REPLAY__: {
      getProtocolIdForObject: (obj: unknown) => ObjectId;
      getObjectFromProtocolId: (id: ObjectId) => unknown;
    };
  }
}

function installReactDevToolsIntoPause() {
  // Create placeholders for our poor man's debug logging and the saved React tree operations
  window.evaluationLogs = [];
  window.logMessage = function (message) {
    window.evaluationLogs.push(message);
  };

  // Erase the stub global hook from Chromium
  // The RDT types say it's non-optional, so ignore the TS error
  // @ts-ignore
  delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  // Evaluate the RDT bundle (react-devtools-core's backend: the global hook, the
  // renderer and the agent), see `rdtBackendWithGlobals` below.
  const moduleShim: { exports: any } = { exports: {} };
  // @ts-ignore
  DEVTOOLS_PLACEHOLDER(moduleShim);
  const ReactDevToolsBackend = moduleShim.exports;

  // Install the hook with the default component filters, and attach an agent to
  // it over a bridge that goes nowhere: we call the agent directly, below.
  ReactDevToolsBackend.initialize();
  ReactDevToolsBackend.connectWithCustomMessagingProtocol({
    onSubscribe: () => {},
    onUnsubscribe: () => {},
    onMessage: () => {},
    isReloadAndProfileSupported: false,
    isProfiling: false,
  });
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  // The frontend can't exchange bridge messages with a paused recording. Instead it
  // evaluates a call to this function in the pause, which runs the agent's handler for
  // the request (e.g. `inspectElement`, `getBridgeProtocol`, `viewElementSource`) and
  // returns the message that the handler would have sent back over the bridge.
  window.__RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__ = (event: string, data: any) => {
    const agent: any = (hook as any).reactDevtoolsAgent;
    let response: any;
    agent._bridge = {
      send(responseEvent: string, responseData: any) {
        response = { event: responseEvent, data: responseData };
      },
    };
    try {
      agent[event](data);
    } catch (error: any) {
      window.logMessage(`Error executing bridge message '${event}': ${error}, ${error?.stack}`);
    }
    return response;
  };

  // Only Fiber renderers (React 16+) are supported. Inject them in the order Chromium's stub
  // saw them, like the backend routine does, so that renderer IDs match the operations.
  // The stub numbered all renderers in that order; map its IDs to the hook's.
  const rendererIDs = new Map<number, number>();
  window.__REACT_DEVTOOLS_SAVED_RENDERERS__.forEach((renderer, index) => {
    const isFiberRenderer =
      typeof renderer.getCurrentComponentInfo !== "function" &&
      (typeof renderer.findFiberByHostInstance === "function" ||
        renderer.currentDispatcherRef != null);
    if (isFiberRenderer) {
      window.logMessage("Injecting renderer");
      const rendererID = hook.inject(renderer);
      if (rendererID != null) {
        rendererIDs.set(index + 1, rendererID);
      }
    }
  });

  // The only time we have access to the React root objects is when `onCommitFiberRoot` gets
  // called. Our Chromium fork captures all those and saves them. A commit for each root makes
  // this fresh backend mount the current tree, so it knows the elements (by the same IDs as in
  // the operations: those come from Replay's persistent object IDs).
  const savedRoots = window.__REACT_DEVTOOLS_STUB_FIBER_ROOTS;
  for (const [stubRendererID, rendererRoots] of Object.entries(savedRoots)) {
    const rendererID = rendererIDs.get(Number(stubRendererID));
    if (rendererID === undefined) {
      continue;
    }
    for (const root of rendererRoots) {
      hook.onCommitFiberRoot(rendererID, root, 1);
    }
  }
}

const reactDevtoolsBackendSource = require("./react_devtools_backend.raw.js").default;

// Use function replacer syntax to avoid accidentally replacing special
// characters like `$&`, which could show up in the bundle source
// if the minifier renames things in an annoyingly specific way
// (such as `c === $ && x` becoming `c===$&&x`)
// The RDT bundle is a UMD bundle: let it export to us rather than to whatever module
// system the page uses. React DevTools persists some settings in Web Storage (behind
// try/catch), which must not be touched in a pause. Its bridge batches messages and sends
// them in a microtask: nothing listens to it here, but it must not keep queueing them
// either, so each batch is sent (to nowhere) right away. It reports exceptions thrown by
// its event listeners with `reportError()`, which would dispatch an error event on the
// page, and it reads resource timings and evaluates stylesheets' media queries, neither
// of which matters here. This is a string rather than a function so that these names
// can't be changed when this file is compiled.
const rdtBackendWithGlobals = `(function (module) {
  var exports = module.exports;
  var localStorage = undefined;
  var sessionStorage = undefined;
  var queueMicrotask = function (callback) {
    callback();
  };
  var reportError = function (error) {
    window.logMessage("Reported error: " + error);
  };
  var performance = {};
  var matchMedia = undefined;
  (${reactDevtoolsBackendSource})();
})`;

const rdtInjectionExpression = `(${installReactDevToolsIntoPause})()`.replace(
  "DEVTOOLS_PLACEHOLDER",
  () => rdtBackendWithGlobals
);

export const reactDevToolsInjectionCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId],
  boolean
> = createCache({
  config: { immutable: true },
  debugLabel: "PauseEvaluations",
  getKey: ([replayClient, pauseId]) => pauseId,
  load: async ([replayClient, pauseId]) => {
    const result = await pauseEvaluationsCache.readAsync(
      replayClient,
      pauseId,
      null,
      rdtInjectionExpression
    );
    if (result.exception != null) {
      return false;
    } else if (result.failed) {
      return false;
    } else {
      return true;
    }
  },
});

function collectElementIDs(
  store: StoreWithInternals,
  elementID: number,
  elementIDs: number[] = []
) {
  elementIDs.push(elementID);
  const element = store._idToElement.get(elementID);
  for (const childID of element!.children) {
    collectElementIDs(store, childID, elementIDs);
  }
  return elementIDs;
}

// Evaluated in the paused browser.
// Encapsulates the logic for finding the DOM nodes associated with each fiber ID.
// Returns a different structured result based on object ID lookup support.
function getComponentSpecificNodesToFiberIDs(
  rendererIdsToFiberIds: Record<number, number[]>,
  isObjectIdCapable: boolean
): Map<HTMLElement, number> | ChunksArray {
  // Modern: if we have object ID lookup in evals, save just the IDs
  // This only works with Chromium 2023-09-16+
  const nodeIdsToFiberIds: Record<string, number> = {};
  // Legacy: if we don't have object ID lookup in evals, save the full objects
  // This works with Firefox and older Chromium
  const domNodesToFiberIds = new Map<HTMLElement, number>();

  // Inline this so it's available in scope
  function splitStringIntoChunks(allChunks: ChunksArray, str: string) {
    // Split the stringified data into chunks
    const stringChunks: string[] = [];
    for (let i = 0; i < str.length; i += 9999) {
      stringChunks.push(str.slice(i, i + 9999));
    }

    // If there's more than one string chunk, save its size
    if (stringChunks.length > 1) {
      allChunks.push(stringChunks.length);
    }

    for (const chunk of stringChunks) {
      allChunks.push(chunk);
    }
    return stringChunks.length;
  }

  for (const [rendererId, rendererInterface] of window.__REACT_DEVTOOLS_GLOBAL_HOOK__
    .rendererInterfaces) {
    const fiberIdsForRenderer = rendererIdsToFiberIds[rendererId];
    if (!fiberIdsForRenderer) {
      continue;
    }

    const renderer = rendererInterface as RendererInterfaceWithHostInstances;
    for (const fiberId of fiberIdsForRenderer) {
      const nodes: HTMLElement[] = renderer.findHostInstancesForElementID(fiberId) ?? [];

      for (const node of nodes) {
        if (isObjectIdCapable) {
          const nodeId = window.__RECORD_REPLAY__.getProtocolIdForObject(node);
          nodeIdsToFiberIds[nodeId] = fiberId;
        } else {
          domNodesToFiberIds.set(node, fiberId);
        }
      }
    }
  }

  // Fast path: sending back just a stringified object mapping node IDs to fiber IDs
  // is much faster than sending back a bunch of objects (DOM node previews are expensive!)
  if (isObjectIdCapable) {
    const stringContents = JSON.stringify(nodeIdsToFiberIds);
    const chunksArray: ChunksArray = [];
    splitStringIntoChunks(chunksArray, stringContents);

    // Return the split-up string, so it can be reassembled in the browser and parsed as JSON
    return chunksArray;
  } else {
    // Slow path: send back the full objects, which requires the protocol to preview them
    return domNodesToFiberIds;
  }
}

const rendererIdsToFiberIdsCache = createExternallyManagedCache<
  [pauseId: string],
  Record<number, number[]>
>({
  debugLabel: "rendererIdsToFiberIdsCache",
  getKey: ([pauseId]) => pauseId,
});

export function cacheRendererIdsToFiberIds(pauseId: string, store: StoreWithInternals) {
  const rendererIdsToFiberIds: Record<number, number[]> = {};

  // Figure out all of the current fiber IDs we expect exist at this point in time
  for (const rootID of store.roots) {
    const rendererId = store.rootIDToRendererID.get(rootID)!;
    const elementIDs = collectElementIDs(store, rootID);

    if (!(rendererId in rendererIdsToFiberIds)) {
      rendererIdsToFiberIds[rendererId] = [];
    }
    rendererIdsToFiberIds[rendererId].push(...elementIDs);
  }

  rendererIdsToFiberIdsCache.cacheValue(rendererIdsToFiberIds, pauseId);
}

export const nodesToFiberIdsCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: string],
  [Map<ObjectId, number>, Map<number, ObjectId[]>]
> = createCache({
  debugLabel: "nodesToFiberIdsCache",
  getKey: ([replayClient, pauseId]) => pauseId,
  async load([replayClient, pauseId]) {
    const nodeIdsToFiberIds = new Map<ObjectId, number>();

    const rendererIdsToFiberIds = await rendererIdsToFiberIdsCache.readAsync(pauseId);

    const recordingCapabilities = recordingCapabilitiesCache.getValueIfCached(replayClient)!;

    const nodeIdsExpression = `
      // Pass in the fiber IDs and the capabilities flag
      (${getComponentSpecificNodesToFiberIDs})(
        ${JSON.stringify(rendererIdsToFiberIds)},
        ${recordingCapabilities.supportsObjectIdLookupsInEvaluations}
      )
    `;

    const response = await evaluate({
      replayClient: replayClient,
      pauseId,
      text: nodeIdsExpression,
    });

    if (response.returned?.object) {
      const evalResultPreview = await objectCache.readAsync(
        replayClient,
        pauseId,
        response.returned.object,
        "canOverflow"
      );

      if (recordingCapabilities.supportsObjectIdLookupsInEvaluations) {
        // Should have returned an array containing a chunked `JSON.stringify()` string
        const properties = evalResultPreview.preview?.properties ?? [];
        if (properties.length) {
          const fullString = deserializeChunkedString(properties.slice());
          const nodeIdsToFiberIdsRecord = JSON.parse(fullString) as Record<string, number>;
          for (const [nodeId, fiberId] of Object.entries(nodeIdsToFiberIdsRecord)) {
            nodeIdsToFiberIds.set(nodeId, fiberId);
          }
        }
      } else {
        // Should have returned a `Map<HTMLElement, number>`
        evalResultPreview.preview?.containerEntries?.forEach(entry => {
          // The backend should have returned numeric node IDs as values.
          // The keys are DOM node objects. We don't need to fetch them,
          // because all we care about here is the object IDs anyway.
          if (typeof entry.key?.object === "string" && typeof entry.value.value === "number") {
            nodeIdsToFiberIds.set(entry.key.object, entry.value.value);
          }
        });
      }
    }

    // Invert the lookup - there's some cases where we want to go from fiberId to nodeId,
    // so let's cache that too
    const fiberIdsToNodeIds = new Map<number, ObjectId[]>();
    for (const [nodeId, fiberId] of nodeIdsToFiberIds) {
      if (!fiberIdsToNodeIds.has(fiberId)) {
        fiberIdsToNodeIds.set(fiberId, []);
      }
      fiberIdsToNodeIds.get(fiberId)!.push(nodeId);
    }

    return [nodeIdsToFiberIds, fiberIdsToNodeIds];
  },
});
