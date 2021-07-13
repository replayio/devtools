// Handling for the mockEnvironment property which is installed on the window object in mock tests.

import { MockedResponse } from "@apollo/client/testing";
import { Page } from "@recordreplay/playwright";
import type { MockEnvironment } from "ui/utils/environment";

declare global {
  interface Window {
    mockEnvironment?: MockEnvironment;
  }
}

export interface MockHandlerHelpers {
  Errors: Record<string, Error>;
  makeResult: (result: any) => any;
  makeError: (error: Error) => any;
  emitEvent: (method: string, params: any) => void;
  bindings: Record<string, any>;
};

type MockHandler = (params: any, helpers: MockHandlerHelpers) => any;
export type MockHandlerRecord = Record<string, MockHandler>;

interface MockOptions {
  graphqlMocks: MockedResponse[];
  messageHandlers: MockHandlerRecord;
  bindings: Record<string, any>;
}

interface MockOptionsJSON {
  graphqlMocks: MockedResponse[];
  messageHandlers: Record<string, string>;
  bindings: Record<string, any>;
}

export interface Error {
  code: number;
  message: string;
}

// This script runs within the browser process.
function doInstall(options: MockOptionsJSON) {
  function setImmediate(callback: () => void) {
    setTimeout(callback, 0);
  }

  const helpers = {
    Errors: {
      MissingDescription: { code: 28, message: "No description added for recording" },
    },
    makeResult(result: any) {
      return { result };
    },
    makeError(error: Error) {
      return { error };
    },
    emitEvent(method: string, params: any) {
      setImmediate(() => {
        const event = { method, params };
        receiveMessageCallback({ data: JSON.stringify(event) });
      });
    },
    bindings: options.bindings,
  };

  const messageHandlers: Record<string, MockHandler> = {};

  // We manually iterate the keys here to avoid typescript transformations which
  // won't work after evaluating this in the browser content process.
  const keys = Object.keys(options.messageHandlers);
  for (let i = 0; i < keys.length; i++) {
    const name = keys[i];
    eval(`messageHandlers["${name}"] = ${options.messageHandlers[name]};`);
  }

  let receiveMessageCallback: (arg: { data: string }) => unknown;

  window.mockEnvironment = {
    graphqlMocks: options.graphqlMocks,
    setOnSocketMessage(callback: (arg: { data: string }) => unknown) {
      receiveMessageCallback = callback;
    },
    sendSocketMessage(str: string) {
      const msg = JSON.parse(str);
      if (!messageHandlers[msg.method]) {
        console.error(`Missing mock message handler for ${msg.method}`);
        return;
      }
      const { result, error } = messageHandlers[msg.method](msg.params, helpers);
      const response = { id: msg.id, result, error };
      setImmediate(() => receiveMessageCallback({ data: JSON.stringify(response) }));
    },
  };
}

export async function installMockEnvironment(page: Page, options: MockOptions) {
  const optionsJSON: MockOptionsJSON = {
    graphqlMocks: options.graphqlMocks,
    messageHandlers: {},
    bindings: options.bindings,
  };
  for (const name of Object.keys(options.messageHandlers)) {
    optionsJSON.messageHandlers[name] = options.messageHandlers[name].toString();
  }
  try {
    await page.evaluate<void, MockOptionsJSON>(doInstall, optionsJSON);
  } catch (e) {
    console.log("ERROR", e);
  }
}
