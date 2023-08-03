import type { ReactNode } from "react";
import type { Root } from "react-dom/client";

import {
  Destroy,
  GetOperations,
  assertContainsOperationType,
  assertContainsOperationTypes,
  reactDevToolsBeforeEach,
  verifySerialization,
} from "ui/components/SecondaryToolbox/react-devtools/__tests__/utils";

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

  beforeEach(() => {
    ({ destroy, getOperations, root } = reactDevToolsBeforeEach());
  });

  afterEach(() => {
    destroy();
  });

  test("should properly parse and reconstruct an operations array", () => {
    // Mount, re-order, then unmount children
    const operationsArrays = [
      getOperations(() => root.render([<Component key="A" />, <Component key="C" />])),
      getOperations(() => root.render([<Component key="C" />, <Component key="A" />])),
      getOperations(() => root.render([])),
    ];

    assertContainsOperationTypes(operationsArrays, [
      TREE_OPERATION_ADD,
      TREE_OPERATION_REMOVE,
      TREE_OPERATION_REORDER_CHILDREN,
    ]);
    verifySerialization(operationsArrays);
  });

  test("should support warnings", () => {
    const ComponentThatWarns = () => {
      console.warn("This is a warning");
      return null;
    };

    // Duplicate key warning
    const operationsArray = getOperations(() => root.render(<ComponentThatWarns />));

    assertContainsOperationType([operationsArray], TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS);
    verifySerialization([operationsArray]);
  });

  test("should support subtree modes", () => {
    const { StrictMode } = require("react");

    const operationsArray = getOperations(() =>
      root.render(
        <StrictMode>
          <Component />
        </StrictMode>
      )
    );

    assertContainsOperationType([operationsArray], TREE_OPERATION_SET_SUBTREE_MODE);
    verifySerialization([operationsArray]);
  });

  test("should properly parse and reconstruct edge case operations", () => {
    const operationsArray = [
      1, // rendererId
      1, // rootId
      0, // string table (empty)

      TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
      123,

      TREE_OPERATION_REMOVE_ROOT,
    ];

    verifySerialization([operationsArray]);
  });
});
