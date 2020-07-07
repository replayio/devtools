/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import { objectInspector } from "devtools-reps";
import { getBindingVariables } from "./getVariables";
import { getFramePopVariables, getThisVariable } from "./utils";
import { simplifyDisplayName } from "../../pause/frames";

import type { Frame, Why, Scope } from "../../../types";

import type { NamedValue } from "./types";

import { createElementsFront } from "protocol/thread";

export type RenderableScope = {
  type: $ElementType<Scope, "type">,
  scopeKind: $ElementType<Scope, "scopeKind">,
  actor: $ElementType<Scope, "actor">,
  bindings: $ElementType<Scope, "bindings">,
  parent: ?RenderableScope,
  object?: ?Object,
  function?: ?{
    displayName: string,
  },
  block?: ?{
    displayName: string,
  },
};

const {
  utils: {
    node: { NODE_TYPES },
  },
} = objectInspector;

// Normally, we show all variables found on a scope, using the name of that
// variable. When a scope chain has original names, we make some changes to
// avoid showing confusing names that aren't present in the displayed source.
//
// - Variables without an original name are hidden, with some exceptions.
//
// - Function scopes are named after the closest in scope original name,
//   and are treated as anonymous if there is no such name.

export function hasOriginalNames(scope) {
  while (scope) {
    for (const { originalName } of scope.bindings || []) {
      if (originalName) {
        return true;
      }
    }
    scope = scope.parent;
  }
  return false;
}

function findOriginalName(scope, targetName) {
  while (scope) {
    for (const { name, originalName } of scope.bindings || []) {
      if (name == targetName) {
        return originalName;
      }
    }
    scope = scope.parent;
  }
  return null;
}

function getScopeTitle(type, scope: RenderableScope, useOriginalNames) {
  if (type === "block" && scope.block && scope.block.displayName) {
    return scope.block.displayName;
  }

  if (type === "function" && scope.callee) {
    const name = scope.callee.functionName();
    if (name) {
      if (useOriginalNames) {
        // Look in the parent scope, which is where the function will be defined.
        const originalName = findOriginalName(scope.parent, name);
        if (originalName) {
          return originalName;
        } else {
          return L10N.getStr("anonymousFunction");
        }
      } else {
        return simplifyDisplayName(name);
      }
    } else {
      return L10N.getStr("anonymousFunction");
    }
  }
  return L10N.getStr("scopes.block");
}

export function getScope(
  scope: RenderableScope,
  selectedFrame: Frame,
  frameScopes: RenderableScope,
  why: Why,
  scopeIndex: number
): ?NamedValue {
  const { type, actor } = scope;

  const isLocalScope = scope.actor === frameScopes.actor;
  const useOriginalNames = hasOriginalNames(frameScopes);

  const key = `${actor}-${scopeIndex}`;
  if (type === "function" || type === "block") {
    const { bindings } = scope;

    let vars = getBindingVariables(bindings, key, useOriginalNames);

    // show exception, return, and this variables in innermost scope
    if (isLocalScope) {
      vars = vars.concat(getFramePopVariables(why, key));

      let thisDesc_ = selectedFrame.this;

      if (bindings && "this" in bindings) {
        // The presence of "this" means we're rendering a "this" binding
        // generated from mapScopes and this can override the binding
        // provided by the current frame.
        thisDesc_ = bindings.this ? bindings.this.value : null;
      }

      const this_ = getThisVariable(thisDesc_, key);

      if (this_) {
        vars.push(this_);
      }
    }

    if (vars && vars.length) {
      const title = getScopeTitle(type, scope, useOriginalNames) || "";
      vars.sort((a, b) => a.name.localeCompare(b.name));
      return {
        name: title,
        path: key,
        contents: createElementsFront(vars),
        type: NODE_TYPES.BLOCK,
      };
    }
  } else if (scope.object) {
    let value = scope.object;
    // If this is the global window scope, mark it as such so that it will
    // preview Window: Global instead of Window: Window
    /*
    if (value.className() === "Window") {
      value = { ...scope.object, displayClass: "Global" };
    }
    */
    return {
      name: value.className(),
      path: key,
      contents: value,
    };
  }

  return null;
}

export function mergeScopes(
  scope: RenderableScope,
  parentScope: RenderableScope,
  item: NamedValue,
  parentItem: NamedValue
) {
  if (scope.scopeKind == "function lexical" && parentScope.type == "function") {
    const contents = item.contents.getChildren().concat(parentItem.contents.getChildren());
    contents.sort((a, b) => a.name.localeCompare(b.name));

    return {
      name: parentItem.name,
      path: parentItem.path,
      contents: createElementsFront(contents),
      type: NODE_TYPES.BLOCK,
    };
  }
}
