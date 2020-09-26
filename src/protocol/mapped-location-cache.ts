const { client } = require("./socket");
const { defer } = require("./utils");
import { Location, MappedLocation } from "record-replay-protocol/js/protocol";

export class MappedLocationCache {
  // Map locations encoded as strings to the corresponding MappedLocations
  private cache = new Map<string, MappedLocation>();

  private runningRequests = new Map<string, Promise<MappedLocation>>();

  sessionId: string | undefined;

  async getMappedLocation(location: Location): Promise<MappedLocation> {

    const cacheKey = this.encodeLocation(location);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    if (this.runningRequests.has(cacheKey)) {
      return await this.runningRequests.get(cacheKey)!;
    }

    if (!this.sessionId) {
      return [ location ];
    }

    const { promise, resolve } = defer();
    this.runningRequests.set(cacheKey, promise);
    const { mappedLocation } = await client.Debugger.getMappedLocation(
      { location }, this.sessionId
    );
    this.runningRequests.delete(cacheKey);
    resolve(mappedLocation);

    this.cache.set(cacheKey, mappedLocation);
    return mappedLocation;
  }

  /**
   * Encode a location as a string for use as a cache key
   */
  private encodeLocation(location: Location): string {
    return `${location.scriptId}|${location.line}|${location.column}`;
  }
}
