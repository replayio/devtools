import { ThreadFront, ValueFront } from "protocol/thread";
import React from "react";
import { act } from "react-dom/test-utils";
import {
  DEFAULT_SESSION_ID,
  createConsoleMessage,
  createLoadedRegions,
  createSource,
  createValue,
  sendLoadedRegionsToMockEnvironment,
  sendMessageToMockEnvironment,
  sendSourceToMockEnvironment,
  createPointDescription,
} from "test/testFixtureUtils";
import {
  createTestStore,
  filterCommonTestWarnings,
  render as testUtilsRender,
} from "test/testUtils";
import type { UIStore } from "ui/actions";

import useConsoleSearch from "./useConsoleSearch";
import type { Actions, State } from "./useConsoleSearch";

describe("useConsoleSearch", () => {
  filterCommonTestWarnings();

  let lastCommitedSearchActions: Actions | null = null;
  let lastCommitedSearchState: State | null = null;
  let messageIdCounter: number = 0;
  let store: UIStore = null as unknown as UIStore;
  let TestComponent: any;

  beforeEach(() => {
    lastCommitedSearchActions = null;
    lastCommitedSearchState = null;
    messageIdCounter = 0;

    TestComponent = () => {
      const [state, actions] = useConsoleSearch();
      lastCommitedSearchActions = actions;
      lastCommitedSearchState = state;

      return null;
    };
  });

  beforeEach(async () => {
    store = await createTestStore();

    // This is necessary to unblock various event listeners and parsing.
    await ThreadFront.setSessionId(DEFAULT_SESSION_ID);

    sendSourceToMockEnvironment(
      createSource({
        kind: "scriptSource",
      })
    );

    sendMessageToMockEnvironment(
      createConsoleMessage({
        text: "Plain string message",
      })
    );
    sendMessageToMockEnvironment(
      createConsoleMessage({
        argumentValues: [
          createValue({ value: 123 }),
          createValue({ value: "string value" }),
          createValue({ value: true }),
        ],
      })
    );
    sendMessageToMockEnvironment(
      createConsoleMessage({
        text: "Another string message",
      })
    );
    sendMessageToMockEnvironment(
      createConsoleMessage({
        argumentValues: [createValue({ value: "another string value" })],
      })
    );

    sendLoadedRegionsToMockEnvironment(
      createLoadedRegions({
        beginTime: 0,
        endTime: 1000,
      })
    );

    // Give everything time to settle
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it("should search visible Messages", async () => {
    await testUtilsRender(<TestComponent />, { store });

    act(() => {
      lastCommitedSearchActions?.search("message");
    });

    expect(lastCommitedSearchState?.index).toBe(0);
    expect(lastCommitedSearchState?.results.map(result => result.id)).toMatchInlineSnapshot(`
      Array [
        "1",
        "3",
      ]
    `);

    act(() => {
      lastCommitedSearchActions?.search("another");
    });

    expect(lastCommitedSearchState?.index).toBe(0);
    expect(lastCommitedSearchState?.results.map(result => result.id)).toMatchInlineSnapshot(`
      Array [
        "3",
        "4",
      ]
    `);
  });
});
