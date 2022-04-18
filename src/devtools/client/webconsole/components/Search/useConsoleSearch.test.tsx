import React from "react";
import { act } from "react-dom/test-utils";
import {
  createTestStore,
  filterCommonTestWarnings,
  render as testUtilsRender,
} from "test/testUtils";
import useConsoleSearch from "./useConsoleSearch";
import { Message } from "../../reducers/messages";

import type { Actions, State } from "./useConsoleSearch";
import type { UIStore } from "ui/actions";
import { ValueFront } from "protocol/thread";
import { UIState } from "ui/state";

describe("useConsoleSearch", () => {
  filterCommonTestWarnings();

  let lastCommitedSearchActions: Actions | null = null;
  let lastCommitedSearchState: State | null = null;
  let messageIdCounter: number = 0;
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

  // TODO [bvaughn] This is pretty gross; can we collocate this (closer to the Redux code if nothing else)?
  function createMessage(
    type: string,
    messageText: string,
    parameters: ValueFront[] = []
  ): Message {
    return {
      allowRepeating: false,
      category: null,
      errorMessageName: null,
      exceptionDocURL: null,
      executionPoint: null,
      executionHasFrames: false,
      executionPointTime: 1,
      groupId: null,
      id: `${messageIdCounter++}`,
      indent: 0,
      innerWindowID: null,
      level: "",
      messageText,
      notes: null,
      parameters,
      pauseId: "",
      repeatId: null,
      source: "",
      stacktrace: [],
      type,
      lastExecutionPoint: {
        point: "1",
        time: 1,
        messageCount: 0,
      },
    };
  }

  function createValueFront(value: any): ValueFront {
    return new ValueFront(null, { value });
  }

  async function createStore(messages: Message[] = []): Promise<UIStore> {
    const messageIDs = messages.map(message => message.id);
    const idToMessageMap = messages.reduce((map, message) => {
      return {
        ...map,
        [message.id]: message,
      };
    }, {});

    const defaultState = (await createTestStore()).getState();

    return createTestStore({
      ...defaultState,
      app: {
        ...defaultState.app,
        loadedRegions: {
          indexed: [],
          loaded: [
            {
              begin: {
                point: "0",
                time: 0,
              },
              end: {
                point: "1000",
                time: 1000,
              },
            },
          ],
          loading: [],
        },
      },
      messages: {
        ...defaultState.messages,
        messages: {
          ids: messageIDs,
          entities: idToMessageMap,
        },
        visibleMessages: messageIDs,
      },
    });
  }

  async function render(store?: UIStore) {
    if (!store) {
      store = await createStore([
        createMessage("logPoint", "Plain string message"),
        createMessage("logPoint", "", [
          createValueFront(123),
          createValueFront("string value"),
          createValueFront(true),
        ]),
        createMessage("logPoint", "Another string message"),
        createMessage("logPoint", "", [createValueFront("another string value")]),
      ]);
    }

    await testUtilsRender(<TestComponent />, { store });
  }

  it("should search visible Messages", async () => {
    await render();

    console.log('search => "message"');
    act(() => {
      lastCommitedSearchActions?.search("message");
    });

    expect(lastCommitedSearchState?.index).toBe(0);
    expect(lastCommitedSearchState?.results.map(result => result.id)).toMatchInlineSnapshot(`
      Array [
        "0",
        "2",
      ]
    `);

    console.log('search => "another"');
    act(() => {
      lastCommitedSearchActions?.search("another");
    });

    expect(lastCommitedSearchState?.index).toBe(0);
    expect(lastCommitedSearchState?.results.map(result => result.id)).toMatchInlineSnapshot(`
      Array [
        "2",
        "3",
      ]
    `);
  });
});
