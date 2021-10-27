import { isDevelopment } from "./environment";

const productionDispatchUrl = "wss://dispatch.replay.io";
const productionApiUrl = "https://api.replay.io/v1/graphql";

export function dispatchUrl(): string {
  if (!isDevelopment()) {
    return productionDispatchUrl;
  }

  const url = new URL(window.location.href);
  return url.searchParams.get("dispatch") || productionDispatchUrl;
}

export function apiUrl(): string {
  if (!isDevelopment()) {
    return productionApiUrl;
  }

  const url = new URL(window.location.href);
  return url.searchParams.get("api") || productionApiUrl;
}
