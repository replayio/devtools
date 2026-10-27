/* Copyright 2022 Record Replay Inc. */

// React DevTools routine result processing logic

import { ComponentTreeRoot, ExecutionPoint } from "@replayio/protocol";

import {
  ElementTypeRoot,
  SUSPENSE_TREE_OPERATION_ADD,
  SUSPENSE_TREE_OPERATION_REMOVE,
  SUSPENSE_TREE_OPERATION_REORDER_CHILDREN,
  SUSPENSE_TREE_OPERATION_RESIZE,
  SUSPENSE_TREE_OPERATION_SUSPENDERS,
  TREE_OPERATION_ADD,
  TREE_OPERATION_APPLIED_ACTIVITY_SLICE_CHANGE,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REORDER_CHILDREN,
  TREE_OPERATION_SET_SUBTREE_MODE,
  TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
  utfDecodeString,
  utfEncodeString,
} from "./printOperations";

export interface OperationsInfo {
  point: ExecutionPoint;
  time: number;
  deconstructedOperations: DeconstructedOperationsPieces;
}

export interface DeconstructedOperationsPieces {
  rendererId: number;
  rootId: number;
  stringTable: string[];
  treeOperations: ParsedReactDevtoolsTreeOperations[];
}

// The React DevTools logic defines a set of "tree operations" that describe
// changes to the contents of the React component tree. Those operations are
// serialized as part of a single large numeric operations array, which is very
// hard to read or work with. This file contains logic to parse that array into
// specific structures with named fields, which are easier to work with, and then
// reconstruct an equivalent numeric operations array based on these structures.
interface TreeOperationAddRootContents {
  nodeType: "root";
  isStrictModeCompliant: boolean;
  profilingFlags: number;
  supportsStrictMode: boolean;
  hasOwnerMetadata: boolean;
}

interface TreeOperationAddNodeContents {
  nodeType: "node";
  parentId: number;
  ownerId: number;
  stringTableIndex: number;
  keyStringTableIndex: number;
  // The `name` prop of e.g. Suspense and Activity boundaries
  namePropStringTableIndex: number;
}

interface TreeOperationAddBase {
  type: typeof TREE_OPERATION_ADD;
  nodeId: number;
  nodeType: number;
}

interface TreeOperationAddRoot extends TreeOperationAddBase {
  name: "addRoot";
  contents: TreeOperationAddRootContents;
}

interface TreeOperationAddNode extends TreeOperationAddBase {
  name: "addNode";
  contents: TreeOperationAddNodeContents;
}

interface TreeOperationRemove {
  type: typeof TREE_OPERATION_REMOVE;
  name: "remove";
  nodeIds: number[];
}

interface TreeOperationSetSubtreeMode {
  type: typeof TREE_OPERATION_SET_SUBTREE_MODE;
  name: "setSubtreeMode";
  rootId: number;
  mode: number;
}

interface TreeOperationReorderChildren {
  type: typeof TREE_OPERATION_REORDER_CHILDREN;
  name: "reorderChildren";
  nodeId: number;
  children: number[];
}

interface TreeOperationUpdateTreeBaseDuration {
  type: typeof TREE_OPERATION_UPDATE_TREE_BASE_DURATION;
  name: "updateTreeBaseDuration";
  id: number;
  baseDuration: number;
}

interface TreeOperationUpdateErrorsOrWarnings {
  type: typeof TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS;
  name: "updateErrorsOrWarnings";
  nodeId: number;
  errors: number;
  warnings: number;
}

// Suspense boundaries are reported a second time, as a separate tree of
// "suspense nodes" (with the same IDs as their elements), for the Suspense tab.
// The bounding rectangles are null when the backend didn't measure them.
type SuspenseNodeRects = number[][] | null;

interface SuspenseTreeOperationAdd {
  type: typeof SUSPENSE_TREE_OPERATION_ADD;
  name: "addSuspenseNode";
  nodeId: number;
  parentId: number;
  nameStringTableIndex: number;
  isSuspended: boolean;
  rects: SuspenseNodeRects;
}

interface SuspenseTreeOperationRemove {
  type: typeof SUSPENSE_TREE_OPERATION_REMOVE;
  name: "removeSuspenseNodes";
  nodeIds: number[];
}

interface SuspenseTreeOperationReorderChildren {
  type: typeof SUSPENSE_TREE_OPERATION_REORDER_CHILDREN;
  name: "reorderSuspenseChildren";
  nodeId: number;
  children: number[];
}

