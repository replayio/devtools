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
    "Debugger.findSources": (params: any, h: MockHandlerHelpers) => {
      h.emitEvent("Debugger.newSource", h.bindings.DefaultSource);
      return h.makeResult({});
    },
    "Session.ensureProcessed": (params: any, h: MockHandlerHelpers) => {
      return h.makeResult({});
    },
    "Session.getBuildId": (params: any, h: MockHandlerHelpers) => {
      return h.makeResult({ buildId: "mock-build-id" });
    },
    "Recording.getDescription": (params: any, h: MockHandlerHelpers) => {
      return h.makeError(h.Errors.MissingDescription);
    },
    "Recording.createSession": (params: any, h: MockHandlerHelpers) => {
      const sessionId = "mock-test-session";
      return h.makeResult({ sessionId });
    },
  };
};
