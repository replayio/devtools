// Mock out indexedDB
require("fake-indexeddb/auto");

// Code throws if there's no dispatchUrl set
process.env.NEXT_PUBLIC_DISPATCH_URL = "wss://dummy.example.com";

// Stub out Worker
globalThis.Worker = function () {};
