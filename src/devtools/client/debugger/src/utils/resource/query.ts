/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { makeResourceQuery } from "./base-query";

import { queryCacheWeak, queryCacheShallow, queryCacheStrict, CacheResult } from "./query-cache";

import { memoizeResourceShallow, Mapper } from "./memoize";
import { shallowEqual } from "./compare";
import { BaseResource, ResourceState, ResourceId } from "./core";

export function filterAllIds<T>(values: Record<string, T>) {
  return Object.keys(values);
}

/**
 * Create a query function to take a list of IDs and map each Reduceding
 * resource object into a mapped form.
 */
export function makeWeakQuery<T extends BaseResource, MapResult, ReduceResult, Args = unknown>({
  filter,
  map,
  reduce,
}: {
  filter: (values: Record<string, T>, args: Args) => ResourceId[];
  map: Mapper<T, MapResult>;
  reduce: (mapped: MapResult[], ids: ResourceId[], args: unknown) => ReduceResult;
}) {
  return makeResourceQuery<T, MapResult, ReduceResult, Args>({
    // @ts-ignore
    cache: queryCacheWeak,
    filter,
    map: memoizeResourceShallow(map),
    reduce,
    resultCompare: shallowEqual,
  });
}

/**
 * Create a query function to take a list of IDs and map each Reduceding
 * resource object into a mapped form.
 */
export function makeShallowQuery<T extends BaseResource, MapResult, ReduceResult, Args = unknown>({
  filter,
  map,
  reduce,
}: {
  filter: (values: Record<string, T>, args: Args) => ResourceId[];
  map: Mapper<T, MapResult>;
  reduce: (mapped: MapResult[], ids: ResourceId[], args: unknown) => ReduceResult;
}) {
  return makeResourceQuery({
    // @ts-ignore
    cache: queryCacheShallow,
    filter,
    map: memoizeResourceShallow(map),
    reduce,
    resultCompare: shallowEqual,
  });
}

/**
 * Create a query function to take a list of IDs and map each Reduceding
 * resource object into a mapped form.
 */
export function makeStrictQuery<T extends BaseResource, MapResult, ReduceResult, Args = unknown>({
  filter,
  map,
  reduce,
}: {
  filter: (values: Record<string, T>, args: Args) => ResourceId[];
  map: Mapper<T, MapResult>;
  reduce: (mapped: MapResult[], ids: ResourceId[], args: unknown) => ReduceResult;
}) {
  return makeResourceQuery({
    // @ts-ignore
    cache: queryCacheStrict,
    filter,
    map: memoizeResourceShallow(map),
    reduce,
    resultCompare: shallowEqual,
  });
}

/**
 * Create a query function to take a list of IDs and map each Reduceding
 * resource object into a mapped form.
 */
export function makeIdQuery<T extends BaseResource, MapResult, Args = unknown[]>(
  map: Mapper<T, MapResult>
) {
  return makeWeakQuery<T, MapResult, MapResult[], Args>({
    // @ts-ignore
    filter: (state, ids: ResourceId[]) => ids,
    map: (r, identity) =>
      // @ts-ignore
      map(r, identity),
    reduce: items => items.slice(),
  });
}

/**
 * Create a query function to take a list of IDs and map each Reduceding
 * resource object into a mapped form.
 */
export function makeLoadQuery<T extends BaseResource, MapResult>(map: Mapper<T, MapResult>) {
  return makeWeakQuery<T, MapResult, Record<string, MapResult>>({
    // @ts-ignore
    filter: (state, ids: ResourceId[]) => ids,
    map: (r, identity) =>
      map(
        // @ts-ignore
        r,
        identity
      ),
    reduce: reduceMappedArrayToObject,
  });
}

/**
 * Create a query function that accepts an argument and can filter the
 * resource items to a subset before mapping each reduced resource.
 */
export function makeFilterQuery<T extends BaseResource, MapResult>(
  filter: (item: T, args: unknown) => boolean,
  map: Mapper<T, MapResult>
) {
  return makeWeakQuery({
    filter: (values, args) => {
      const ids = [];
      for (const id of Object.keys(values)) {
        if (filter(values[id], args)) {
          ids.push(id);
        }
      }
      return ids;
    },
    map,
    reduce: reduceMappedArrayToObject,
  });
}

/**
 * Create a query function that accepts an argument and can filter the
 * resource items to a subset before mapping each resulting resource.
 */
export function makeReduceQuery<T extends BaseResource, MapResult, ReduceResult>(
  map: Mapper<T, MapResult>,
  reduce: (mapped: MapResult[], ids: string[], args: unknown) => ReduceResult
) {
  return makeShallowQuery({
    filter: filterAllIds,
    map,
    reduce,
  });
}

/**
 * Create a query function that accepts an argument and can filter the
 * resource items to a subset before mapping each resulting resource.
 */
export function makeReduceAllQuery<T extends BaseResource, MapResult, ReduceResult, Args = unknown>(
  map: Mapper<T, MapResult>,
  reduce: (mapped: MapResult[], ids: string[], args: unknown) => ReduceResult
) {
  return makeStrictQuery<T, MapResult, ReduceResult, Args>({
    filter: filterAllIds,
    map,
    reduce,
  });
}

function reduceMappedArrayToObject<T = unknown>(items: T[], ids: string[], args: unknown) {
  return items.reduce((acc, item, i) => {
    acc[ids[i]] = item;
    return acc;
  }, {} as Record<string, T>);
}
