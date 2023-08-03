import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { Store } from "react-devtools-inline";
import type { Root } from "react-dom/client";

import {
  Destroy,
  GetOperations,
  assertContainsOperationType,
  assertContainsOperationTypes,
  reactDevToolsBeforeEach,
  verifySerialization,
} from "ui/components/SecondaryToolbox/react-devtools/__tests__/utils";
import { deconstructOperationsArray } from "ui/components/SecondaryToolbox/react-devtools/rdtProcessing";

import {
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REMOVE_ROOT,
  TREE_OPERATION_REORDER_CHILDREN,
  TREE_OPERATION_SET_SUBTREE_MODE,
  TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
} from "../printOperations";

const Component = ({ children = null }: { children?: ReactNode }) => children as any;

describe("RDT processing", () => {
  let destroy: Destroy;
  let getOperations: GetOperations;
  let root: Root;
  let store: Store;

  beforeEach(() => {
    ({ destroy, getOperations, root, store } = reactDevToolsBeforeEach());
  });

  afterEach(() => {
    destroy();
  });

  test("should properly parse and reconstruct an operations array", () => {
    const operationsArrays = [
      ...getOperations(() => root.render([<Component key="A" />, <Component key="C" />])),
      ...getOperations(() => root.render([<Component key="C" />, <Component key="A" />])),
      ...getOperations(() => root.render([])),
    ];

    assertContainsOperationTypes(operationsArrays, [
      TREE_OPERATION_ADD,
      TREE_OPERATION_REMOVE,
      TREE_OPERATION_REORDER_CHILDREN,
    ]);
    verifySerialization(operationsArrays);
    expect(operationsArrays.map(deconstructOperationsArray)).toMatchInlineSnapshot(`
      Array [
        Object {
          "rendererId": 1,
          "rootId": 1,
          "stringTable": Array [
            null,
            "Component",
            "A",
            "C",
          ],
          "treeOperations": Array [
            Object {
              "contents": Object {
                "hasOwnerMetadata": true,
                "isStrictModeCompliant": false,
                "nodeType": "root",
                "profilingFlags": 3,
                "supportsStrictMode": true,
              },
              "name": "addRoot",
              "nodeId": 1,
              "nodeType": 11,
              "type": 1,
            },
            Object {
              "contents": Object {
                "keyStringTableIndex": 2,
                "nodeType": "node",
                "ownerId": 0,
                "parentId": 1,
                "stringTableIndex": 1,
              },
              "name": "addNode",
              "nodeId": 2,
              "nodeType": 5,
              "type": 1,
            },
            Object {
              "contents": Object {
                "keyStringTableIndex": 3,
                "nodeType": "node",
                "ownerId": 0,
                "parentId": 1,
                "stringTableIndex": 1,
              },
              "name": "addNode",
              "nodeId": 3,
              "nodeType": 5,
              "type": 1,
            },
          ],
        },
        Object {
          "rendererId": 1,
          "rootId": 1,
          "stringTable": Array [
            null,
          ],
          "treeOperations": Array [
            Object {
              "children": Array [
                3,
                2,
              ],
              "name": "reorderChildren",
              "nodeId": 1,
              "type": 3,
            },
          ],
        },
        Object {
          "rendererId": 1,
          "rootId": 1,
          "stringTable": Array [
            null,
          ],
          "treeOperations": Array [
            Object {
              "name": "remove",
              "nodeIds": Array [
                2,
                3,
              ],
              "type": 2,
            },
          ],
        },
      ]
    `);
  });

  test("should support warnings", () => {
    const ComponentThatWarns = () => {
      console.warn("This is a warning");
      return null;
    };

    const operationsArrays = getOperations(() => root.render(<ComponentThatWarns />));

    assertContainsOperationType(operationsArrays, TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS);
    verifySerialization(operationsArrays);
    expect(operationsArrays.map(deconstructOperationsArray)).toMatchInlineSnapshot(`
      Array [
        Object {
          "rendererId": 1,
          "rootId": 1,
          "stringTable": Array [
            null,
            "ComponentThatWarns",
          ],
          "treeOperations": Array [
            Object {
              "contents": Object {
                "hasOwnerMetadata": true,
                "isStrictModeCompliant": false,
                "nodeType": "root",
                "profilingFlags": 3,
                "supportsStrictMode": true,
              },
              "name": "addRoot",
              "nodeId": 1,
              "nodeType": 11,
              "type": 1,
            },
            Object {
              "contents": Object {
                "keyStringTableIndex": 0,
                "nodeType": "node",
                "ownerId": 0,
                "parentId": 1,
                "stringTableIndex": 1,
              },
              "name": "addNode",
              "nodeId": 2,
              "nodeType": 5,
              "type": 1,
            },
            Object {
              "errors": 0,
              "name": "updateErrorsOrWarnings",
              "nodeId": 2,
              "type": 5,
              "warnings": 1,
            },
          ],
        },
      ]
    `);
  });

  test("should support subtree modes", () => {
    const { StrictMode } = require("react");

    const operationsArrays = getOperations(() =>
      root.render(
        <StrictMode>
          <Component />
        </StrictMode>
      )
    );

    assertContainsOperationType(operationsArrays, TREE_OPERATION_SET_SUBTREE_MODE);
    verifySerialization(operationsArrays);
    expect(operationsArrays.map(deconstructOperationsArray)).toMatchInlineSnapshot(`
      Array [
        Object {
          "rendererId": 1,
          "rootId": 1,
          "stringTable": Array [
            null,
            "Component",
          ],
          "treeOperations": Array [
            Object {
              "contents": Object {
                "hasOwnerMetadata": true,
                "isStrictModeCompliant": false,
                "nodeType": "root",
                "profilingFlags": 3,
                "supportsStrictMode": true,
              },
              "name": "addRoot",
              "nodeId": 1,
              "nodeType": 11,
              "type": 1,
            },
            Object {
              "contents": Object {
                "keyStringTableIndex": 0,
                "nodeType": "node",
                "ownerId": 0,
                "parentId": 1,
                "stringTableIndex": 1,
              },
              "name": "addNode",
              "nodeId": 3,
              "nodeType": 5,
              "type": 1,
            },
            Object {
              "mode": 1,
              "name": "setSubtreeMode",
              "rootId": 3,
              "type": 7,
            },
          ],
        },
      ]
    `);
  });

  test("should support profiling duration changes", () => {
    const { Profiler, useState } = require("react");

    let update: Dispatch<SetStateAction<number>>;

    function ComponentThatTakesTimeToRender() {
      const [duration, setDuration] = useState(0);
      update = setDuration;
      jest.advanceTimersByTime(duration);
      return duration;
    }

    getOperations(() => {
      root.render(
        <Profiler id="Profiler">
          <ComponentThatTakesTimeToRender />
        </Profiler>
      );
    });

    const operationsArrays = getOperations(() => {
      store.profilerStore.startProfiling();
      jest.runAllTimers();
      update(200);
    });

    assertContainsOperationType(operationsArrays, TREE_OPERATION_UPDATE_TREE_BASE_DURATION);
    verifySerialization(operationsArrays);
    expect(operationsArrays.map(deconstructOperationsArray)).toMatchInlineSnapshot(`
      Array [
        Object {
          "rendererId": 1,
          "rootId": 1,
          "stringTable": Array [
            null,
          ],
          "treeOperations": Array [
            Object {
              "baseDuration": 200000,
              "id": 3,
              "name": "updateTreeBaseDuration",
              "type": 4,
            },
            Object {
              "baseDuration": 200000,
              "id": 2,
              "name": "updateTreeBaseDuration",
              "type": 4,
            },
            Object {
              "baseDuration": 200000,
              "id": 1,
              "name": "updateTreeBaseDuration",
              "type": 4,
            },
          ],
        },
      ]
    `);
  });

  test("should should roots unmounting when component filters change", () => {
    getOperations(() => {
      root.render(<Component />);
    });

    const operationsArrays = getOperations(() => {
      store.componentFilters = [{} as any];
    });

    assertContainsOperationType(operationsArrays, TREE_OPERATION_REMOVE_ROOT);
    verifySerialization(operationsArrays);
    expect(operationsArrays.map(deconstructOperationsArray)).toMatchInlineSnapshot(`
      Array [
        Object {
          "rendererId": 1,
          "rootId": 1,
          "stringTable": Array [
            null,
          ],
          "treeOperations": Array [
            Object {
              "name": "removeRoot",
              "type": 6,
            },
          ],
        },
        Object {
          "rendererId": 1,
          "rootId": 1,
          "stringTable": Array [
            null,
            "Component",
          ],
          "treeOperations": Array [
            Object {
              "contents": Object {
                "hasOwnerMetadata": true,
                "isStrictModeCompliant": false,
                "nodeType": "root",
                "profilingFlags": 3,
                "supportsStrictMode": true,
              },
              "name": "addRoot",
              "nodeId": 1,
              "nodeType": 11,
              "type": 1,
            },
            Object {
              "contents": Object {
                "keyStringTableIndex": 0,
                "nodeType": "node",
                "ownerId": 0,
                "parentId": 1,
                "stringTableIndex": 1,
              },
              "name": "addNode",
              "nodeId": 2,
              "nodeType": 5,
              "type": 1,
            },
          ],
        },
      ]
    `);
  });
});
