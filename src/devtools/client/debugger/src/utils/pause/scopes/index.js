/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import { getScope, mergeScopes, type RenderableScope } from "./getScope";

import type { Frame, Why, BindingContents } from "../../../types";

const { DisallowEverythingProxyHandler } = require("protocol/utils");

export type NamedValue = {
  name: string,
  generatedName?: string,
  path: string,
  contents: BindingContents | NamedValue[],
};

export function getScopes(
  why: ?Why,
  selectedFrame: Frame,
  frameScopes: ?RenderableScope
): ?(NamedValue[]) {
  if (!selectedFrame) {
    return null;
  }

  if (!frameScopes) {
    return null;
  }

  const scopes = [];

  let scope = frameScopes;
  let scopeIndex = 1;
  let prev = null,
    prevItem = null;

  while (scope) {
    let scopeItem = getScope(
      scope,
      selectedFrame,
      frameScopes,
      why,
      scopeIndex
    );

    if (scopeItem) {
      const mergedItem =
        prev && prevItem ? mergeScopes(prev, scope, prevItem, scopeItem) : null;
      if (mergedItem) {
        scopeItem = mergedItem;
        scopes.pop();
      }
      scopes.push(scopeItem);
    }
    prev = scope;
    prevItem = scopeItem;
    scopeIndex++;
    scope = scope.parent;
  }

  return scopes;
}

export function ScopeFront(scope) {
  this._scope = scope;
}

ScopeFront.prototype = {
  isPrimitive() { return false; },
  isObject() { return false; },
  isMapEntry() { return false; },
  isUnavailable() { return false; },
  isUninitialized() { return false; },
  className() { return undefined; },
  hasPreview() { return false; },
  isString() { return false; },
  maybeObjectId() { return this._scope.path; },

  isScope() { return true; },
  hasChildren() { return true; },

  getChildren() {
    const { contents } = this._scope;
    return contents.map(({ contents, name }) => ({ contents: contents.value, name }));
  },

  async loadChildren() {
    return this.getChildren();
  },
};

Object.setPrototypeOf(ScopeFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));
