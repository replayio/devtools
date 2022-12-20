import type { ThreadFront as TF } from "protocol/thread";
import { ReplayClientInterface } from "shared/client/types";

// Cache this at the module level, because the backend records all evaluations
// applied to a given pause in a session. So, we only need to do this once for
// a given Pause, and we want to retain the info even if the RDT component unmounts.
const pausesWithDevtoolsInjected = new Set<string>();

type Renderer = any;
declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: any;
    __REACT_DEVTOOLS_SAVED_RENDERERS__: any[];
    savedOperations: number[][];
    evaluationLogs: string[];
    logMessage: (message: string) => void;
    __REACT_DEVTOOLS_STUB_FIBER_ROOTS: Record<string, Set<any>>;
    __RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__: (
      event: string,
      data: any
    ) => { event: string; data: any };
  }
}

function onRendererInject(renderer: Renderer, rendererID: number) {
  const rv = { rendererID, version: renderer.version || "unknown" };
  return JSON.stringify(rv);
}

function mutateWindowForSetup() {
  window.evaluationLogs = [];
  window.savedOperations = [];
  window.logMessage = function (message) {
    window.evaluationLogs.push(message);
  };
  delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
}

function readWindow() {
  return JSON.stringify(window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
}

function readRenderers() {
  return JSON.stringify({ renderers: window.__REACT_DEVTOOLS_SAVED_RENDERERS__ });
}

function getMessages() {
  return JSON.stringify({ messages: window.evaluationLogs });
}

function getOperations() {
  return JSON.stringify({ operations: window.savedOperations });
}

function logRendererVersion() {
  // const result = window.__RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__(
  //   "getBridgeProtocol",
  //   undefined
  // );
  const result = window.__RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__("inspectElement", {
    forceFullData: true,
    id: 173,
    path: null,
    rendererID: 1,
    requestID: 1,
  });
  window.logMessage("Renderer version result: " + JSON.stringify(result));
}

function copyMountedRoots() {
  const savedRoots = window.__REACT_DEVTOOLS_STUB_FIBER_ROOTS;
  window.logMessage("Saved roots keys: " + Object.keys(savedRoots));
  for (let [rendererID, rendererRoots] of Object.entries(savedRoots)) {
    window.logMessage(`Saved roots: renderer = ${rendererID}, numRoots: ${rendererRoots.size}`);
    const numericRendererID = Number(rendererID);
    const hookRoots = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.getFiberRoots(numericRendererID);
    for (let root of rendererRoots) {
      hookRoots.add(root);
    }
  }
}

function injectExistingRenderers() {
  window.__REACT_DEVTOOLS_SAVED_RENDERERS__.forEach(renderer => {
    window.logMessage("Injecting renderer");
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject(renderer);
  });

  for (let [
    rendererID,
    renderer,
  ] of window.__REACT_DEVTOOLS_GLOBAL_HOOK__.rendererInterfaces.entries()) {
    // const savedRoots = window.__REACT_DEVTOOLS_STUB_GET_FIBER_ROOTS(rendererID);
    //
    // for (let root of savedRoots) {
    //   hookRoots.add(root);
    const hookRoots = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.getFiberRoots(rendererID);
    for (let root of hookRoots) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot(rendererID, root, 1);
    }

    // }
    // renderer.flushInitialOperations();
    window.logMessage(
      `Renderer: ${rendererID}, size: ${
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.getFiberRoots(rendererID).size
      }`
    );
  }
}

async function evaluateNoArgsFunction(
  ThreadFront: typeof TF,
  replayClient: ReplayClientInterface,
  fn: Function
) {
  return await ThreadFront.evaluateNew({
    replayClient,
    text: `(${fn})()`,
  });
}

export async function logWindowMessages(
  ThreadFront: typeof TF,
  replayClient: ReplayClientInterface
) {
  const messages = await evaluateNoArgsFunction(ThreadFront, replayClient, getMessages);
  console.log("Evaluation messages: ", JSON.parse(messages?.returned?.value ?? "null").messages);
}

export async function injectReactDevtoolsBackend(
  ThreadFront: typeof TF,
  replayClient: ReplayClientInterface
) {
  const pauseId = ThreadFront.currentPause?.pauseId;
  if (!pauseId || pausesWithDevtoolsInjected.has(pauseId)) {
    return;
  }

  pausesWithDevtoolsInjected.add(pauseId);

  const injectGlobalHookSource = require("./injectGlobalHook.raw.js").default;
  const reactDevtoolsBackendSource = require("./react_devtools_backend.raw.js").default;

  await evaluateNoArgsFunction(ThreadFront, replayClient, mutateWindowForSetup);
  await ThreadFront.evaluateNew({
    replayClient,
    pauseId,
    text: injectGlobalHookSource,
  });

  console.log("Copying mounted roots");
  await evaluateNoArgsFunction(ThreadFront, replayClient, copyMountedRoots);

  await ThreadFront.evaluateNew({
    replayClient,
    text: reactDevtoolsBackendSource,
  });

  await evaluateNoArgsFunction(ThreadFront, replayClient, injectExistingRenderers);

  try {
    // await evaluateNoArgsFunction(ThreadFront, replayClient, logRendererVersion);
  } catch (err) {
    console.error(err);
  }

  await logWindowMessages(ThreadFront, replayClient);
  // const hook = await evaluateNoArgsFunction(ThreadFront, replayClient, readWindow);
  // console.log("Global hook: ", JSON.parse(hook?.returned?.value ?? "null"));
}
