import { Location, MappedLocation } from "@recordreplay/protocol";

import { defer } from "./utils";

export class MappedLocationCache {
  // Map locations encoded as strings to the corresponding MappedLocations
  private cache = new Map<string, MappedLocation>();

  private runningRequests = new Map<string, Promise<MappedLocation>>();

  async getMappedLocation(location: Location): Promise<MappedLocation> {
    const cacheKey = this.encodeLocation(location);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    if (this.runningRequests.has(cacheKey)) {
      return await this.runningRequests.get(cacheKey)!;
    }

    const { ThreadFront } = await import("./thread");

    if (!ThreadFront.sessionId) {
      return [location];
    }

    const { promise, resolve } = defer<MappedLocation>();
    this.runningRequests.set(cacheKey, promise);
    const { client } = await import("./socket");
    const { mappedLocation } = await client.Debugger.getMappedLocation(
      { location },
      ThreadFront.sessionId!
    );
    await ThreadFront.ensureAllSources();
    ThreadFront.updateMappedLocation(mappedLocation);
    this.runningRequests.delete(cacheKey);
    resolve(mappedLocation);

    this.cache.set(cacheKey, mappedLocation);
    return mappedLocation;
  }

  /**
   * Encode a location as a string for use as a cache key
   */
  private encodeLocation(location: Location): string {
    return `${location.sourceId}|${location.line}|${location.column}`;
  }
}
