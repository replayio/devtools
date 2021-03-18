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

function InitReactDevTools() {
  if (!features.reactDevtools) {
    return null;
  }

  const target = {
    postMessage: function () {},
  };

  wall = {
    emit({ data }) {},
    listen(listener) {
      wall._listener = listener;
    },
    send(event, payload, transferable) {
      wall._listener({ event, payload });
    },
  };

  bridge = createBridge(target, wall);
  store = createStore(bridge);
  DevTools = createDevTools(target, { bridge, store });
}

InitReactDevTools();

ThreadFront.getAnnotations(({ annotations }) => {
  for (const { point, time, kind, contents } of annotations) {
    const message = JSON.parse(contents);
    messages.push({ point, time, message });
  }
});

ThreadFront.on("paused", data => {
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
});

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