interface SuspenseTreeOperationResize {
  type: typeof SUSPENSE_TREE_OPERATION_RESIZE;
  name: "resizeSuspenseNode";
  nodeId: number;
  rects: SuspenseNodeRects;
}

interface TreeOperationAppliedActivitySliceChange {
  type: typeof TREE_OPERATION_APPLIED_ACTIVITY_SLICE_CHANGE;
  name: "appliedActivitySliceChange";
  activitySliceId: number;
}

export type ParsedReactDevtoolsTreeOperations =
  | TreeOperationAddRoot
  | TreeOperationAddNode
  | TreeOperationRemove
  | TreeOperationSetSubtreeMode
  | TreeOperationReorderChildren
  | TreeOperationUpdateTreeBaseDuration
  | TreeOperationUpdateErrorsOrWarnings
  | SuspenseTreeOperationAdd
  | SuspenseTreeOperationRemove
  | SuspenseTreeOperationReorderChildren
  | SuspenseTreeOperationResize
  | TreeOperationAppliedActivitySliceChange;

function parseRects(
  treeOperations: number[],
  i: number
): { rects: SuspenseNodeRects; next: number } {
  const numRects = treeOperations[i++];
  if (numRects === -1) {
    return { rects: null, next: i };
  }
  const rects: number[][] = [];
  for (let rectIndex = 0; rectIndex < numRects; rectIndex++) {
    rects.push(treeOperations.slice(i, i + 4));
    i += 4;
  }
  return { rects, next: i };
}

function encodeRects(rects: SuspenseNodeRects): number[] {
  return rects === null ? [-1] : [rects.length, ...rects.flat()];
}

export function deconstructOperationsArray(originalOperations: number[]) {
  const rendererId = originalOperations[0];
  const rootId = originalOperations[1];

  let i = 2;

  // Reassemble the string table.
  const stringTable: string[] = [
    null as any, // ID = 0 corresponds to the null string.
  ];

  const stringTableSize = originalOperations[i++];
  const stringTableEnd = i + stringTableSize;
  while (i < stringTableEnd) {
    const nextLength = originalOperations[i++];
    const nextString = utfDecodeString(originalOperations.slice(i, i + nextLength));
    stringTable.push(nextString);
    i += nextLength;
  }

  const numericTreeOperations = originalOperations.slice(stringTableEnd);

  const parsedTreeOperations = parseTreeOperations(numericTreeOperations);

  return {
    rendererId,
    rootId,
    stringTable,
    treeOperations: parsedTreeOperations,
  };
}

