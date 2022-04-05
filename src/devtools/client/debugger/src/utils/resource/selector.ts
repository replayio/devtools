/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import {
  getValidatedResource,
  getResourceValues,
  BaseResource,
  ResourceState,
  ResourceId,
  EmptyObject,
} from "./core";

export function hasResource<T extends BaseResource>(state: ResourceState<T>, id: ResourceId) {
  return !!getValidatedResource(state, id);
}

export function getResourceIds<T extends BaseResource>(state: ResourceState<T>) {
  return Object.keys(getResourceValues(state));
}

export function getResource<T extends BaseResource>(
  state: ResourceState<T>,
  id: ResourceId | [ResourceId]
) {
  const finalId = Array.isArray(id) ? id[0] : id;
  const validatedState = getValidatedResource(state, finalId);
  if (!validatedState) {
    throw new Error(`Resource ${id} does not exist`);
  }
  return validatedState.values[finalId];
}

export function getMappedResource<T extends BaseResource, Result>(
  state: ResourceState<T>,
  id: ResourceId | [ResourceId],
  map: (value: T, identity: any, args?: any) => Result
) {
  const finalId = Array.isArray(id) ? id[0] : id;
  const validatedState = getValidatedResource(state, finalId);
  if (!validatedState) {
    throw new Error(`Resource ${id} does not exist`);
  }

  return map(validatedState.values[finalId], validatedState.identity[finalId]);
}
