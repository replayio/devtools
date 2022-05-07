// Perform some analysis to construct the react devtools operations without depending
// on the backend which ran while recording.

import { Annotation, ExecutionPoint } from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";

import { ArrayMap } from "./utils";

type Fiber = any;
type PriorityLevel = any;

// Much of the code in this function is based on or copied from the react devtools backend.
function getCommitOperations(rendererID: number, root: Fiber, priorityLevel: PriorityLevel) {
  function getFiberID(fiber: Fiber): number {
    // @ts-ignore
    const id = __RECORD_REPLAY_PERSISTENT_ID__(fiber);
    if (!id || !id.startsWith("obj")) {
      throw new Error(`Missing persistent ID for fiber ${fiber}`);
    }
    return +id.substring(3);
  }

  const TREE_OPERATION_ADD = 1;
  const TREE_OPERATION_REMOVE = 2;
  const TREE_OPERATION_REORDER_CHILDREN = 3;
  const TREE_OPERATION_SET_SUBTREE_MODE = 7;

  const ElementTypeRoot = 11;
  const StrictMode = 1;

  const ReactTypeOfWork = {
    HostRoot: 3,
    SuspenseComponent: 13,
    OffscreenComponent: 22,
  };

  const StrictModeBits = 0;

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
  function shouldFilterFiber(fiber: Fiber) { return false; }

  function getDisplayNameForFiber(fiber: Fiber) {
    const {
      elementType,
      type,
      tag
    } = fiber;
    log(`GetDisplayNameForFiber ${elementType} ${type} ${tag}`);
    return "Fiber";
  }

  function getElementTypeForFiber(fiber: Fiber) {
    const {
      type,
      tag
    } = fiber;
    log(`GetElementTypeForFiber ${type} ${tag}`);
    return ElementTypeRoot;
  }

  function utfEncodeString(str: string) {
    return str;
  }

  const pendingStringTable: Map<string, { encodedString: string, id: number }> = new Map();
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
      id
    });

    pendingStringTableLength += encodedString.length + 1;
    return id;
  }

  function recordMount(fiber: Fiber, parentFiber: Fiber | null) {
    const isRoot = fiber.tag === ReactTypeOfWork.HostRoot;
    const id = getFiberID(fiber);

    const hasOwnerMetadata = fiber.hasOwnProperty('_debugOwner');
    const profilingFlags = 0;

    if (isRoot) {
      pushOperation(TREE_OPERATION_ADD);
      pushOperation(id);
      pushOperation(ElementTypeRoot);
      pushOperation((fiber.mode & StrictModeBits) !== 0 ? 1 : 0);
      pushOperation(profilingFlags);
      pushOperation(StrictModeBits !== 0 ? 1 : 0);
      pushOperation(hasOwnerMetadata ? 1 : 0);
    } else {
      const {
        key
      } = fiber;
      const displayName = getDisplayNameForFiber(fiber);
      const elementType = getElementTypeForFiber(fiber);
      const {
        _debugOwner
      } = fiber;

      const ownerID = _debugOwner != null ? getFiberID(_debugOwner) : 0;
      const parentID = parentFiber ? getFiberID(parentFiber) : 0;
      const displayNameStringID = getStringID(displayName);

      const keyString = key === null ? null : String(key);
      const keyStringID = getStringID(keyString);
      pushOperation(TREE_OPERATION_ADD);
      pushOperation(id);
      pushOperation(elementType);
      pushOperation(parentID);
      pushOperation(ownerID);
      pushOperation(displayNameStringID);
      pushOperation(keyStringID); // If this subtree has a new mode, let the frontend know.

      if ((fiber.mode & StrictModeBits) !== 0 && (parentFiber.mode & StrictModeBits) === 0) {
        pushOperation(TREE_OPERATION_SET_SUBTREE_MODE);
        pushOperation(id);
        pushOperation(StrictMode);
      }
    }
  }

  function mountFiberRecursively(firstChild: Fiber, parentFiber: Fiber | null, traverseSiblings: boolean) {
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
    const isTimedOutSuspense = fiber.tag === ReactTypeOfWork.SuspenseComponent && fiber.memoizedState !== null;
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
      const isTimedOutSuspense = fiber.tag === ReactTypeOfWork.SuspenseComponent && fiber.memoizedState !== null;

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

    pushOperation(TREE_OPERATION_REORDER_CHILDREN);
    pushOperation(getFiberID(fiber));
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

      if (nextFallbackChildSet != null && prevFallbackChildSet != null && updateFiberRecursively(nextFallbackChildSet, prevFallbackChildSet, nextFiber)) {
        shouldResetChildren = true;
      }
    } else if (prevDidTimeout && !nextDidTimeOut) {
      const nextPrimaryChildSet = nextFiber.child;
      if (nextPrimaryChildSet !== null) {
        mountFiberRecursively(nextPrimaryChildSet, shouldIncludeInTree ? nextFiber : parentFiber, true);
      }
      shouldResetChildren = true;
    } else if (!prevDidTimeout && nextDidTimeOut) {
      unmountFiberChildrenRecursively(prevFiber);
      const nextFiberChild = nextFiber.child;
      const nextFallbackChildSet = nextFiberChild ? nextFiberChild.sibling : null;
      if (nextFallbackChildSet != null) {
        mountFiberRecursively(nextFallbackChildSet, shouldIncludeInTree ? nextFiber : parentFiber, true);
        shouldResetChildren = true;
      }
    } else {
      if (nextFiber.child !== prevFiber.child) {
        let nextChild = nextFiber.child;
        let prevChildAtSameIndex = prevFiber.child;
        while (nextChild) {
          if (nextChild.alternate) {
            const prevChild = nextChild.alternate;
            if (updateFiberRecursively(nextChild, prevChild, shouldIncludeInTree ? nextFiber : parentFiber)) {
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
      const wasMounted = alternate.memoizedState != null && alternate.memoizedState.element != null &&
      alternate.memoizedState.isDehydrated !== true;
      const isMounted = current.memoizedState != null && current.memoizedState.element != null &&
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
    const numUnmountIDs = pendingRealUnmountedIDs.length + pendingSimulatedUnmountedIDs.length + (pendingUnmountedRootID === null ? 0 : 1);
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
    handleCommitFiberRoot(root, priorityLevel);
    const operations = getOperations();
    return JSON.stringify({ logMessages, operations });
  } catch (e: any) {
    return "Exception: " + e.toString();
  }
}

async function getFiberCommitOperations(
  point: ExecutionPoint,
  time: number
): Promise<number[] | undefined> {
  const pause = ThreadFront.ensurePause(point, time);
  const frames = await pause.getFrames();
  if (!frames || !frames.length) {
    return;
  }

  const text = `(${getCommitOperations})(rendererID, root, priorityLevel)`;

  const topFrameId = frames[0].frameId;
  const rv = await pause.evaluate(topFrameId, text, /* pure */ false);

  console.log("FiberCommit", rv, (rv?.returned as any)?.value);
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

  const fiberCommits = hookAnnotations.map.get("commit-fiber-root");
  if (!fiberCommits) {
    return;
  }

  console.log("FiberCommits", fiberCommits);

  const commitOperations = await Promise.all(
    fiberCommits.map(({ point, time }) => getFiberCommitOperations(point, time))
  );
}
