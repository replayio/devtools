import * as LDClient from "launchdarkly-js-client-sdk";
import { useEffect, useState } from "react";
import { UserInfo } from "ui/hooks/users";

import { isDevelopment } from "./environment";

const DEFAULT_FLAGS = {
  "maintenance-mode": false,
} as const;

let client: LDClient.LDClient;
let resolveReady: (ready: boolean) => void;
const readyPromise = new Promise<boolean>(resolve => {
  resolveReady = resolve;
});
const LD_KEY = isDevelopment() ? "60ca05fb43d6f10d234bb3ce" : "60ca05fb43d6f10d234bb3cf";

function initLaunchDarkly(user?: UserInfo) {
  client = LDClient.initialize(LD_KEY, {
    key: user ? user.id : "anon",
  });

  client.on("ready", () => {
    resolveReady(true);
  });
}

function useLaunchDarkly() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    readyPromise.then(r => setReady(r));
  }, [setReady]);

  function getFeatureFlag<F extends keyof typeof DEFAULT_FLAGS>(name: F): typeof DEFAULT_FLAGS[F] {
    if (!ready) {
      return DEFAULT_FLAGS[name];
    }

    return client.variation(name, DEFAULT_FLAGS[name]);
  }

  return { getFeatureFlag, ready };
}

export { initLaunchDarkly, useLaunchDarkly };
