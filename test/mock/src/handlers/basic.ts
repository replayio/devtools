import { MockHandlerRecord, MockHandlerHelpers } from "../mockEnvironment";

export function basicMessageHandlers(): MockHandlerRecord {
  return {
    "Recording.getDescription": (params: any, h: MockHandlerHelpers) => {
      return h.makeError(h.Errors.MissingDescription);
    },
    "Recording.createSession": (params: any, h: MockHandlerHelpers) => {
      const sessionId = "mock-test-session";
      return h.makeResult({ sessionId });
    },
  };
};