export function parseTreeOperations(treeOperations: number[]): ParsedReactDevtoolsTreeOperations[] {
  const parsedOperations: ParsedReactDevtoolsTreeOperations[] = [];

  // We're now going to iterate through just the actual
  // tree operations portion of the original operations array
  let i = 0;
  let loopCounter = 0;

  // Iteration logic and index comments copied from `printOperations.ts`
  while (i < treeOperations.length) {
    if (++loopCounter > 100000) {
      throw new Error("TREE_OPERATION_PARSING_INFINITE_LOOP");
    }
    const operation = treeOperations[i];

    switch (operation) {
      case TREE_OPERATION_ADD: {
        const nodeId = treeOperations[i + 1];
        const type = treeOperations[i + 2];

        i += 3;

        if (type === ElementTypeRoot) {
          // Booleans are encoded as 1 or 0
          const isStrictModeCompliant = treeOperations[i++] === 1;
          const profilingFlags = treeOperations[i++];
          const supportsStrictMode = treeOperations[i++] === 1;
          const hasOwnerMetadata = treeOperations[i++] === 1;

          const operation: TreeOperationAddRoot = {
            type: TREE_OPERATION_ADD,
            name: "addRoot",
            nodeId,
            nodeType: type,
            contents: {
              nodeType: "root",
              isStrictModeCompliant,
              profilingFlags,
              supportsStrictMode,
              hasOwnerMetadata,
            },
          };

          parsedOperations.push(operation);
        } else {
          const parentId = treeOperations[i++];
          const ownerId = treeOperations[i++];
          const stringTableIndex = treeOperations[i++];
          const keyStringTableIndex = treeOperations[i++];
          const namePropStringTableIndex = treeOperations[i++];

          const operation: TreeOperationAddNode = {
            type: TREE_OPERATION_ADD,
            name: "addNode",
            nodeId,
            nodeType: type,
            contents: {
              nodeType: "node",
              stringTableIndex,
              parentId,
              ownerId,
              keyStringTableIndex,
              namePropStringTableIndex,
            },
          };

          parsedOperations.push(operation);
        }

        break;
      }
      case TREE_OPERATION_REMOVE: {
        const removeLength = treeOperations[i + 1];
        i += 2;

        const nodeIds: number[] = [];

        for (let removeIndex = 0; removeIndex < removeLength; removeIndex++) {
          const id = treeOperations[i];
          nodeIds.push(id);
          i += 1;
        }

        const operation: TreeOperationRemove = {
          type: TREE_OPERATION_REMOVE,
          name: "remove",
          nodeIds,
        };

        parsedOperations.push(operation);
        break;
      }
      case TREE_OPERATION_SET_SUBTREE_MODE: {
        const rootId = treeOperations[i + 1];
        const mode = treeOperations[i + 2];

        i += 3;

        const operation: TreeOperationSetSubtreeMode = {
          type: TREE_OPERATION_SET_SUBTREE_MODE,
          name: "setSubtreeMode",
          rootId,
          mode,
        };

        parsedOperations.push(operation);
        break;
      }
      case TREE_OPERATION_REORDER_CHILDREN: {
        const nodeId = treeOperations[i + 1];
        const numChildren = treeOperations[i + 2];
        i += 3;
        const children = treeOperations.slice(i, i + numChildren);

        i += numChildren;

        const operation: TreeOperationReorderChildren = {
          type: TREE_OPERATION_REORDER_CHILDREN,
          name: "reorderChildren",
          nodeId,
          children,
        };

        parsedOperations.push(operation);
        break;
      }
      case TREE_OPERATION_UPDATE_TREE_BASE_DURATION: {
        const id = treeOperations[i + 1];
        const baseDuration = treeOperations[i + 2];
        // Base duration updates are only sent while profiling is in progress.
        // We can ignore them at this point.
        // The profiler UI uses them lazily in order to generate the tree.
        i += 3;

        const operation: TreeOperationUpdateTreeBaseDuration = {
          type: TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
          name: "updateTreeBaseDuration",
          id,
          baseDuration,
        };

        parsedOperations.push(operation);
        break;
      }
      case TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS: {
        const nodeId = treeOperations[i + 1];
        const errors = treeOperations[i + 2];
        const warnings = treeOperations[i + 3];

        i += 4;

        const operation: TreeOperationUpdateErrorsOrWarnings = {
          type: TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS,
          name: "updateErrorsOrWarnings",
          nodeId,
          errors,
          warnings,
        };

        parsedOperations.push(operation);
        break;
      }
      case SUSPENSE_TREE_OPERATION_ADD: {
        const nodeId = treeOperations[i + 1];
        const parentId = treeOperations[i + 2];
        const nameStringTableIndex = treeOperations[i + 3];
        const isSuspended = treeOperations[i + 4] === 1;
        const { rects, next } = parseRects(treeOperations, i + 5);
        i = next;

        parsedOperations.push({
          type: SUSPENSE_TREE_OPERATION_ADD,
          name: "addSuspenseNode",
          nodeId,
          parentId,
          nameStringTableIndex,
          isSuspended,
          rects,
        });
        break;
      }
      case SUSPENSE_TREE_OPERATION_REMOVE: {
        const removeLength = treeOperations[i + 1];
        const nodeIds = treeOperations.slice(i + 2, i + 2 + removeLength);
        i += 2 + removeLength;

        parsedOperations.push({
          type: SUSPENSE_TREE_OPERATION_REMOVE,
          name: "removeSuspenseNodes",
          nodeIds,
        });
        break;
      }
      case SUSPENSE_TREE_OPERATION_REORDER_CHILDREN: {
        const nodeId = treeOperations[i + 1];
        const numChildren = treeOperations[i + 2];
        const children = treeOperations.slice(i + 3, i + 3 + numChildren);
        i += 3 + numChildren;

        parsedOperations.push({
          type: SUSPENSE_TREE_OPERATION_REORDER_CHILDREN,
          name: "reorderSuspenseChildren",
          nodeId,
          children,
        });
        break;
      }
      case SUSPENSE_TREE_OPERATION_RESIZE: {
        const nodeId = treeOperations[i + 1];
        const { rects, next } = parseRects(treeOperations, i + 2);
        i = next;

        parsedOperations.push({
          type: SUSPENSE_TREE_OPERATION_RESIZE,
          name: "resizeSuspenseNode",
          nodeId,
          rects,
        });
        break;
      }
      case SUSPENSE_TREE_OPERATION_SUSPENDERS: {
        // What each Suspense boundary is suspended by. Only the Suspense tab
        // uses that, and it's the one piece of data that depends on which
        // replay process computed the operations: a React DevTools backend
        // set up partway into the recording has to derive it from the current
        // state, while one that ran from the start saw the boundaries suspend.
        // Drop it, so that the operations are the same either way.
        i++;
        const changeLength = treeOperations[i++];
        for (let changeIndex = 0; changeIndex < changeLength; changeIndex++) {
          i += 4; // id, hasUniqueSuspenders, endTime, isSuspended
          const environmentNamesLength = treeOperations[i++];
          i += environmentNamesLength;
        }
        break;
      }
      case TREE_OPERATION_APPLIED_ACTIVITY_SLICE_CHANGE: {
        const activitySliceId = treeOperations[i + 1];
        i += 2;

        parsedOperations.push({
          type: TREE_OPERATION_APPLIED_ACTIVITY_SLICE_CHANGE,
          name: "appliedActivitySliceChange",
          activitySliceId,
        });
        break;
      }
      default:
        throw new Error("UNEXPECTED_PARSED_OPERATION_TYPE");
    }
  }

  return parsedOperations;
}

