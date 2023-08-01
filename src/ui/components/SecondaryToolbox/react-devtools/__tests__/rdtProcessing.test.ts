/* Copyright 2023 Record Replay Inc. */

// React DevTools routine result processing logic tests

import { NavigationEvent as ReplayNavigationEvent } from "@replayio/protocol";

import {
  ElementTypeFunction,
  ElementTypeRoot,
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REMOVE_ROOT,
  TREE_OPERATION_REORDER_CHILDREN,
  TREE_OPERATION_SET_SUBTREE_MODE,
  TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
} from "../printOperations";
import {
  DeconstructedOperationsPieces,
  OperationsInfo,
  ParsedReactDevtoolsTreeOperations,
  deconstructOperationsArray,
  reconstructOperationsArray,
} from "../rdtProcessing";

/*
  Example component tree we'll construct:
  [root (2)]
    <A1 (3) >
      <B2 (4) >
    <C3 (5)
      <D4 (6) >
      <E5 (7) >
*/
const exampleOperationsArray = [
  // rendererId
  1,
  // rootId
  2,
  // string table index length (7 items, each 1 length + 2 chars)
  21,
  // item 1 length
  2,
  // UTF-8 char codes: "A1"
  65,
  49,
  // item 2 length
  2,
  // UTF-8 char codes: "B2"
  66,
  50,
  // item 3 length
  2,
  // UTF-8 char codes: "C3"
  67,
  51,
  // item 4 length
  2,
  // UTF-8 char codes: "D4"
  68,
  52,
  // item 5 length
  2,
  // UTF-8 char codes: "E5"
  69,
  53,
  // item 6 length
  2,
  // UTF-8 char codes: "k1",
  107,
  49,
  // item 7 length
  2,
  // UTF-8 char codes: "k2"
  107,
  50,
  // Operation 1: Add root, id 2
  TREE_OPERATION_ADD,
  2,
  // Type of this node (root, function, class, memo, etc)
  ElementTypeRoot,
  // Strict mode compliant: false
  0,
  // supports profiling: false
  0,
  // supports strict mode: true
  1,
  // has owner metadata: true
  1,
  // Operation 2: Add standard node A1, id 3
  TREE_OPERATION_ADD,
  3,
  ElementTypeFunction,
  // parentId: root (2)
  2,
  // ownerID: root (2)
  2,
  // string table index for "A1" (index 0 is `null`)
  1,
  // key string table index (index 0 is `null`)
  0,
  // Operation 3: Add standard node B2, id 4
  TREE_OPERATION_ADD,
  4,
  ElementTypeFunction,
  // parentId: A1 (3)
  3,
  // ownerID: root (2)
  2,
  // string table index for "B2"
  2,
  // key string table index
  0,
  // Operation 4: Add standard node C3, id 5
  TREE_OPERATION_ADD,
  5,
  ElementTypeFunction,
  // parentId: root (2)
  2,
  // ownerID: root (2)
  2,
  // string table index for "C3"
  3,
  // key string table index
  0,
  // Operation 5: Add standard node D4, id 6
  TREE_OPERATION_ADD,
  6,
  ElementTypeFunction,
  // parentId: C3 (5)
  5,
  // ownerID: C3 (5)
  5,
  // string table index for "D4"
  4,
  // key string table index for "k1"
  6,
  // Operation 6: Add standard node E5, id 7
  TREE_OPERATION_ADD,
  7,
  ElementTypeFunction,
  // parentId: C3 (5)
  5,
  // ownerID: C3 (5)
  5,
  // string table index for "E5"
  5,
  // key string table index for "k2"
  7,
  // Operation 7: add errors/warnings to D4 (6)
  TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS,
  6,
  // error count: 1
  1,
  // warning count: 2
  2,
  // Operation 8: reorder E5, D4, children of C3 (5)
  TREE_OPERATION_REORDER_CHILDREN,
  5,
  // number of children: 2
  2,
  // child IDs: E5 (7), D4 (6)
  7,
  6,
  // Operation 9: set subtree mode
  TREE_OPERATION_SET_SUBTREE_MODE,
  // rootId
  2,
  // mode: StrictMode (not that it matters here)
  1,
  // Operation 10: update tree base duration
  // this is almost never going to get used, but let's be complete
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
  // nodeId: C3 (5)
  5,
  // tree base duration: 1234
  1234,
  // Operation 11: remove B2 (4) and A1 (3)
  TREE_OPERATION_REMOVE,
  // number of nodes to remove
  2,
  // node IDs to remove: B2 (4), A1 (3), normally bottom-up
  4,
  3,
  // Operation 12: remove root (2)
  TREE_OPERATION_REMOVE_ROOT,
  // No root ID specified - that was implicit because we specified
  // the root ID for these ops as the second array index
];

