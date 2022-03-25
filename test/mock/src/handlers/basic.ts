import { MockHandlerRecord, MockHandlerHelpers } from "../mockEnvironment";

export function basicBindings() {
  return {
    DefaultSource: {
      sourceId: "mock-source",
      kind: "scriptSource",
      url: "https://mock.test/source.js",
    },
    endpoint: {
      point: "100000",
      time: 100000,
    },
  };
}

export function basicMessageHandlers(): MockHandlerRecord {
  return {
    "Console.findMessages": arg => ({}),
    "Debugger.findSources": (params: any, h: MockHandlerHelpers) => {
      h.emitEvent("Debugger.newSource", h.bindings.DefaultSource);
      return {};
    },
    "Debugger.newSource": (params: any, h: MockHandlerHelpers) => {
      h.emitEvent("Debugger.newSource", params);
      return {};
    },
    "Graphics.findPaints": () => ({}),
    "Graphics.getDevicePixelRatio": () => ({ ratio: 1 }),
    "Graphics.getPlaybackVideo": () => ({}),
    "Recording.getDescription": (params: any, h: MockHandlerHelpers) => {
      throw h.Errors.MissingDescription;
    },
    "Recording.createSession": () => ({ sessionId: "mock-test-session" }),
    "Session.ensureProcessed": () => ({}),
    "Session.findMouseEvents": () => ({}),
    "Session.getBuildId": () => ({ buildId: "mock-build-id" }),
    "Session.getEndpoint": (params: any, h: MockHandlerHelpers) => ({
      endpoint: h.bindings.endpoint,
    }),
    "Session.loadedRegions": (params: any, h: MockHandlerHelpers) => {
      // console.log("Loaded regions args: ", ...args);
      h.emitEvent("Session.loadedRegions", params);
      return new Promise(resolve => {});
    },
    "Console.newMessage": (params: any, h: MockHandlerHelpers) => {
      h.emitEvent("Console.newMessage", params);
      return new Promise(resolve => {});
    },
    "Session.listenForLoadChanges": (params: any, h: MockHandlerHelpers) => {
      h.emitEvent("Session.loadedRegions", {
        loaded: [
          {
            begin: { point: "0", time: 0 },
            end: h.bindings.endpoint,
          },
        ],
        loading: [
          {
            begin: { point: "0", time: 0 },
            end: h.bindings.endpoint,
          },
        ],
      });
      return new Promise(resolve => {});
    },
  };
}
