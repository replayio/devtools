/* eslint max-nested-callbacks: ["error", 4] */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { ValueItem } from "devtools/packages/devtools-reps";

// VarAndBindingsPair actually is [name: string, contents: BindingContents]

// Scope's bindings field which holds variables and arguments

// Create the tree nodes representing all the variables and arguments
// for the bindings from a scope.
export function getBindingVariables(bindings: any, parentName: string) {
  if (!bindings) {
    return [];
  }

  const rv = [];
  for (const { name, value } of bindings) {
    rv.push(
      new ValueItem({
        contents: value,
        name,
        path: `${parentName}/${name}`,
      })
    );
  }
  return rv;
}
