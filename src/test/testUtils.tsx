import { readFileSync } from "fs";
import { join } from "path";

import { MockedProvider } from "@apollo/client/testing";
import * as rtl from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import { ThreadFront } from "protocol/thread";
import React, { PropsWithChildren } from "react";
import { Provider } from "react-redux";
import type { UIStore } from "ui/actions";
import { bootstrapStore } from "ui/setup/store";
import setupDevtools from "ui/setup/dynamic/devtools";
import type { UIState } from "ui/state";
import { v4 as uuid } from "uuid";

import {
  createRecordingOwnerUserIdMock,
  createGetRecordingMock,
  createUserSettingsMock,
  createGetUserMock,
} from "../../test/mock/src/graphql";

const recordingId = uuid();
const userId = uuid();
const user = { id: userId, uuid: userId };

// Create common GraphQL mocks, reused from the E2E tests
const graphqlMocks = [
  ...createUserSettingsMock(),
  ...createRecordingOwnerUserIdMock({ recordingId, user }),
  ...createGetRecordingMock({ recordingId }),
  ...createGetUserMock({ user }),
];

const noop = () => false;

export const filterLoggingInTests = (
  conditionFilter: (message: string) => boolean = noop,
  method: keyof Console = "log"
) => {
  // @ts-ignore
  const originalConsoleLog = console[method].bind(console);

  beforeEach(function () {
    // @ts-ignore
    jest.spyOn(console, method).mockImplementation((...args) => {
      const [message = ""] = args;
      if (typeof message !== "string") {
        originalConsoleLog("Message is not a string: ", message);
      } else {
        const shouldSilence = conditionFilter(message);
        if (shouldSilence) {
          return;
        }
      }

      originalConsoleLog(...args);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
};

export async function loadFixtureData(testName: string): Promise<UIStore> {
  const fixtureData = JSON.parse(
    readFileSync(
      join(__dirname, "..", "..", "public", "test", "fixtures", `${testName}.js.json`),
      "utf8"
    )
  );

  const sessionId = fixtureData.find((message: any) => {
    if (message.hasOwnProperty("sessionId")) {
      return message.sessionId;
    }
  });

  if (!sessionId) {
    console.warn("Fixture does not contain a session ID");
  }

  // TODO This is side effectful in a way that affects ThreadFront.setSessionId(); we should clean that up!
  const store = await createTestStore();

  // This is necessary to unblock various event listeners and parsing.
  // Actual session ID value _probably_ doesn't matter here.
  await ThreadFront.setSessionId(sessionId);

  // Initialize state using exported websocket messages,
  // sent through the mock environment straight to socket parsing.
  fixtureData.forEach((message: any) => {
    window.mockEnvironment?.sendSocketMessage(JSON.stringify(message));
  });

  // Give everything time to settle
  await new Promise(resolve => setTimeout(resolve, 100));

  return store;
}

export const filterCommonTestWarnings = () => {
  // Skip LoadedRegions debug messages
  filterLoggingInTests(message => message === "LoadedRegions", "debug");
  // Skip websocket "Socket Open" message
  filterLoggingInTests(
    message =>
      message.includes("Socket Open") || message === "indexed" || message.includes("LoadedRegions")
  );
  filterLoggingInTests(message => message.includes("is of type ValueFront"), "warn");
  // Skip React 18 "stop using ReactDOM.render" message
  filterLoggingInTests(
    message =>
      message.includes("ReactDOM.render is no longer supported") ||
      message.includes("Received unknown message"),
    "error"
  );
};

// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store. For
// future dependencies, such as wanting to test with react-router, you can extend
// this interface to accept a path and route and use those in a <MemoryRouter />
interface ExtendedRenderOptions extends Omit<RenderOptions, "queries"> {
  preloadedState?: Partial<UIState>;
  store?: UIStore;
}

export async function createTestStore(preloadedState: Partial<UIState> = {}) {
  const store = bootstrapStore(preloadedState);
  await setupDevtools(store);

  return store;
}

async function render(
  ui: React.ReactElement,
  { preloadedState = {}, store, ...renderOptions }: ExtendedRenderOptions = {}
) {
  if (!store) {
    // Can't await as a param initializer
    store = await createTestStore(preloadedState);
  }
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return (
      <Provider store={store!}>
        <MockedProvider mocks={graphqlMocks} addTypename={false}>
          {children}
        </MockedProvider>
      </Provider>
    );
  }
  return { store, ...rtl.render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// re-export everything
export * from "@testing-library/react";
// override render method
export { render };
