import { processReduxActions } from "ui/components/SecondaryToolbox/redux-devtools/annotations";

describe("processReduxActions", () => {
  test("maps actions to annotations sorted by point", () => {
    expect(
      processReduxActions([
        {
          point: "200",
          time: 2,
          actionType: "todos/added",
          instanceId: 1,
          connectionType: "redux",
          dispatchPoint: "190",
          shouldIgnoreAction: true,
        },
        {
          point: "100",
          time: 1,
          actionType: "increment",
          instanceId: 2,
          connectionType: "generic",
        },
      ])
    ).toEqual([
      {
        kind: "redux-devtools-data",
        point: "100",
        time: 1,
        event: "action",
        payload: {
          actionType: "increment",
          shouldIgnoreAction: false,
          connectionType: "generic",
          instanceId: 2,
        },
      },
      {
        kind: "redux-devtools-data",
        point: "200",
        time: 2,
        event: "action",
        payload: {
          actionType: "todos/added",
          shouldIgnoreAction: true,
          connectionType: "redux",
          instanceId: 1,
        },
      },
    ]);
  });

  test("sorts points numerically", () => {
    const annotations = processReduxActions(
      ["1000", "999", "10000"].map((point, index) => ({
        point,
        time: index,
        actionType: "a",
        instanceId: 1,
        connectionType: "redux" as const,
      }))
    );
    expect(annotations.map(({ point }) => point)).toEqual(["999", "1000", "10000"]);
  });
});
