import { unstable_getCacheForType as getCacheForType } from "react";

import { SourceGroups, api } from "../../app/api";
import type { AppStore } from "../../app/store";
import { SourceDetails, openSourceDetails } from "./sourcesSlice";

/*
 * This entire file is _mostly_ WIP PROOF OF CONCEPT!

  I've been staring at Brian's `CommentsCache` and `MessagesCache`
  trying to understand the data flow, and reverse-engineer how to 
  create a valid Suspense cache entry.

  There appear to be two key pieces to know about here:

  - The `unstable_createCacheForType` API, which seems to accept a factory function
    that holds the wrapper for a piece of data (such as a `new Map()`, or an object
    with some field that has the actual value).  Note: per Brian, that's not needed 
    for this cache implementation, since we don't need to invalidate the data later.
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
 */

// We know there's only one cache entry, since it's a "list of things" query.
// Create a selector to read that cache entry from the Redux store.
const selectGetSourcesEntry = api.endpoints.getSources.select();

// Use module-scoped variables for the cache, since this is a one-shot retrieval
let hasPromiseListenerBeenAttached = false;
let sourceDetails: SourceDetails[] | null = null;

export function getSourceDetails(store: AppStore): SourceDetails[] {
  if (sourceDetails !== null) {
    return sourceDetails;
  }

  let sourcesEntry: ReturnType<typeof selectGetSourcesEntry> | undefined = selectGetSourcesEntry(
    store.getState()
  );

  if (!sourcesEntry || sourcesEntry.isUninitialized) {
    store.dispatch(api.endpoints.getSources.initiate());
    sourcesEntry = selectGetSourcesEntry(store.getState());
  }

  const promise = api.util.getRunningOperationPromise("getSources", undefined)!;

  if (!hasPromiseListenerBeenAttached) {
    hasPromiseListenerBeenAttached = true;
    promise.then(result => {
      sourceDetails = openSourceDetails(store.getState());
    });
  }

  throw promise;
}