// Given the deconstructed pieces that comprised an operations array
// in readable form, reconstruct the original numeric operations array.
export function reconstructOperationsArray({
  rendererId,
  rootId,
  stringTable,
  treeOperations,
}: DeconstructedOperationsPieces) {
  const finalStringTable = stringTable.slice();
  // The string table likely has the extra `null` placeholder.
  // We need to remove it before encoding.
  if (finalStringTable[0] === null) {
    finalStringTable.shift();
  }

  const reencodedStringTable = finalStringTable
    .map(string => {
      const encoded = utfEncodeString(string);
      return [encoded.length, ...encoded];
    })
    .flat();

  const reencodedTreeOperations = treeOperations
    .map(op => {
      const instructions: number[] = [op.type];

      switch (op.type) {
        case TREE_OPERATION_ADD: {
          const { nodeId, nodeType, contents } = op;
          instructions.push(nodeId, nodeType);

          if (contents.nodeType === "root") {
            const { isStrictModeCompliant, profilingFlags, supportsStrictMode, hasOwnerMetadata } =
              contents;

            instructions.push(
              isStrictModeCompliant ? 1 : 0,
              profilingFlags,
              supportsStrictMode ? 1 : 0,
              hasOwnerMetadata ? 1 : 0
            );
          } else {
            const {
              stringTableIndex,
              parentId,
              ownerId,
              keyStringTableIndex,
              namePropStringTableIndex,
            } = contents;

            instructions.push(
              parentId,
              ownerId,
              stringTableIndex,
              keyStringTableIndex,
              namePropStringTableIndex
            );
          }
          break;
        }
        case TREE_OPERATION_REMOVE: {
          const { nodeIds } = op;
          instructions.push(nodeIds.length, ...nodeIds);
          break;
        }
        case TREE_OPERATION_SET_SUBTREE_MODE: {
          const { rootId, mode } = op;
          instructions.push(rootId, mode);
          break;
        }
        case TREE_OPERATION_REORDER_CHILDREN: {
          const { nodeId, children } = op;
          instructions.push(nodeId, children.length, ...children);
          break;
        }
        case TREE_OPERATION_UPDATE_TREE_BASE_DURATION: {
          const { id, baseDuration } = op;
          instructions.push(id, baseDuration);
          break;
        }
        case TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS: {
          const { nodeId, errors, warnings } = op;
          instructions.push(nodeId, errors, warnings);
          break;
        }
        case SUSPENSE_TREE_OPERATION_ADD: {
          const { nodeId, parentId, nameStringTableIndex, isSuspended, rects } = op;
          instructions.push(
            nodeId,
            parentId,
            nameStringTableIndex,
            isSuspended ? 1 : 0,
            ...encodeRects(rects)
          );
          break;
        }
        case SUSPENSE_TREE_OPERATION_REMOVE: {
          const { nodeIds } = op;
          instructions.push(nodeIds.length, ...nodeIds);
          break;
        }
        case SUSPENSE_TREE_OPERATION_REORDER_CHILDREN: {
          const { nodeId, children } = op;
          instructions.push(nodeId, children.length, ...children);
          break;
        }
        case SUSPENSE_TREE_OPERATION_RESIZE: {
          const { nodeId, rects } = op;
          instructions.push(nodeId, ...encodeRects(rects));
          break;
        }
        case TREE_OPERATION_APPLIED_ACTIVITY_SLICE_CHANGE: {
          instructions.push(op.activitySliceId);
          break;
        }
        default:
          throw new Error("UNEXPECTED_PARSED_OPERATION_TYPE");
      }

      return instructions;
    })
    .flat();

  const operations: number[] = [
    // The original renderer ID and root ID
    rendererId,
    rootId,
    // The new string table length, in number of discrete numeric indices (not number of strings)
    reencodedStringTable.length,
    // The entire new string table contents,
    // containing all string length + individual character numeric value groups
    ...reencodedStringTable,
    // All tree operations values
    ...reencodedTreeOperations,
  ];

  return operations;
}

