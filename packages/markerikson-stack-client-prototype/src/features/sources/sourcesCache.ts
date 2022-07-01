import { unstable_getCacheForType as getCacheForType } from "react";
import type { AppStore } from "../../app/store";

import { api, SourceGroups } from "../../app/api";

/*
 * This entire file is ENTIRELY WIP PROOF OF CONCEPT!

  I've been staring at Brian's `CommentsCache` and `MessagesCache`
  trying to understand the data flow, and reverse-engineer how to 
  create a valid Suspense cache entry.

  There appear to be two key pieces to know about here:

  - The `unstable_createCacheForType` API, which seems to accept a factory function
    that holds the wrapper for a piece of data (such as a `new Map()`, or an object
    with some field that has the actual value)
  - React's undocumented but semi-known "throw a promise" mechanism, where we throw
    a consistent promise reference if the data isn't yet available.  
    (Note: the promise throwing behavior may still be subject to change? per Dan, 
      https://github.com/facebook/react/issues/22964#issuecomment-1113649154 )

  Brian's example uses synchronous "wakeables" - a plain JS object
  with a `.then` method, plus `.resolve/reject` methods, and is doing
  manual "pending/resolved" tracking.  This is apparently to avoid the
  overhead of promises and microtasks.

  RTKQ recently added a `getRunningOperationPromise` method, which returns
  a consistent promise reference _if_ there's a request in flight for that
  particular endpoint+args combination.  So, we can use that as the thrown promise.

  I've copy-pasted some of the boolean flag derivation logic from the guts of
  RTKQ to help figure out if the RTKQ cache entry has data available or not.
 */

let store: AppStore;

export const setStore = (_store: AppStore) => {
  store = _store;
};

// Placeholder for the result given to React's Suspense Cache
interface SourceGroupsResult {
  groups: SourceGroups | null;
}

// We know there's only one cache entry, since it's a "list of things" query.
// Create a selector to read that cache entry from the Redux store.
const selectSourceGroupsEntry = api.endpoints.getSources.select();

function createSourceGroupsRecord(): SourceGroupsResult {
  return {
    groups: null,
  };
}

export function getSourceGroups(): SourceGroups {
  // Create or read the cache for this section of the UI (????)
  const sourceGroupsRecord = getCacheForType(createSourceGroupsRecord);

  // Do we have this data already cached? If so, return it
  if (sourceGroupsRecord.groups !== null) {
    console.log("Found existing cached sources data, returning");
    return sourceGroupsRecord.groups;
  }

  // RTKQ side: have we ever tried to request this data?
  let sourcesEntry: ReturnType<typeof selectSourceGroupsEntry> | undefined =
    selectSourceGroupsEntry(store.getState());

  if (!sourcesEntry || sourcesEntry.isUninitialized) {
    console.log("No RTKQ entry found, initiating request");
    // If not, actually start fetching
    store.dispatch(api.endpoints.getSources.initiate());

    // Now we've got an entry in the store
    sourcesEntry = selectSourceGroupsEntry(store.getState());
  }

  //Copy-pasted from the guts of RTKQ's `buildHooks.ts`,
  // since this is derived state

  // data is the last known good request result we have tracked - or if none has been tracked yet the last good result for the current args
  let data = sourcesEntry!.data;

  const hasData = data !== undefined;

  // isFetching = true any time a request is in flight
  const isFetching = sourcesEntry!.isLoading;
  // isLoading = true only when loading while no data is present yet (initial load with no data in the cache)
  const isLoading = !hasData && isFetching;
  // isSuccess = true when data is present
  const isSuccess = sourcesEntry!.isSuccess || (isFetching && hasData);

  if (isFetching || sourcesEntry!.isUninitialized) {
    console.log("Getting API promise and throwing");
    const promise = api.util.getRunningOperationPromise("getSources", undefined)!;
    promise.then(result => {
      // TODO What about timing? Will this happen _after_ React re-renders?
      // _Looks_ like this runs first, possibly because we add a `.then` right now
      // before React has a chance to add one, and those run in order added.
      console.log("Data received, updating sources record");
      sourceGroupsRecord.groups = result.data as SourceGroups;
    });

    // Let React know the data isn't available yet
    throw promise;
  } else if (isSuccess) {
    // This mutation might be redundant, but shouldn't hurt.
    sourceGroupsRecord!.groups = data!;
    console.log("Returning existing successful data");
    return data!;
  } else {
    // TODO How do caches handle errors?
    console.error("Unexpected error reading a cache entry!");
    throw new Error("Unexpected error reading a cache entry!");
  }
}
