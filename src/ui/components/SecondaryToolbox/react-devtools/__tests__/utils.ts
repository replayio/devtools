import type { Store } from "@replayio/react-devtools-inline";
import { createElement } from "react";
import { createRoot } from "react-dom/client";

import { deconstructOperationsArray, reconstructOperationsArray } from "../rdtProcessing";

export function assertContainsOperationType(operationsArrays: number[][], type: number) {
  for (let index = 0; index < operationsArrays.length; index++) {
    const operationsArray = operationsArrays[index];
    const operationsObject = deconstructOperationsArray(operationsArray);
    if (operationsObject.treeOperations.find(operation => operation.type === type)) {
      return;
    }
  }

  throw Error(`Type ${type} not contained in operations arrays`);
}

export function assertContainsOperationTypes(operationsArrays: number[][], types: number[]) {
  for (let index = 0; index < types.length; index++) {
    assertContainsOperationType(operationsArrays, types[index]);
  }
}

export function verifySerialization(operationsArrays: number[][]) {
  operationsArrays.forEach(operationsArray => {
    expect(operationsArray.length > 0).toBeTruthy();

    const deconstructed = deconstructOperationsArray(operationsArray);
    const reconstructed = reconstructOperationsArray(deconstructed);

    expect(reconstructed).toEqual(operationsArray);
  });
}

export type Destroy = () => void;
export type GetOperations = (callback: Function) => number[][];

export function reactDevToolsBeforeEach() {
  jest.spyOn(console, "error").mockImplementation(message => {
    if (typeof message === "string" && message.includes("act(() ")) {
      return;
    }
  });

  jest.useFakeTimers();

  // Stub global APIs required by react-devtools-inline (or its dependencies)
  window.URL.createObjectURL = jest.fn();
  window.URL.revokeObjectURL = jest.fn();
  window.Worker = class Worker {
    constructor() {}
    addEventListener() {}
    dispatchEvent() {
      return true;
    }
    onerror() {}
    onmessage() {}
    onmessageerror() {}
    postMessage() {}
    removeEventListener() {}
    terminate() {}
  };

  // Import modules once all necessary APIs have been mocked
  const {
    activate: activateBackend,
    createBridge: createBackendBridge,
    initialize: initializeBackend,
  } = require("@replayio/react-devtools-inline/backend");
  const {
    initialize: createDevTools,
    createBridge: createFrontendBridge,
    createStore,
  } = require("@replayio/react-devtools-inline/frontend");

  const listeners: Set<Function> = new Set();
  const wall = {
    listen(listener: Function) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    send(event: Object, payload: Object) {
      listeners.forEach(listener => listener({ event, payload }));
    },
  };

  // Installs the global hook on window;
  // note that we use a fake window object so we can clean up between tests
  // React DevTools uses Object.defineProperty() to install the hook as non-configurable
  const fakeWindow = {} as any;
  initializeBackend(fakeWindow);
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = fakeWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  const frontendBridge = createFrontendBridge(window, wall);
  const store = createStore(frontendBridge) as Store;

  // We don't care about the DevTools UI,
  // but rendering it is required to finalize the backend activation,
  // which itself holds up Store updates
  const DevTools = createDevTools(window, { bridge: frontendBridge, store });
  const reactDevToolsRoot = createRoot(document.createElement("div"));
  reactDevToolsRoot.render(createElement(DevTools));

  const backendBridge = createBackendBridge(window, wall);
  activateBackend(window, {
    bridge: backendBridge,
  });

  // Flush activate commands
  jest.runAllTimers();

  // Reset modules so that importing/requiring react-dom below will register with the DevTools hook
  jest.resetModules();

  let operations: number[][] = [];
  wall.listen(({ event, payload }: any) => {
    if (event === "operations") {
      operations.push(payload);
    }
  });

  // Import ReactDOM after DevTools has been initialized/configured so that it connects
  const ReactDOMClient = require("react-dom/client");
  const ReactDOMTestUtils = require("react-dom/test-utils");

  const testAppRoot = ReactDOMClient.createRoot(document.createElement("div"));

  const api: {
    destroy: Destroy;
    getOperations: GetOperations;
    root: ReturnType<typeof createRoot>;
    store: Store;
  } = {
    destroy: () => {
      testAppRoot.unmount();
      reactDevToolsRoot.unmount();

      // Flush pending DevTools postMessage() calls
      jest.runAllTimers();
      jest.restoreAllMocks();

      const target = window as any;
      delete target.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    },
    getOperations: (callback: Function) => {
      operations.splice(0);

      ReactDOMTestUtils.act(callback);

      // Flush pending DevTools postMessage() calls
      jest.runAllTimers();

      return operations;
    },
    root: testAppRoot,
    store,
  };

  return api;
}
