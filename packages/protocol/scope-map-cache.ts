import { Location } from "@replayio/protocol";

import { ThreadFront } from "./thread/thread";
import { defer } from "./utils";

export default class ScopeMapCache {
  private cache = new Map<string, Promise<Record<string, string>>>();

  getScopeMap(location: Location): Promise<Record<string, string>> {
    const cacheKey = `${location.sourceId}:${location.line}:${location.column}`;
    let promise = this.cache.get(cacheKey);
    if (!promise) {
      promise = (async () => {
        const { client } = await import("./socket");
        const { map } = await client.Debugger.getScopeMap({ location }, ThreadFront.sessionId!);
        return map ? Object.fromEntries(map) : {};
      })();
      this.cache.set(cacheKey, promise);
    }
    return promise;
  }
}
