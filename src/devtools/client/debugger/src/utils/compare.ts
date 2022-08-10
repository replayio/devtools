/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

export type ComparisonFunction<T = unknown> = (a: T, b: T) => boolean;

export function strictEqual(value: unknown, other: unknown) {
  return value === other;
}

export function shallowEqual(value: unknown, other: unknown) {
  return (
    value === other ||
    (Array.isArray(value) && Array.isArray(other) && arrayShallowEqual(value, other)) ||
    (isObject(value) && isObject(other) && objectShallowEqual(value, other))
  );
}

export function arrayShallowEqual(value: unknown[], other: unknown[]) {
  return value.length === other.length && value.every((k, i) => k === other[i]);
}

function objectShallowEqual(value: Record<string, unknown>, other: Record<string, unknown>) {
  const existingKeys = Object.keys(other);
  const keys = Object.keys(value);

  return (
    keys.length === existingKeys.length &&
    keys.every((k, i) => k === existingKeys[i]) &&
    keys.every(k => value[k] === other[k])
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && !!value;
}
