/* eslint max-nested-callbacks: ["error", 4] */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow
import { toPairs } from "lodash";

import type { NamedValue } from "./types";
import type { BindingContents, ScopeBindings } from "../../../types";

// VarAndBindingsPair actually is [name: string, contents: BindingContents]
type VarAndBindingsPair = [string, any];
type VarAndBindingsPairs = Array<VarAndBindingsPair>;

// Scope's bindings field which holds variables and arguments
type ScopeBindingsWrapper = {
  variables: ScopeBindings,
  arguments: BindingContents[],
};

// Create the tree nodes representing all the variables and arguments
// for the bindings from a scope.
export function getBindingVariables(
  bindings: ?ScopeBindingsWrapper,
  parentName: string,
  useOriginalNames: boolean
): NamedValue[] {
  if (!bindings) {
    return [];
  }

  // See getScope.js for the rationale behind this logic.
  const rv = [];
  for (const { name, originalName, value } of bindings) {
    let newName;
    if (useOriginalNames) {
      if (originalName) {
        newName = originalName;
      } else if (name == "arguments") {
        // Show "arguments" even when it has no original name.
        newName = name;
      }
    } else {
      newName = name;
    }
    if (newName) {
      rv.push({
        name: newName,
        path: `${parentName}/${name}`,
        contents: value,
      });
    }
  }
  return rv;
}