// This should exactly correspond to the numeric array above
const expectedTreeOperations: ParsedReactDevtoolsTreeOperations[] = [
  {
    type: TREE_OPERATION_ADD,
    name: "addRoot",
    nodeId: 2,
    nodeType: ElementTypeRoot,
    contents: {
      nodeType: "root",
      isStrictModeCompliant: false,
      supportsProfiling: false,
      supportsStrictMode: true,
      hasOwnerMetadata: true,
    },
  },
  {
    type: TREE_OPERATION_ADD,
    name: "addNode",
    nodeId: 3,
    nodeType: ElementTypeFunction,
    contents: {
      nodeType: "node",
      parentId: 2,
      ownerId: 2,
      stringTableIndex: 1,
      keyStringTableIndex: 0,
    },
  },
  {
    type: TREE_OPERATION_ADD,
    name: "addNode",
    nodeId: 4,
    nodeType: ElementTypeFunction,
    contents: {
      nodeType: "node",
      parentId: 3,
      ownerId: 2,
      stringTableIndex: 2,
      keyStringTableIndex: 0,
    },
  },
  {
    type: TREE_OPERATION_ADD,
    name: "addNode",
    nodeId: 5,
    nodeType: ElementTypeFunction,
    contents: {
      nodeType: "node",
      parentId: 2,
      ownerId: 2,
      stringTableIndex: 3,
      keyStringTableIndex: 0,
    },
  },
  {
    type: TREE_OPERATION_ADD,
    name: "addNode",
    nodeId: 6,
    nodeType: ElementTypeFunction,
    contents: {
      nodeType: "node",
      parentId: 5,
      ownerId: 5,
      stringTableIndex: 4,
      keyStringTableIndex: 6,
    },
  },
  {
    type: TREE_OPERATION_ADD,
    name: "addNode",
    nodeId: 7,
    nodeType: ElementTypeFunction,
    contents: {
      nodeType: "node",
      parentId: 5,
      ownerId: 5,
      stringTableIndex: 5,
      keyStringTableIndex: 7,
    },
  },
  {
    type: TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS,
    name: "updateErrorsOrWarnings",
    nodeId: 6,
    errors: 1,
    warnings: 2,
  },
  {
    type: TREE_OPERATION_REORDER_CHILDREN,
    name: "reorderChildren",
    nodeId: 5,
    children: [7, 6],
  },
  {
    type: TREE_OPERATION_SET_SUBTREE_MODE,
    name: "setSubtreeMode",
    rootId: 2,
    mode: 1,
  },
  {
    type: TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
    name: "updateTreeBaseDuration",
    id: 5,
    baseDuration: 1234,
  },
  {
    type: TREE_OPERATION_REMOVE,
    name: "remove",
    nodeIds: [4, 3],
  },
  {
    type: TREE_OPERATION_REMOVE_ROOT,
    name: "removeRoot",
  },
];

// Should be the same contents as the numeric array above
const deconstructedOps: DeconstructedOperationsPieces = {
  rendererId: 1,
  rootId: 2,
  // Null always goes at index 0
  stringTable: [null as any, "A1", "B2", "C3", "D4", "E5", "k1", "k2"],
  treeOperations: expectedTreeOperations,
};

describe("deconstructOperationsArray", () => {
  test("Should properly parse an operations array", () => {
    // This also tests `utfDecodeString` and `parseOperationsArray`
    const result = deconstructOperationsArray(exampleOperationsArray);

    expect(result).toEqual(deconstructedOps);
  });
});

describe("reconstructOperationsArray", () => {
  test("Should properly reconstruct an operations array", () => {
    // This also tests `utfEncodeString`
    const result = reconstructOperationsArray(deconstructedOps);

    expect(result).toEqual(exampleOperationsArray);
  });
});
