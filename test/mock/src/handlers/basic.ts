import { MockHandlerRecord, MockHandlerHelpers } from "../mockEnvironment";

export function basicBindings() {
  return {
    DefaultSource: {
      sourceId: "mock-source",
      kind: "scriptSource",
      url: "https://mock.test/source.js",
    },
  };
}

export function basicMessageHandlers(): MockHandlerRecord {
  return {
    "Console.findMessages": () => ({}),
    "Debugger.findSources": (params: any, h: MockHandlerHelpers) => {
      h.emitEvent("Debugger.newSource", h.bindings.DefaultSource);
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
    "Session.getEndpoint": () => ({
      endpoint: {
        point: "1000",
        time: 1000,
      },
    }),
    "Session.listenForLoadChanges": () => new Promise(resolve => {}),
  };
};
