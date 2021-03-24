import React from "react";

import {
  createBridge,
  createStore,
  initialize as createDevTools,
} from "react-devtools-inline/frontend";
import { ThreadFront } from "protocol/thread";
import { features } from "ui/utils/prefs";

let bridge, store, wall, DevTools;
let currentTime = null;
let rerenderComponentsTab;
const messages = [];

let inspected = new Set();

function InitReactDevTools() {
  if (!features.reactDevtools) {
    return null;
  }

  const target = {
    postMessage() {},
  };

  wall = {
    emit() {},
    listen(listener) {
      wall._listener = listener;
    },
    async send(event, payload) {
      if (event == "inspectElement" && !inspected.has(payload.id)) {
        inspected.add(payload.id);
        console.log(event, payload);
        let safePayload = {
          ...payload,
          path: payload.path || [],
        };
        window.response = await ThreadFront.evaluate(
          0,
          0,
          ` __RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__("${event}", ${JSON.stringify(
            safePayload
          )})`
        );

        const inspectedElement = await response.returned.getJSON();
        wall._listener({ event: "inspectedElement", payload: inspectedElement.data });
      }

      wall._listener({ event, payload });
    },
  };

  bridge = createBridge(target, wall);
  store = createStore(bridge);
  DevTools = createDevTools(target, { bridge, store });
}

const onPaused = data => {
  if (currentTime === data.time) {
    return;
  }

  InitReactDevTools();

  // TODO Use point AND time eventually
  messages
    .filter(({ time }) => time <= data.time)
    .forEach(({ message }) => {
      if (message.event === "operations") {
        wall.send(message.event, message.payload);
      }
    });

  // HACK TODO This should use a subscription
  if (typeof rerenderComponentsTab === "function") {
    rerenderComponentsTab();
  }
};

if (features.reactDevtools) {
  ThreadFront.getAnnotations(({ annotations }) => {
    for (const { point, time, kind, contents } of annotations) {
      const message = JSON.parse(contents);
      messages.push({ point, time, message });
    }
  });

  ThreadFront.on("paused", onPaused);
}

InitReactDevTools();

// TODO Pass custom bridge
// TODO Use portal containers for Profiler & Components
export function ReactDevtoolsPanel() {
  if (!features.reactDevtools) {
    return null;
  }

  const [count, setCount] = React.useState(0);

  // HACK TODO This hack handles the fact that DevTools wasn't writen
  // with the expectation that a new Bridge or Store prop would be pasesd
  // and doens't handle that case properly.
  rerenderComponentsTab = () => {
    setCount(count + 1);
  };

  React.useLayoutEffect(() => () => {
    rerenderComponentsTab = null;
  });

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
