import type { RenderOptions } from "@testing-library/react";
import * as rtl from "@testing-library/react";
import React, { PropsWithChildren } from "react";
import { act } from "react-dom/test-utils";
import { Provider } from "react-redux";

import { createMockReplayClient } from "replay-next/src/utils/testing";
import type { UIStore } from "ui/actions";
import setupDevtools from "ui/setup/dynamic/devtools";
import { bootstrapStore } from "ui/setup/store";
import type { UIState } from "ui/state";

const noop = () => false;

export const filterLoggingInTests = (
  conditionFilter: (message: string) => boolean = noop,
  method: keyof Console = "log"
) => {
  // @ts-ignore
  const originalConsoleLog = console[method].bind(console);

  beforeEach(function () {
    // @ts-ignore
    jest.spyOn(console, method).mockImplementation((...args: any[]) => {
      const arg = args[0];

      let messageString: string | null = null;
      if (typeof arg === "string") {
        messageString = arg;
      } else if (arg != null && typeof arg === "object" && arg.message) {
        messageString = arg.message;
      } else {
        try {
          messageString = JSON.stringify(arg);
        } catch (error) {}
      }

      const shouldSilence = messageString != null && conditionFilter(messageString);
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
  // Filter all console.debug logs; they're noisy
  filterLoggingInTests(() => true, "debug");

  // Skip websocket "Socket Open" message
  filterLoggingInTests(
    message =>
      message.includes("Socket Open") || message === "indexed" || message.includes("LoadedRegions")
  );

  filterLoggingInTests(
    message =>
      // Skip React 18 "stop using ReactDOM.render" message
      message.includes("ReactDOM.render is no longer supported") ||
      message.includes("Received unknown message") ||
      // Skip JSDom package warnings
      message.includes("HTMLCanvasElement.prototype.getContext"),
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
  window.hasAlreadyBootstrapped = false;
  const store = bootstrapStore(preloadedState);
  await setupDevtools(store, createMockReplayClient());

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
    return <Provider store={store!}>{children}</Provider>;
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
