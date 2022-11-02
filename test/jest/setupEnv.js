// Mock out indexedDB
require("fake-indexeddb/auto");
require("@testing-library/jest-dom");

import { basicBindings, basicMessageHandlers } from "../../test/mock/src/handlers";
import { installMockEnvironment } from "../../test/mock/src/mockEnvironment";

// Code throws if there's no dispatchUrl set
process.env.NEXT_PUBLIC_DISPATCH_URL = "wss://dummy.example.com";

// Stub out Worker
globalThis.Worker = function () {};

// The socket logic determines if it's in a mocked environment based on a "mock" query param existing.
// However, JSDOM doesn't allow manipulating query params.
// Replace `window.location` to fake this: https://stackoverflow.com/a/60697570/62937
delete window.location;
window.location = new URL("http://localhost?mock=true");

// Reuse additional environment handling from the E2E tests
installMockEnvironment({
  bindings: basicBindings(),
  messageHandlers: basicMessageHandlers(),
});

delete window.performance;
window.performance = {
  mark: () => {},
  measure: () => {},
  getEntriesByName: () => [],
  getEntriesByType: () => [],
};

Object.defineProperty(window, "matchMedia", {
  value: jest.fn().mockImplementation(query => ({
    // Deprecated
    addEventListener: jest.fn(),

    addListener: jest.fn(),

    dispatchEvent: jest.fn(),

    matches: false,

    media: query,

    onchange: null,

    removeEventListener: jest.fn(),
    // Deprecated
    removeListener: jest.fn(),
  })),
  writable: true,
});
