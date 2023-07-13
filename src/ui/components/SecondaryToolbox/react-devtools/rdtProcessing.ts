/* Copyright 2022 Record Replay Inc. */

// React DevTools routine result processing logic

import { ExecutionPoint, TimeStampedPoint } from "@replayio/protocol";

import { isExecutionPointsWithinRange } from "replay-next/src/utils/time";
import { ParsedReactDevToolsAnnotation } from "ui/suspense/annotationsCaches";

import {
  ElementTypeRoot,
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REMOVE_ROOT,
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

interface RootNodeOperation extends TimeStampedPoint {
  type: "root-added" | "root-removed";
  rendererId: number;
  rootId: number;
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
  supportsProfiling: boolean;
  supportsStrictMode: boolean;
  hasOwnerMetadata: boolean;
}

interface TreeOperationAddNodeContents {
  nodeType: "node";
  parentId: number;
  ownerId: number;
  stringTableIndex: number;
  keyStringTableIndex: number;
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

interface TreeOperationRemoveRoot {
  type: typeof TREE_OPERATION_REMOVE_ROOT;
  name: "removeRoot";
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

export type ParsedReactDevtoolsTreeOperations =
  | TreeOperationAddRoot
  | TreeOperationAddNode
  | TreeOperationRemove
  | TreeOperationRemoveRoot
  | TreeOperationSetSubtreeMode
  | TreeOperationReorderChildren
  | TreeOperationUpdateTreeBaseDuration
  | TreeOperationUpdateErrorsOrWarnings;

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
          const supportsProfiling = treeOperations[i++] === 1;
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
              supportsProfiling,
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
      case TREE_OPERATION_REMOVE_ROOT: {
        i += 1;

        const operation: TreeOperationRemoveRoot = {
          type: TREE_OPERATION_REMOVE_ROOT,
          name: "removeRoot",
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
      default:
        throw new Error("UNEXPECTED_PARSED_OPERATION_TYPE");
    }
  }

  return parsedOperations;
}

// Given the deconstructed pieces that comprised an operations array
// in readable form, reconstruct the original numeric operations array.
export function reconstructOperationsArray(
  rendererId: number,
  rootId: number,
  stringTable: string[],
  treeOperations: ParsedReactDevtoolsTreeOperations[]
) {
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
            const {
              isStrictModeCompliant,
              supportsProfiling,
              supportsStrictMode,
              hasOwnerMetadata,
            } = contents;

            instructions.push(
              isStrictModeCompliant ? 1 : 0,
              supportsProfiling ? 1 : 0,
              supportsStrictMode ? 1 : 0,
              hasOwnerMetadata ? 1 : 0
            );
          } else {
            const { stringTableIndex, parentId, ownerId, keyStringTableIndex } = contents;

            instructions.push(parentId, ownerId, stringTableIndex, keyStringTableIndex);
          }
          break;
        }
        case TREE_OPERATION_REMOVE: {
          const { nodeIds } = op;
          instructions.push(nodeIds.length, ...nodeIds);
          break;
        }
        case TREE_OPERATION_REMOVE_ROOT: {
          // No additional fields other than the operation type,
          // since the root ID is already in the operations array
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

const deconstructedOperationsByPoint = new Map<string, DeconstructedOperationsPieces>();

export function generateTreeResetOpsForPoint(
  executionPoint: ExecutionPoint,
  annotations: ParsedReactDevToolsAnnotation[]
) {
  const rootNodeEvents: RootNodeOperation[] = [];

  const removalOperations: number[][] = [];

  // Find every time that a React root was added or removed
  for (const { point, time, contents } of annotations) {
    if (contents.event !== "operations") {
      continue;
    }

    const { payload } = contents;
    let deconstructedOperations: DeconstructedOperationsPieces;

    // Avoid recalculating these repeatedly
    if (deconstructedOperationsByPoint.has(point)) {
      deconstructedOperations = deconstructedOperationsByPoint.get(point)!;
    } else {
      deconstructedOperations = deconstructOperationsArray(payload);
      deconstructedOperationsByPoint.set(point, deconstructedOperations);
    }

    const { rendererId, rootId, treeOperations: parsedOperations } = deconstructedOperations;

    for (const op of parsedOperations) {
      if (op.type === TREE_OPERATION_ADD && op.contents.nodeType === "root") {
        rootNodeEvents.push({
          type: "root-added",
          rendererId,
          rootId,
          point,
          time,
        });
      } else if (op.type == TREE_OPERATION_REMOVE_ROOT) {
        rootNodeEvents.push({
          type: "root-removed",
          rendererId,
          rootId,
          point,
          time,
        });
      }
    }
  }

  let activeRoots: Map<number, Set<number>> = new Map();

  const rootEventsInTimeframe = rootNodeEvents.filter(({ point }) =>
    isExecutionPointsWithinRange(point, "0", executionPoint)
  );

  for (const rootEvent of rootEventsInTimeframe) {
    const { rendererId, rootId } = rootEvent;

    if (!activeRoots.has(rendererId)) {
      activeRoots.set(rendererId, new Set());
    }

    const activeRootsForRenderer = activeRoots.get(rendererId)!;
    if (rootEvent.type === "root-added") {
      activeRootsForRenderer.add(rootId);
    } else {
      activeRootsForRenderer.delete(rootId);
    }

    // These don't even include a root ID, since it's already in the operations array header
    const removeRootOp: TreeOperationRemoveRoot = {
      type: TREE_OPERATION_REMOVE_ROOT,
      name: "removeRoot",
    };

    // Assume that every nav wipes out the page entirely.
    // TODO [FE-1667] This doesn't deal with iframes yet - not sure how to handle iframe navs?
    for (const [rendererId, activeRootsForRenderer] of activeRoots.entries()) {
      for (const _activeRoot of activeRootsForRenderer) {
        const removalOp = reconstructOperationsArray(rendererId, rootId, [], [removeRootOp]);
        removalOperations.push(removalOp);
      }
    }
  }

  return removalOperations;
}
