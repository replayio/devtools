// Handling for the mockEnvironment property which is installed on the window object in mock tests.

import { MockedResponse } from "@apollo/client/testing";
import { Page } from "@recordreplay/playwright";
import type { MockEnvironment } from "ui/utils/environment";

declare global {
  interface Window {
    mockEnvironment?: MockEnvironment;
  }
}

export interface MockOptions {
  graphqlMocks: MockedResponse[];
  sessionError?: boolean;
}

interface Error {
  code: number;
  message: string;
}

// This script runs within the browser process.
function doInstall(options: MockOptions) {
  const Errors: Record<string, Error> = {
    MissingDescription: { code: 28, message: "No description added for recording" },
  };

  function makeResult(result: any) {
    return { result };
  }

  function makeError(error: Error) {
    return { error };
  }

  const messageHandlers: Record<string, (arg?: any) => any> = {
    "Recording.getDescription": () => makeError(Errors.MissingDescription),
    "Recording.createSession": () => {
      const sessionId = "mock-test-session";
      if (options.sessionError) {
        setTimeout(() => {
          emitEvent("Recording.sessionError", {
            sessionId,
            code: 1,
            message: "Session died unexpectedly",
          });
        }, 2000);
      }
      return makeResult({ sessionId });
    },
  };

  let receiveMessageCallback: (arg: { data: string }) => unknown;

  function emitEvent(method: string, params: any) {
    const event = { method, params };
    receiveMessageCallback({ data: JSON.stringify(event) });
  }

  window.mockEnvironment = {
    graphqlMocks: options.graphqlMocks,
    setOnSocketMessage(callback: (arg: { data: string }) => unknown) {
      receiveMessageCallback = callback;
    },
    async sendSocketMessage(str: string) {
      const msg = JSON.parse(str);
      if (!messageHandlers[msg.method]) {
        console.error(`Missing mock message handler for ${msg.method}`);
        return new Promise(resolve => {});
      }
      const { result, error } = await messageHandlers[msg.method](msg.params);
      const response = { id: msg.id, result, error };
      receiveMessageCallback({ data: JSON.stringify(response) });
    },
  };
}

export function installMockEnvironment(page: Page, options: MockOptions = { graphqlMocks: [] }) {
  page.evaluate<void, MockOptions>(doInstall, options);
}
