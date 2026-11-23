import { ComponentTreeRoot } from "@replayio/protocol";
import type { Store } from "react-devtools-inline";

import {
  Destroy,
  reactDevToolsBeforeEach,
  verifySerialization,
} from "ui/components/SecondaryToolbox/react-devtools/__tests__/utils";
import {
  deconstructOperationsArray,
  generateComponentTreeOperations,
  generateTreeResetOperations,
} from "ui/components/SecondaryToolbox/react-devtools/rdtProcessing";

interface StoreElement {
  displayName: string | null;
  key: string | null;
  depth: number;
}

const ELEMENT_TYPE_CLASS = 1;
const ELEMENT_TYPE_FUNCTION = 5;
const ELEMENT_TYPE_HOST_COMPONENT = 7;

const roots: ComponentTreeRoot[] = [
  {
    rootId: 100,
    elements: [
      { id: 101, parentId: 100, type: ELEMENT_TYPE_FUNCTION, displayName: "App" },
      { id: 102, parentId: 101, type: ELEMENT_TYPE_CLASS, displayName: "List" },
      { id: 103, parentId: 102, type: ELEMENT_TYPE_FUNCTION, displayName: "Item", key: "a" },
      { id: 104, parentId: 102, type: ELEMENT_TYPE_FUNCTION, displayName: "Item", key: "b" },
    ],
  },
  {
    rootId: 200,
    elements: [
      { id: 201, parentId: 200, type: ELEMENT_TYPE_HOST_COMPONENT, displayName: "div" },
      { id: 202, parentId: 201, type: ELEMENT_TYPE_FUNCTION, displayName: "Item", key: "a" },
    ],
  },
];

describe("generateComponentTreeOperations", () => {
  test("builds one operations array per root with a deduplicated string table", () => {
    const operationsArrays = generateComponentTreeOperations(roots, 1);

    expect(operationsArrays).toHaveLength(2);
    verifySerialization(operationsArrays);

    const [first, second] = operationsArrays.map(deconstructOperationsArray);

    expect(first.rendererId).toBe(1);
    expect(first.rootId).toBe(100);
    expect(first.stringTable).toEqual([null, "App", "List", "Item", "a", "b"]);
    expect(first.treeOperations).toEqual([
      {
        type: 1,
        name: "addRoot",
        nodeId: 100,
        nodeType: 11,
        contents: {
          nodeType: "root",
          isStrictModeCompliant: true,
          profilingFlags: 0,
          supportsStrictMode: false,
          hasOwnerMetadata: false,
        },
      },
      ...[
        [101, ELEMENT_TYPE_FUNCTION, 100, 1, 0],
        [102, ELEMENT_TYPE_CLASS, 101, 2, 0],
        [103, ELEMENT_TYPE_FUNCTION, 102, 3, 4],
        [104, ELEMENT_TYPE_FUNCTION, 102, 3, 5],
      ].map(([nodeId, nodeType, parentId, stringTableIndex, keyStringTableIndex]) => ({
        type: 1,
        name: "addNode",
        nodeId,
        nodeType,
        contents: {
          nodeType: "node",
          parentId,
          ownerId: 0,
          stringTableIndex,
          keyStringTableIndex,
          namePropStringTableIndex: 0,
        },
      })),
    ]);

    // Each root has its own string table
    expect(second.rootId).toBe(200);
    expect(second.stringTable).toEqual([null, "div", "Item", "a"]);
  });

  test("returns no operations when there are no roots", () => {
    expect(generateComponentTreeOperations([], 1)).toEqual([]);
  });

  describe("applied to a React DevTools Store", () => {
    let destroy: Destroy;
    let store: Store;
    let sendOperations: (operationsArrays: number[][]) => void;

    beforeEach(() => {
      const api = reactDevToolsBeforeEach();
      destroy = api.destroy;
      store = api.store;
      sendOperations = operationsArrays => {
        operationsArrays.forEach(payload => api.wall.send("operations", payload));
        jest.runAllTimers();
      };
    });

    afterEach(() => {
      destroy();
    });

    const getElements = () =>
      Array.from({ length: store.numElements }, (_, index) => {
        // @types/react-devtools-inline types this as a DOM Element
        const element = store.getElementAtIndex(index) as unknown as StoreElement;
        return { displayName: element.displayName, key: element.key, depth: element.depth };
      });

    test("builds the tree, and the reset operations empty it again", () => {
      sendOperations(generateComponentTreeOperations(roots, 1));

      expect(store.roots).toEqual([100, 200]);
      expect(getElements()).toEqual([
        { displayName: "App", key: null, depth: 0 },
        { displayName: "List", key: null, depth: 1 },
        { displayName: "Item", key: "a", depth: 2 },
        { displayName: "Item", key: "b", depth: 2 },
        { displayName: "div", key: null, depth: 0 },
        { displayName: "Item", key: "a", depth: 1 },
      ]);

      sendOperations(
        generateTreeResetOperations(
          store as unknown as Parameters<typeof generateTreeResetOperations>[0]
        )
      );

      expect(store.roots).toEqual([]);
      expect(store.numElements).toBe(0);
    });
  });
});
