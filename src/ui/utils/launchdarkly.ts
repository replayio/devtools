import * as LDClient from "launchdarkly-js-client-sdk";
import { UserInfo } from "ui/hooks/users";
import { isDevelopment } from "./environment";

let client: LDClient.LDClient;
let ready = false;
const LD_KEY = isDevelopment() ? "60ca05fb43d6f10d234bb3ce" : "60ca05fb43d6f10d234bb3cf";

function initLaunchDarkly(user?: UserInfo) {
  ready = false;
  client = LDClient.initialize(LD_KEY, {
    key: user ? user.id : "anon",
  });

  client.on("ready", () => {
    ready = true;
  });
}

function getFeatureFlag(name: string, defaultValue: any) {
  if (!ready) {
    return defaultValue;
  }

  return client.variation(name, defaultValue);
}

export { initLaunchDarkly, getFeatureFlag };