// Processor sessions return the committed tree at a point instead of the operations
// that built it. Build one operations array per root that adds the whole tree to an
// empty Store. Elements arrive in pre-order, so each parent is added before its children.
export function generateComponentTreeOperations(
  roots: ComponentTreeRoot[],
  rendererId: number
): number[][] {
  return roots.map(({ rootId, elements }) => {
    const stringTable: string[] = [];
    const stringIds = new Map<string, number>();
    const getStringId = (value: string | undefined) => {
      if (value === undefined) {
        return 0;
      }
      let id = stringIds.get(value);
      if (id === undefined) {
        stringTable.push(value);
        id = stringTable.length;
        stringIds.set(value, id);
      }
      return id;
    };

    const treeOperations: ParsedReactDevtoolsTreeOperations[] = [
      {
        type: TREE_OPERATION_ADD,
        name: "addRoot",
        nodeId: rootId,
        nodeType: ElementTypeRoot,
        contents: {
          nodeType: "root",
          isStrictModeCompliant: true,
          profilingFlags: 0,
          supportsStrictMode: false,
          hasOwnerMetadata: false,
        },
      },
    ];

    for (const { id, parentId, type, displayName, key } of elements) {
      treeOperations.push({
        type: TREE_OPERATION_ADD,
        name: "addNode",
        nodeId: id,
        nodeType: type,
        contents: {
          nodeType: "node",
          parentId,
          ownerId: 0,
          stringTableIndex: getStringId(displayName),
          keyStringTableIndex: getStringId(key),
          namePropStringTableIndex: 0,
        },
      });
    }

    return reconstructOperationsArray({ rendererId, rootId, stringTable, treeOperations });
  });
}

// Just enough of React DevTools' Store to read the tree it currently holds.
interface StoreContents {
  roots: ReadonlyArray<number>;
  _idToElement: Map<number, { children: number[] }>;
  _rootIDToRendererID: Map<number, number>;
  _idToSuspense: Map<number, { children: number[] }>;
}

// The Store only learns about the tree from operations, which are additive.
// To show the tree at another point in time, we first remove everything it
// holds, the way React DevTools' backend removes a root that unmounts: the
// Suspense nodes first, then the elements, both children-first (the root
// itself last).
export function generateTreeResetOperations(store: StoreContents): number[][] {
  const removalOperations: number[][] = [];

  const childrenFirst = (
    nodes: Map<number, { children: number[] }>,
    id: number,
    ids: number[] = []
  ) => {
    const node = nodes.get(id);
    if (node) {
      for (const childId of node.children) {
        childrenFirst(nodes, childId, ids);
      }
      ids.push(id);
    }
    return ids;
  };

  for (const rootId of store.roots) {
    const rendererId = store._rootIDToRendererID.get(rootId) ?? 0;
    const suspenseNodeIds = childrenFirst(store._idToSuspense, rootId);
    const elementIds = childrenFirst(store._idToElement, rootId);
    const treeOperations: ParsedReactDevtoolsTreeOperations[] = [];
    if (suspenseNodeIds.length > 0) {
      treeOperations.push({
        type: SUSPENSE_TREE_OPERATION_REMOVE,
        name: "removeSuspenseNodes",
        nodeIds: suspenseNodeIds,
      });
    }
    treeOperations.push({
      type: TREE_OPERATION_REMOVE,
      name: "remove",
      nodeIds: elementIds,
    });
    removalOperations.push(
      reconstructOperationsArray({ rendererId, rootId, stringTable: [], treeOperations })
    );
  }

  return removalOperations;
}
