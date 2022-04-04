/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { strictEqual, shallowEqual, ComparisonFunction } from "./compare";
import { EmptyObject, BaseResource, ResourceState } from "./core";

/**
 * A query 'cache' function that uses the identity of the arguments object to
 * cache data for the query itself.
 */
export function queryCacheWeak<T extends BaseResource, Result extends CacheResult>(
  handler: CacheHandler<T, Result>
) {
  const cache = new WeakMap();
  return makeCacheFunction({
    handler,
    // The WeakMap will only return entries for the exact object,
    // so there is no need to compare at all.
    compareArgs: () => true,
    // @ts-ignore
    getEntry: args => cache.get(args) || null,
    setEntry: (args, entry) => {
      // @ts-ignore
      cache.set(args, entry);
    },
  });
}

/**
 * A query 'cache' function that uses shallow comparison to cache the most
 * recent calculated result based on the value of the argument.
 */
export function queryCacheShallow<T extends BaseResource, Result extends CacheResult>(
  handler: CacheHandler<T, Result>
) {
  let latestEntry: CacheEntry<T, Result> | null = null;
  return makeCacheFunction({
    handler,
    compareArgs: shallowEqual,
    getEntry: () => latestEntry,
    setEntry: (args, entry) => {
      latestEntry = entry;
    },
  });
}

/**
 * A query 'cache' function that uses strict comparison to cache the most
 * recent calculated result based on the value of the argument.
 */
export function queryCacheStrict<T extends BaseResource, Result extends CacheResult>(
  handler: CacheHandler<T, Result>
) {
  let latestEntry: CacheEntry<T, Result> | null = null;
  return makeCacheFunction({
    handler,
    compareArgs: strictEqual,
    getEntry: () => latestEntry,
    setEntry: (args, entry) => {
      latestEntry = entry;
    },
  });
}

export type CacheHandler<T extends BaseResource, Result extends CacheResult> = (
  state: ResourceState<T>,
  context: CacheContext,
  result: Result | null
) => Result;

export interface CacheContext {
  args: unknown;
  identMap: WeakMap<Record<string, unknown>, EmptyObject>;
}

export interface CacheEntry<T extends BaseResource, Result> {
  context: CacheContext;
  state: ResourceState<T>;
  result: Result;
}

export interface CacheResult<MappedResult = unknown, ReducedResult = unknown> {
  mapped: MappedResult[];
  reduced: ReducedResult;
}

export interface CacheInfo<T extends BaseResource, Result extends CacheResult> {
  handler: CacheHandler<T, Result>;
  getEntry: (args: unknown) => CacheEntry<T, Result> | null;
  setEntry: (args: unknown, entry: CacheEntry<T, Result>) => void;
  compareArgs: ComparisonFunction<unknown>;
}

function makeCacheFunction<T extends BaseResource, Result extends CacheResult>(
  info: CacheInfo<T, Result>
) {
  const { handler, compareArgs, getEntry, setEntry } = info;

  return (state: ResourceState<T>, args: unknown) => {
    let entry = getEntry(args);

    const sameArgs = !!entry && compareArgs(entry.context.args, args);
    const sameState = !!entry && entry.state === state;

    if (!entry || !sameArgs || !sameState) {
      const context =
        !entry || !sameArgs
          ? {
              args,
              identMap: new WeakMap(),
            }
          : entry.context;

      const result = handler(state, context, entry ? entry.result : null);

      if (entry) {
        entry.context = context;
        entry.state = state;
        entry.result = result;
      } else {
        entry = {
          context,
          state,
          result,
        };
        setEntry(args, entry);
      }
    }

    return entry.result.reduced;
  };
}
