// Perform some analysis to construct the react devtools operations without depending
// on the backend which ran while recording.

import { Annotation, ExecutionPoint } from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";
import { comparePoints } from "./execution-point-utils";

import { ArrayMap } from "./utils";

async function evaluateInTopFrame(
  point: ExecutionPoint,
  time: number,
  text: string
): Promise<string | null> {
  const pause = ThreadFront.ensurePause(point, time);
  const frames = await pause.getFrames();
  if (!frames || !frames.length) {
    return null;
  }

  const topFrameId = frames[0].frameId;
  const rv = await pause.evaluate(topFrameId, text, /* pure */ false);
  return (rv?.returned as any)?.value;
}

type Renderer = any;

function onRendererInject(renderer: Renderer) {
  const rv = { version: renderer.version || "unknown" };
  return JSON.stringify(rv);
}

interface RendererInfo {
  version: string;
}

async function getRendererInfo(point: ExecutionPoint, time: number): Promise<RendererInfo> {
  const str = await evaluateInTopFrame(point, time, `(${onRendererInject})(renderer)`);
  if (!str) {
    throw new Error("Could not get renderer information");
  }
  return JSON.parse(str);
}

type Fiber = any;
type PriorityLevel = any;

// Much of the code in this function is based on or copied from the react devtools backend.
function doBackendOperations(
  kind: string,
  rendererID: number,
  rootOrFiber: Fiber,
  priorityLevel: PriorityLevel
) {
  function getPersistentID(obj: any): number {
    // @ts-ignore
    const id = __RECORD_REPLAY_PERSISTENT_ID__(obj);
    if (!id || !id.startsWith("obj")) {
      throw new Error(`Missing persistent ID for fiber ${obj} ${obj.constructor}`);
    }
    return +id.substring(3);
  }

  function getFiberID(fiber: Fiber): number {
    // Both a fiber and its alternate have the same ID. To handle this using
    // persistent IDs, the ID of a fiber is the minimal persistent ID of itself
    // and its alternate, if there is one.
    const id = getPersistentID(fiber);
    if (!fiber.alternate) {
      return id;
    }
    const alternateId = getPersistentID(fiber.alternate);
    return Math.min(id, alternateId);
  }

  const TREE_OPERATION_ADD = 1;
  const TREE_OPERATION_REMOVE = 2;
  const TREE_OPERATION_REORDER_CHILDREN = 3;
  const TREE_OPERATION_SET_SUBTREE_MODE = 7;

  const ElementTypeFunction = 5;
  const ElementTypeRoot = 11;
  const StrictMode = 1;

  // For react 17.0.1+
  const ReactTypeOfWork = {
    FunctionComponent: 0,
    HostRoot: 3,
    HostComponent: 5,
    Mode: 8,
    SuspenseComponent: 13,
    OffscreenComponent: 22,
  };

  // For react 18+
  const StrictModeBits = 0b011000;

  const logMessages: string[] = [];

  function log(str: string) {
    logMessages.push(str);
  }

  const pendingOperations: number[] = [];

  function pushOperation(n: number) {
    pendingOperations.push(n);
  }

  function setRootPseudoKey(id: number, root: Fiber) {}
  function removeRootPseudoKey(id: number) {}
  function shouldFilterFiber(fiber: Fiber) {
    // Note: This does not match what the backend does normally. shouldFilterFiber()
    // is pretty complicated, so to cut corners this just tweaks things so that the
    // same fibers will be filtered out on a simple react app.
    switch (fiber.tag) {
      case ReactTypeOfWork.Mode:
      case ReactTypeOfWork.HostComponent:
        return true;
    }
    return false;
  }

  function getDisplayName(type: any, fallbackName = "Anonymous") {
    let displayName = fallbackName;
    if (typeof type.displayName === "string") {
      displayName = type.displayName;
    } else if (typeof type.name === "string" && type.name !== "") {
      displayName = type.name;
    }
    return displayName;
  }

  function getDisplayNameForFiber(fiber: Fiber) {
    const { elementType, type, tag } = fiber;
    switch (tag) {
      case ReactTypeOfWork.FunctionComponent:
        return getDisplayName(type);
    }
    log(`GetDisplayNameUnknownFiber ${typeof elementType} ${typeof type} ${tag}`);
    return "Fiber";
  }

  function getElementTypeForFiber(fiber: Fiber) {
    const { type, tag } = fiber;
    switch (tag) {
      case ReactTypeOfWork.FunctionComponent:
        return ElementTypeFunction;
    }
    log(`GetElementTypeUnknownFiber ${typeof type} ${tag}`);
    return ElementTypeRoot;
  }

  function utfEncodeString(str: string) {
    // FIXME
    const rv: number[] = [];
    for (let i = 0; i < str.length; i++) {
      rv.push(str.charCodeAt(i));
    }
    return rv;
  }

  const pendingStringTable: Map<string, { encodedString: number[]; id: number }> = new Map();
  let pendingStringTableLength = 0;

  function getStringID(string: string | null) {
    if (string === null) {
      return 0;
    }

    const existingEntry = pendingStringTable.get(string);

    if (existingEntry !== undefined) {
      return existingEntry.id;
    }

    const id = pendingStringTable.size + 1;
    const encodedString = utfEncodeString(string);

    pendingStringTable.set(string, {
      encodedString,
      id,
    });

    pendingStringTableLength += encodedString.length + 1;
    return id;
  }

  function recordMount(fiber: Fiber, parentFiber: Fiber | null) {
    const isRoot = fiber.tag === ReactTypeOfWork.HostRoot;
    const id = getFiberID(fiber);

    const hasOwnerMetadata = fiber.hasOwnProperty("_debugOwner");
    const profilingFlags = 0;

    if (isRoot) {
      log(`Operation AddRoot ${id}`);

      pushOperation(TREE_OPERATION_ADD);
      pushOperation(id);
      pushOperation(ElementTypeRoot);
      pushOperation((fiber.mode & StrictModeBits) !== 0 ? 1 : 0);
      pushOperation(profilingFlags);
      // @ts-ignore
      pushOperation(StrictModeBits !== 0 ? 1 : 0);
      pushOperation(hasOwnerMetadata ? 1 : 0);
    } else {
      const { key } = fiber;
      const displayName = getDisplayNameForFiber(fiber);
      const elementType = getElementTypeForFiber(fiber);
      const { _debugOwner } = fiber;

      const ownerID = _debugOwner != null ? getFiberID(_debugOwner) : 0;
      const parentID = parentFiber ? getFiberID(parentFiber) : 0;
      const displayNameStringID = getStringID(displayName);

      const keyString = key === null ? null : String(key);
      const keyStringID = getStringID(keyString);

      log(`Operation AddNode ${id} ${parentID}`);

      pushOperation(TREE_OPERATION_ADD);
      pushOperation(id);
      pushOperation(elementType);
      pushOperation(parentID);
      pushOperation(ownerID);
      pushOperation(displayNameStringID);
      pushOperation(keyStringID); // If this subtree has a new mode, let the frontend know.

      if ((fiber.mode & StrictModeBits) !== 0 && (parentFiber.mode & StrictModeBits) === 0) {
        log(`Operation SetSubtreeMode ${id}`);
        pushOperation(TREE_OPERATION_SET_SUBTREE_MODE);
        pushOperation(id);
        pushOperation(StrictMode);
      }
    }
  }

  function mountFiberRecursively(
    firstChild: Fiber,
    parentFiber: Fiber | null,
    traverseSiblings: boolean
  ) {
    let fiber = firstChild;

    while (fiber !== null) {
      const shouldIncludeInTree = !shouldFilterFiber(fiber);

      if (shouldIncludeInTree) {
        recordMount(fiber, parentFiber);
      }

      const isSuspense = fiber.tag === ReactTypeOfWork.SuspenseComponent;

      if (isSuspense) {
        const isTimedOut = fiber.memoizedState !== null;

        if (isTimedOut) {
          const primaryChildFragment = fiber.child;
          const fallbackChildFragment = primaryChildFragment ? primaryChildFragment.sibling : null;
          const fallbackChild = fallbackChildFragment ? fallbackChildFragment.child : null;

          if (fallbackChild !== null) {
            mountFiberRecursively(fallbackChild, shouldIncludeInTree ? fiber : parentFiber, true);
          }
        } else {
          let primaryChild = null;
          const areSuspenseChildrenConditionallyWrapped = ReactTypeOfWork.OffscreenComponent === -1;

          if (areSuspenseChildrenConditionallyWrapped) {
            primaryChild = fiber.child;
          } else if (fiber.child !== null) {
            primaryChild = fiber.child.child;
          }

          if (primaryChild !== null) {
            mountFiberRecursively(primaryChild, shouldIncludeInTree ? fiber : parentFiber, true);
          }
        }
      } else {
        if (fiber.child !== null) {
          mountFiberRecursively(fiber.child, shouldIncludeInTree ? fiber : parentFiber, true);
        }
      }

      fiber = traverseSiblings ? fiber.sibling : null;
    }
  }

  let pendingUnmountedRootID: number | null = null;
  const pendingSimulatedUnmountedIDs: number[] = [];
  const pendingRealUnmountedIDs: number[] = [];

  function recordUnmount(fiber: Fiber, isSimulated: boolean) {
    const id = getFiberID(fiber);
    const isRoot = fiber.tag === ReactTypeOfWork.HostRoot;

    if (isRoot) {
      pendingUnmountedRootID = id;
    } else if (!shouldFilterFiber(fiber)) {
      if (isSimulated) {
        pendingSimulatedUnmountedIDs.push(id);
      } else {
        pendingRealUnmountedIDs.push(id);
      }
    }
  }

  function unmountFiberChildrenRecursively(fiber: Fiber) {
    const isTimedOutSuspense =
      fiber.tag === ReactTypeOfWork.SuspenseComponent && fiber.memoizedState !== null;
    let child = fiber.child;

    if (isTimedOutSuspense) {
      const primaryChildFragment = fiber.child;
      const fallbackChildFragment = primaryChildFragment ? primaryChildFragment.sibling : null;

      child = fallbackChildFragment ? fallbackChildFragment.child : null;
    }

    while (child !== null) {
      if (child.return !== null) {
        unmountFiberChildrenRecursively(child);
        recordUnmount(child, true);
      }

      child = child.sibling;
    }
  }

  function findReorderedChildrenRecursively(fiber: Fiber, nextChildren: number[]) {
    if (!shouldFilterFiber(fiber)) {
      nextChildren.push(getFiberID(fiber));
    } else {
      let child = fiber.child;
      const isTimedOutSuspense =
        fiber.tag === ReactTypeOfWork.SuspenseComponent && fiber.memoizedState !== null;

      if (isTimedOutSuspense) {
        const primaryChildFragment = fiber.child;
        const fallbackChildFragment = primaryChildFragment ? primaryChildFragment.sibling : null;
        const fallbackChild = fallbackChildFragment ? fallbackChildFragment.child : null;

        if (fallbackChild !== null) {
          child = fallbackChild;
        }
      }

      while (child !== null) {
        findReorderedChildrenRecursively(child, nextChildren);
        child = child.sibling;
      }
    }
  }

  function recordResetChildren(fiber: Fiber, childSet: Fiber | null) {
    const nextChildren: number[] = [];

    let child = childSet;
    while (child !== null) {
      findReorderedChildrenRecursively(child, nextChildren);
      child = child.sibling;
    }

    const numChildren = nextChildren.length;

    if (numChildren < 2) {
      // No need to reorder.
      return;
    }

    const id = getFiberID(fiber);

    log(`Operation ReorderChildren ${id}`);

    pushOperation(TREE_OPERATION_REORDER_CHILDREN);
    pushOperation(id);
    pushOperation(numChildren);

    for (let i = 0; i < nextChildren.length; i++) {
      pushOperation(nextChildren[i]);
    }
  }

  function updateFiberRecursively(nextFiber: Fiber, prevFiber: Fiber, parentFiber: Fiber | null) {
    const shouldIncludeInTree = !shouldFilterFiber(nextFiber);
    const isSuspense = nextFiber.tag === ReactTypeOfWork.SuspenseComponent;
    let shouldResetChildren = false;

    const prevDidTimeout = isSuspense && prevFiber.memoizedState !== null;
    const nextDidTimeOut = isSuspense && nextFiber.memoizedState !== null;

    if (prevDidTimeout && nextDidTimeOut) {
      const nextFiberChild = nextFiber.child;
      const nextFallbackChildSet = nextFiberChild ? nextFiberChild.sibling : null;
      const prevFiberChild = prevFiber.child;
      const prevFallbackChildSet = prevFiberChild ? prevFiberChild.sibling : null;

      if (
        nextFallbackChildSet != null &&
        prevFallbackChildSet != null &&
        updateFiberRecursively(nextFallbackChildSet, prevFallbackChildSet, nextFiber)
      ) {
        shouldResetChildren = true;
      }
    } else if (prevDidTimeout && !nextDidTimeOut) {
      const nextPrimaryChildSet = nextFiber.child;
      if (nextPrimaryChildSet !== null) {
        mountFiberRecursively(
          nextPrimaryChildSet,
          shouldIncludeInTree ? nextFiber : parentFiber,
          true
        );
      }
      shouldResetChildren = true;
    } else if (!prevDidTimeout && nextDidTimeOut) {
      unmountFiberChildrenRecursively(prevFiber);
      const nextFiberChild = nextFiber.child;
      const nextFallbackChildSet = nextFiberChild ? nextFiberChild.sibling : null;
      if (nextFallbackChildSet != null) {
        mountFiberRecursively(
          nextFallbackChildSet,
          shouldIncludeInTree ? nextFiber : parentFiber,
          true
        );
        shouldResetChildren = true;
      }
    } else {
      if (nextFiber.child !== prevFiber.child) {
        let nextChild = nextFiber.child;
        let prevChildAtSameIndex = prevFiber.child;
        while (nextChild) {
          if (nextChild.alternate) {
            const prevChild = nextChild.alternate;
            if (
              updateFiberRecursively(
                nextChild,
                prevChild,
                shouldIncludeInTree ? nextFiber : parentFiber
              )
            ) {
              shouldResetChildren = true;
            }
            if (prevChild !== prevChildAtSameIndex) {
              shouldResetChildren = true;
            }
          } else {
            mountFiberRecursively(nextChild, shouldIncludeInTree ? nextFiber : parentFiber, false);
            shouldResetChildren = true;
          }
          nextChild = nextChild.sibling;
          if (!shouldResetChildren && prevChildAtSameIndex !== null) {
            prevChildAtSameIndex = prevChildAtSameIndex.sibling;
          }
        }
        if (prevChildAtSameIndex !== null) {
          shouldResetChildren = true;
        }
      }
    }

    if (shouldResetChildren) {
      if (shouldIncludeInTree) {
        let nextChildSet = nextFiber.child;
        if (nextDidTimeOut) {
          const nextFiberChild = nextFiber.child;
          nextChildSet = nextFiberChild ? nextFiberChild.sibling : null;
        }
        if (nextChildSet != null) {
          recordResetChildren(nextFiber, nextChildSet);
        }
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  let currentRootID: number;

  function handleCommitFiberRoot(root: Fiber, priorityLevel: PriorityLevel) {
    const current = root.current;
    const alternate = current.alternate;

    currentRootID = getFiberID(current);

    if (alternate) {
      const wasMounted =
        alternate.memoizedState != null &&
        alternate.memoizedState.element != null &&
        alternate.memoizedState.isDehydrated !== true;
      const isMounted =
        current.memoizedState != null &&
        current.memoizedState.element != null &&
        current.memoizedState.isDehydrated !== true;

      if (!wasMounted && isMounted) {
        setRootPseudoKey(currentRootID, current);
        mountFiberRecursively(current, null, false);
      } else if (wasMounted && isMounted) {
        updateFiberRecursively(current, alternate, null);
      } else if (wasMounted && !isMounted) {
        removeRootPseudoKey(currentRootID);
        recordUnmount(current, false);
      }
    } else {
      setRootPseudoKey(currentRootID, current);
      mountFiberRecursively(current, null, false);
    }
  }

  function getOperations(): number[] {
    const numUnmountIDs =
      pendingRealUnmountedIDs.length +
      pendingSimulatedUnmountedIDs.length +
      (pendingUnmountedRootID === null ? 0 : 1);
    const operations = new Array(
      2 + // [rendererID, rootFiberID]
        1 + // [stringTableLength]
        pendingStringTableLength +
        // [TREE_OPERATION_REMOVE, removedIDLength, ...ids]
        (numUnmountIDs > 0 ? 2 + numUnmountIDs : 0) +
        // Regular operations
        pendingOperations.length
    );

    let i = 0;
    operations[i++] = rendererID;
    operations[i++] = currentRootID;

    operations[i++] = pendingStringTableLength;
    pendingStringTable.forEach((entry, stringKey) => {
      const encodedString = entry.encodedString;

      const length = encodedString.length;
      operations[i++] = length;

      for (let j = 0; j < length; j++) {
        operations[i + j] = encodedString[j];
      }

      i += length;
    });

    if (numUnmountIDs > 0) {
      operations[i++] = TREE_OPERATION_REMOVE;
      operations[i++] = numUnmountIDs;
      for (let j = pendingRealUnmountedIDs.length - 1; j >= 0; j--) {
        operations[i++] = pendingRealUnmountedIDs[j];
      }
      for (let j = 0; j < pendingSimulatedUnmountedIDs.length; j++) {
        operations[i + j] = pendingSimulatedUnmountedIDs[j];
      }
      i += pendingSimulatedUnmountedIDs.length;
      if (pendingUnmountedRootID !== null) {
        operations[i] = pendingUnmountedRootID;
        i++;
      }
    }

    for (let j = 0; j < pendingOperations.length; j++) {
      operations[i + j] = pendingOperations[j];
    }

    return operations;
  }

  try {
    switch (kind) {
      case "commit":
        handleCommitFiberRoot(rootOrFiber, priorityLevel);
        break;
      case "unmount":
        recordUnmount(rootOrFiber, false);
        break;
    }

    const operations = getOperations();
    return JSON.stringify({ logMessages, operations });
  } catch (e: any) {
    return `Exception: ${e} ${e.stack}`;
  }
}

interface OperationsInfo {
  point: ExecutionPoint;
  time: number;
  logMessages: string[];
  operations: number[];
}

async function getFiberCommitOperations(
  point: ExecutionPoint,
  time: number
): Promise<OperationsInfo> {
  const rv = await evaluateInTopFrame(
    point,
    time,
    `(${doBackendOperations})("commit", rendererID, root, priorityLevel)`
  );
  if (!rv) {
    throw new Error("Could not extract operations from fiber commit");
  }
  console.log("FiberCommit", time, rv);
  const { logMessages, operations } = JSON.parse(rv);
  return { point, time, logMessages, operations };
}

async function getFiberUnmountOperations(
  point: ExecutionPoint,
  time: number
): Promise<OperationsInfo> {
  const rv = await evaluateInTopFrame(
    point,
    time,
    `(${doBackendOperations})("unmount", rendererID, fiber)`
  );
  if (!rv) {
    throw new Error("Could not extract operations from fiber commit");
  }
  console.log("FiberUnmount", time, rv);
  const { logMessages, operations } = JSON.parse(rv);
  return { point, time, logMessages, operations };
}

// Constants in getCommitOperations are specialized for recent react versions.
function isSupportedReactVersion(version: string) {
  return version == "18.1.0";
}

export async function findReactDevtoolsOperations() {
  const hookAnnotations: ArrayMap<string, Annotation> = new ArrayMap();

  await ThreadFront.getAnnotations(({ annotations }) => {
    annotations.forEach(annotation => {
      if (annotation.kind == "react-devtools-hook") {
        hookAnnotations.add(annotation.contents, annotation);
      }
    });
  });

  const injects = hookAnnotations.map.get("inject");
  if (!injects) {
    return;
  }

  const renderers = await Promise.all(
    injects.map(({ point, time }) => getRendererInfo(point, time))
  );
  for (const { version } of renderers) {
    if (!isSupportedReactVersion(version)) {
      console.log("UnsupportedReactVersion", version);
      return;
    }
  }

  const fiberCommits = hookAnnotations.map.get("commit-fiber-root") || [];
  const commitOperations = await Promise.all(
    fiberCommits.map(({ point, time }) => getFiberCommitOperations(point, time))
  );

  const fiberUnmounts = hookAnnotations.map.get("commit-fiber-unmount") || [];
  const unmountOperations = await Promise.all(
    fiberUnmounts.map(({ point, time }) => getFiberUnmountOperations(point, time))
  );

  let allOperations = [...commitOperations, ...unmountOperations];
  allOperations.sort((a, b) => comparePoints(a.point, b.point));

  // Unmounts will not know about the current root ID. Normally the backend will
  // set this when flushing the unmount operations during the next onCommitFiberRoot
  // call, but we can fill in the roots ourselves by looking for the next commit.
  for (let i = 0; i < allOperations.length; i++) {
    const { operations } = allOperations[i];
    if (operations[1] === null) {
      for (let j = i + 1; j < allOperations.length; j++) {
        const { operations: laterOperations } = allOperations[j];
        if (laterOperations[1] !== null && operations[0] === laterOperations[0]) {
          operations[1] = laterOperations[1];
          break;
        }
      }
    }
  }

  // Filter out operations which don't include any changes.
  allOperations = allOperations.filter(({ operations }) => operations.length > 3);

  console.log("BackendOperations", allOperations);
}
