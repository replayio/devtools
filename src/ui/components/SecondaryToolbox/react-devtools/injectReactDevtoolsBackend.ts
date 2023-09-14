import { pauseEvaluationsCache } from "replay-next/src/suspense/PauseCache";
import { ReplayClientInterface } from "shared/client/types";

import type { RendererInterface } from "@replayio/react-devtools-inline";

// Our modified RDT bundle exports some additional methods
type RendererInterfaceWithAdditions = RendererInterface & {
  getOrGenerateFiberID: (fiber: any) => number;
  setRootPseudoKey: (id: number, fiber: any) => void;
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

  // Evaluate the actual RDT hook installation file, so that this pause
  // has the initial RDT infrastructure available
  // @ts-ignore
  INSTALL_HOOK_PLACEHOLDER();

  // The only time we have access to the React root objects is when `onCommitFiberRoot` gets called.
  // Our Chromium fork specifically captures all those and saves them.
  // As part of the setup process, we have to copy those root references over to the real RDT
  // global hook object, so it has them available when it tries to walk the component tree.
  const savedRoots = window.__REACT_DEVTOOLS_STUB_FIBER_ROOTS;
  for (let [rendererID, rendererRoots] of Object.entries(savedRoots)) {
    const numericRendererID = Number(rendererID);
    const hookRoots = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.getFiberRoots(numericRendererID);
    for (let root of rendererRoots) {
      hookRoots.add(root);
    }
  }

  // Evaluate the actual RDT backend logic file, so that the rest of the
  // RDT logic is installed in this pause.
  // @ts-ignore
  DEVTOOLS_PLACEHOLDER();

  function traverseComponentTree(fiberNode: any, callback: (fiber: any) => void) {
    callback(fiberNode);

    let child = fiberNode.child;
    while (child) {
      traverseComponentTree(child, callback);
      child = child.sibling;
    }
  }

  window.__REACT_DEVTOOLS_SAVED_RENDERERS__.forEach(renderer => {
    window.logMessage("Injecting renderer");
    // Similarly, we need to take the real renderer references, and attach them
    // to the real RDT global hook now that it's in the page.
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject(renderer);
  });

  for (let [
    rendererID,
    renderer,
  ] of window.__REACT_DEVTOOLS_GLOBAL_HOOK__.rendererInterfaces.entries()) {
    const rendererWithAdditions = renderer as RendererInterfaceWithAdditions;
    const hookRoots = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.getFiberRoots(rendererID);
    for (let root of hookRoots) {
      const rootID = rendererWithAdditions.getOrGenerateFiberID(root.current);
      rendererWithAdditions.setRootPseudoKey(rootID, root.current);
      traverseComponentTree(root.current, fiber => {
        rendererWithAdditions.getOrGenerateFiberID(fiber);
      });

      // Force the extension to crawl the current DOM contents so it knows what nodes exist
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot(
        rendererID,
        root as unknown as Record<string, unknown>,
        1
      );
    }
  }
}

const injectGlobalHookSource = require("./installHook.raw.js").default;
const reactDevtoolsBackendSource = require("./react_devtools_backend.raw.js").default;

const expression = `(${installReactDevToolsIntoPause})()`
  .replace("INSTALL_HOOK_PLACEHOLDER", `(${injectGlobalHookSource})`)
  .replace("DEVTOOLS_PLACEHOLDER", `(${reactDevtoolsBackendSource})`);

export async function injectReactDevtoolsBackend(
  replayClient: ReplayClientInterface,
  pauseId?: string
) {
  if (!pauseId) {
    return;
  }
  await pauseEvaluationsCache.readAsync(replayClient, pauseId, null, expression);
}
