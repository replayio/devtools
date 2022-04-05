/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

export type EmptyObject = {
  [K in any]: never;
};

export type ResourceId = string;

export interface BaseResource {
  id: ResourceId;
}

export interface ResourceState<T extends BaseResource> {
  identity: Record<ResourceId, EmptyObject>;
  values: Record<ResourceId, T>;
}

export function createInitial<T extends BaseResource>(): ResourceState<T> {
  return {
    identity: {},
    values: {},
  };
}

export function insertResources<T extends BaseResource>(state: ResourceState<T>, resources: T[]) {
  if (resources.length === 0) {
    return state;
  }

  state = {
    identity: { ...state.identity },
    values: { ...state.values },
  };

  for (const resource of resources) {
    const { id } = resource;
    if (state.identity[id]) {
      throw new Error(`Resource "${id}" already exists, cannot insert ${Error().stack}`);
    }
    if (state.values[id]) {
      throw new Error(`Resource state corrupt: ${id} has value but no identity`);
    }

    state.identity[resource.id] = makeIdentity();
    state.values[resource.id] = resource;
  }
  return state;
}

export function removeResources<T extends BaseResource>(
  state: ResourceState<T>,
  resources: (ResourceId | BaseResource)[]
) {
  if (resources.length === 0) {
    return state;
  }

  state = {
    identity: { ...state.identity },
    values: { ...state.values },
  };

  for (let id of resources) {
    if (typeof id !== "string") {
      id = id.id;
    }

    if (!state.identity[id]) {
      throw new Error(`Resource "${id}" does not exists, cannot remove`);
    }
    if (!state.values[id]) {
      throw new Error(`Resource state corrupt: ${id} has identity but no value`);
    }

    delete state.identity[id];
    delete state.values[id];
  }
  return state;
}

export function updateResources<T extends BaseResource>(
  state: ResourceState<T>,
  resources: (BaseResource & Partial<T>)[]
) {
  if (resources.length === 0) {
    return state;
  }

  let didCopyValues = false;

  for (const subset of resources) {
    const { id } = subset;

    if (!state.identity[id]) {
      throw new Error(`Resource "${id}" does not exists, cannot update`);
    }
    if (!state.values[id]) {
      throw new Error(`Resource state corrupt: ${id} has identity but no value`);
    }

    const existing = state.values[id];
    const updated = {};

    for (const field of Object.keys(subset)) {
      if (field === "id") {
        continue;
      }

      // @ts-ignore No guarantee keys in objects, etc
      if (subset[field] !== existing[field]) {
        // @ts-ignore
        updated[field] = subset[field];
      }
    }

    if (Object.keys(updated).length > 0) {
      if (!didCopyValues) {
        didCopyValues = true;
        state = {
          identity: state.identity,
          values: { ...state.values },
        };
      }

      state.values[id] = { ...existing, ...updated };
    }
  }

  return state;
}

export function makeIdentity(): EmptyObject {
  return {};
}

export function getValidatedResource<T extends BaseResource>(
  state: ResourceState<T>,
  id: ResourceId
) {
  const value = state.values[id];
  const identity = state.identity[id];
  if ((value && !identity) || (!value && identity)) {
    throw new Error(`Resource state corrupt: ${id} has mismatched value and identity`);
  }

  return value ? state : null;
}

export function getResourceValues<T extends BaseResource>(state: ResourceState<T>) {
  return state.values;
}
