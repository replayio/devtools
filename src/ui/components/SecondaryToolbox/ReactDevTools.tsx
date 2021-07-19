import React from "react";
import { compareNumericStrings } from "protocol/utils";

const {
  createBridge,
  createStore,
  initialize: createDevTools,
} = require("react-devtools-inline/frontend");
import { ThreadFront } from "protocol/thread";
import { ExecutionPoint } from "@recordreplay/protocol";

interface Message {
  point: ExecutionPoint;
  time: number;
  message: any;
}

let bridge: any, store: any, wall: any, DevTools: any;
let rerenderComponentsTab: Function | undefined;
const messages: Message[] = [];
const inspected = new Set();

let isSetup = false;
async function ensureIsSetup() {
  if (isSetup) {
    return;
  }
  isSetup = true;

  await ThreadFront.getAnnotations(({ annotations }) => {
    for (const { point, time, kind, contents } of annotations) {
      const message = JSON.parse(contents);
      messages.push({ point, time, message });
    }
  });
  messages.sort((m1, m2) => compareNumericStrings(m1.point, m2.point));

  onPaused();
  ThreadFront.on("paused", onPaused);
}

function onPaused() {
  InitReactDevTools();

  // HACK TODO This should use a subscription
  if (typeof rerenderComponentsTab === "function") {
    rerenderComponentsTab();
  }
}

function InitReactDevTools() {
  const target = {
    postMessage() {},
  };

  wall = {
    emit() {},
    listen(listener: any) {
      wall._listener = (msg: any) => {
        try {
          listener(msg);
        } catch (err) {
          console.warn("Error in ReactDevTools frontend", err);
        }
      };
    },
    async send(event: any, payload: any) {
      if (event == "inspectElement") {
        if (inspected.has(payload.id) && !payload.path) {
          wall._listener({
            event: "inspectedElement",
            payload: {
              responseID: payload.requestID,
              id: payload.id,
              type: "no-change",
            },
          });
        } else {
          if (!payload.path) {
            inspected.add(payload.id);
          }
          sendRequest(event, payload);
        }
      }
      if (event == "getBridgeProtocol") {
        sendRequest(event, payload);
      }
    },
  };

  bridge = createBridge(target, wall);
  store = createStore(bridge);
  DevTools = createDevTools(target, { bridge, store });
  inspected.clear();

  for (const { message, point } of messages) {
    if (
      message.event === "operations" &&
      compareNumericStrings(point, ThreadFront.currentPoint) <= 0
    ) {
      wall._listener(message);
    }
  }
}

async function sendRequest(event: any, payload: any) {
  const response = await ThreadFront.evaluate(
    0,
    undefined,
    ` __RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__("${event}", ${JSON.stringify(payload)})`
  );
  if (response.returned) {
    const result: any = await response.returned.getJSON();
    wall._listener({ event: result.event, payload: result.data });
    return { event: result.event, payload: result.data };
  }
}

// TODO Pass custom bridge
// TODO Use portal containers for Profiler & Components
export function ReactDevtoolsPanel() {
  const [count, setCount] = React.useState(0);
  ensureIsSetup();

  // HACK TODO This hack handles the fact that DevTools wasn't writen
  // with the expectation that a new Bridge or Store prop would be pasesd
  // and doens't handle that case properly.
  rerenderComponentsTab = () => {
    setCount(count + 1);
  };

  if (!DevTools) {
    return null;
  }

  return (
    <DevTools
      bridge={bridge}
      browserTheme="light"
      enabledInspectedElementContextMenu={false}
      overrideTab="components"
      showTabBar={false}
      store={store}
    />
  );
}
