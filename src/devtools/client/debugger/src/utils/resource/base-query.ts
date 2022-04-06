/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import {
  getResourceValues,
  getValidatedResource,
  makeIdentity,
  BaseResource,
  ResourceState,
  EmptyObject,
  ResourceId,
} from "./core";
import { arrayShallowEqual, ComparisonFunction } from "./compare";
import type { Mapper } from "./memoize";
import type { CacheContext, CacheHandler, CacheResult } from "./query-cache";

export function makeMapWithArgs<T extends BaseResource, Result>(map: Mapper<T, Result>) {
  const wrapper = (resource: ResourceState<T>, identity: any, args: unknown) =>
    // @ts-ignore
    map(resource, identity, args);
  wrapper.needsArgs = true;
  return wrapper;
}

export function makeResourceQuery<
  T extends BaseResource,
  MapResult,
  ReduceResult,
  Args = unknown,
  FinalCacheResult extends CacheResult = CacheResult<MapResult, ReduceResult>
>({
  cache,
  filter,
  map,
  reduce,
  resultCompare,
}: {
  cache: (cacheHandler: CacheHandler<T, MapResult, ReduceResult>) => ReduceResult;
  filter: (values: Record<string, T>, args: Args) => ResourceId[];
  map: Mapper<T, MapResult>;
  reduce: (mapped: MapResult[], ids: ResourceId[], args: unknown) => ReduceResult;
  resultCompare: ComparisonFunction<ReduceResult>;
}): (resource: ResourceState<T>, args?: Args) => ReduceResult {
  const loadResource = makeResourceMapper(map);

  // @ts-ignore
  return cache(
    // @ts-ignore
    (
      state: ResourceState<T>,
      context: CacheContext,
      // @ts-ignore
      existing: FinalCacheResult
      // @ts-ignore
    ): FinalCacheResult => {
      // @ts-ignore context args is unknown
      const ids = filter(getResourceValues(state), context.args);
      const mapped = ids.map(id => loadResource(state, id, context));

      if (existing && arrayShallowEqual(existing.mapped, mapped)) {
        // If the items are exactly the same as the existing ones, we return
        // early to reuse the existing result.
        return existing;
      }

      const reduced = reduce(mapped, ids, context.args);

      // @ts-ignore
      if (existing && resultCompare(existing.reduced, reduced)) {
        return existing;
      }

      return { mapped, reduced } as FinalCacheResult;
    }
  );
}

function makeResourceMapper<T extends BaseResource, MapResult>(
  map: Mapper<T, MapResult> & { needsArgs?: boolean }
) {
  return map.needsArgs ? makeResourceArgsMapper(map) : makeResourceNoArgsMapper(map);
}

/**
 * Resources loaded when things care about arguments need to be given a
 * special ResourceIdentity object that correlates with both the resource
 * _and_ the arguments being passed to the query. That means they need extra
 * logic when loading those resources.
 */
function makeResourceArgsMapper<T extends BaseResource, MapResult>(map: Mapper<T, MapResult>) {
  const mapper = (value: T, identity: EmptyObject, context: CacheContext) =>
    map(value, getIdentity(context.identMap, identity), context.args);
  return (state: ResourceState<T>, id: ResourceId, context: CacheContext) =>
    getCachedResource(state, id, context, mapper);
}

function makeResourceNoArgsMapper<T extends BaseResource, MapResult>(map: Mapper<T, MapResult>) {
  const mapper = (value: T, identity: EmptyObject, context: CacheContext) => map(value, identity);
  return (state: ResourceState<T>, id: ResourceId, context: CacheContext) =>
    getCachedResource(state, id, context, mapper);
}

function getCachedResource<T extends BaseResource, MapResult>(
  state: ResourceState<T>,
  id: ResourceId,
  context: CacheContext,
  map: (value: T, identity: EmptyObject, context: CacheContext) => MapResult
) {
  const validatedState = getValidatedResource(state, id);
  if (!validatedState) {
    throw new Error(`Resource ${id} does not exist`);
  }

  return map(validatedState.values[id], validatedState.identity[id], context);
}

function getIdentity(identMap: WeakMap<any, EmptyObject>, identity: any) {
  let ident = identMap.get(identity);
  if (!ident) {
    ident = makeIdentity();
    identMap.set(identity, ident);
  }

  return ident;
}
