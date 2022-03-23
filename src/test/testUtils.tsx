import * as rtl from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import React, { PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { v4 as uuid } from "uuid";
import type { UIState } from "ui/state";
import type { UIStore } from "ui/actions";

import { bootstrapStore } from "ui/setup/store";
import setupDevtools from "ui/setup/dynamic/devtools";

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
      const shouldSilence = conditionFilter(message);
      if (shouldSilence) {
        return;
      }

      originalConsoleLog(...args);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
};

export const filterCommonTestWarnings = () => {
  // Skip websocket "Socket Open" message
  filterLoggingInTests(message => message.includes("Socket Open"));
  // Skip React 18 "stop using ReactDOM.render" message
  filterLoggingInTests(
    message => message.includes("ReactDOM.render is no longer supported"),
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
