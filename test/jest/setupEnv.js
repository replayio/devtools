// Mock out indexedDB
require("fake-indexeddb/auto");
require("@testing-library/jest-dom");

import { doInstall } from "../../test/mock/src/mockEnvironment";
import { basicMessageHandlers, basicBindings } from "../../test/mock/src/handlers";

// Code throws if there's no dispatchUrl set
process.env.NEXT_PUBLIC_DISPATCH_URL = "wss://dummy.example.com";

// Stub out Worker
globalThis.Worker = function () {};

// The socket logic determines if it's in a mocked environment based on a "mock"
// query param existing. However, JSDOM doesn't allow manipulating query params.
// Replace `window.location` to fake this: https://stackoverflow.com/a/60697570/62937
delete window.location;
window.location = new URL("http://localhost?mock=true");

// Reuse additional environment handling from the E2E tests
doInstall({
  bindings: basicBindings(),
  messageHandlers: basicMessageHandlers(),
});
