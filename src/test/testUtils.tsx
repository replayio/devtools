import { MockedProvider } from "@apollo/client/testing";
import * as rtl from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import { ThreadFront } from "protocol/thread";
import React, { PropsWithChildren } from "react";
import { act } from "react-dom/test-utils";
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
  ...createGetRecordingMock({ recordingId, user }),
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
  graphqlMocks?: any[];
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
  {
    graphqlMocks: graphqlMockOverrides,
    preloadedState = {},
    store,
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  if (!store) {
    // Can't await as a param initializer
    store = await createTestStore(preloadedState);
  }

  const mocks = graphqlMockOverrides || graphqlMocks;

  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return (
      <Provider store={store!}>
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      </Provider>
    );
  }

  const rtlData = rtl.render(ui, { wrapper: Wrapper, ...renderOptions });

  // Give the Apollo client time to load and resolve its requests.
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  return { store, ...rtlData };
}

// re-export everything
export * from "@testing-library/react";
// override render method
export { render };
